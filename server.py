import http.server
import json
import os
import socket
import time
import urllib.error
import urllib.request
from pathlib import Path

PORT = int(os.environ.get("PORT", 8765))
PUBLIC_DIR = Path(__file__).parent / "public"
MODEL_CACHE: dict[tuple[str, bool], str] = {}


def get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


class GameHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC_DIR), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def do_POST(self):
        if self.path == "/api/gemini":
            self._handle_gemini_proxy()
            return
        if self.path == "/api/models":
            self._handle_list_models()
            return
        self.send_error(404, "Not Found")

    def _handle_list_models(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length).decode("utf-8"))
            api_key = body.get("apiKey") or os.environ.get("GEMINI_API_KEY", "")
            if not api_key:
                self._send_json(400, {"error": "Thiếu Gemini API Key."})
                return
            models = self._find_available_models(api_key, "flash", limit=25)
            self._send_json(200, {"models": models})
        except Exception as e:
            self._send_json(500, {"error": str(e)})

    def _handle_gemini_proxy(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length).decode("utf-8"))
            api_key = body.get("apiKey") or os.environ.get("GEMINI_API_KEY", "")
            model = body.get("model", "gemini-3.8-flash")
            payload = body.get("payload", {})

            if not api_key:
                self._send_json(400, {"error": "Thiếu Gemini API Key."})
                return

            want_pro = "pro" in model.lower()
            cache_key = (api_key, want_pro)
            active_model = MODEL_CACHE.get(cache_key, model)
            if not want_pro:
                payload.setdefault("generationConfig", {})["thinkingConfig"] = {"thinkingBudget": 0}

            t0 = time.time()
            try:
                resp_json = self._post_gemini_smart(api_key, active_model, payload)
                print(f"[Gemini OK] model={active_model} time={time.time()-t0:.2f}s", flush=True)
                if active_model != model:
                    resp_json["_resolvedModel"] = active_model
                self._send_json(200, resp_json)
            except (urllib.error.HTTPError, TimeoutError, socket.timeout) as e:
                code = getattr(e, "code", 504)
                if code in (404, 429, 500, 503, 504):
                    candidates = self._find_available_models(api_key, model)
                    last_err = e
                    for cand in candidates:
                        if cand == active_model:
                            continue
                        try:
                            t1 = time.time()
                            resp_json = self._post_gemini_smart(api_key, cand, payload)
                            print(f"[Gemini Fallback OK] model={cand} time={time.time()-t1:.2f}s", flush=True)
                            MODEL_CACHE[cache_key] = cand
                            resp_json["_resolvedModel"] = cand
                            self._send_json(200, resp_json)
                            return
                        except (urllib.error.HTTPError, TimeoutError, socket.timeout) as retry_err:
                            last_err = retry_err
                            rc = getattr(retry_err, "code", 504)
                            if rc not in (404, 429, 500, 503, 504):
                                raise
                    raise last_err
                raise
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            self._send_json(e.code, {"error": f"Gemini API Error ({e.code})", "details": err_body})
        except Exception as e:
            self._send_json(500, {"error": str(e)})

    def _post_gemini_smart(self, api_key: str, model_name: str, payload: dict) -> dict:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        try:
            return self._post_gemini(url, payload)
        except urllib.error.HTTPError as e:
            if e.code == 400 and "thinkingConfig" in payload.get("generationConfig", {}):
                clean_payload = json.loads(json.dumps(payload))
                clean_payload["generationConfig"].pop("thinkingConfig", None)
                return self._post_gemini(url, clean_payload)
            raise

    def _post_gemini(self, url: str, payload: dict) -> dict:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=75) as resp:
            return json.loads(resp.read().decode("utf-8"))

    def _find_available_models(self, api_key: str, requested: str, limit: int = 15) -> list[str]:
        list_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
        with urllib.request.urlopen(list_url, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        raw_models = [
            m["name"].replace("models/", "")
            for m in data.get("models", [])
            if "generateContent" in m.get("supportedGenerationMethods", [])
        ]
        excluded = ("omni", "image", "tts", "robotics", "computer-use", "embedding", "aqa", "audio")
        models = [m for m in raw_models if "gemini" in m.lower() and not any(x in m.lower() for x in excluded)]
        want_pro = "pro" in requested.lower()

        def score(name: str) -> tuple:
            low = name.lower()
            tier_match = 1 if ("pro" in low if want_pro else "flash" in low) else 0
            not_lite = 1 if "lite" not in low else 0
            not_exp = 1 if ("exp" not in low and "preview" not in low) else 0
            return (tier_match, not_lite, not_exp, low)

        return sorted(models, key=score, reverse=True)[:limit]

    def _send_json(self, status: int, data: dict):
        raw = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)


if __name__ == "__main__":
    local_ip = get_local_ip()
    print("=" * 56)
    print("  DAO NGUYEN CHRONICLES - AI TEXT RPG SERVER")
    print("=" * 56)
    print(f"  Tren may tinh : http://localhost:{PORT}")
    print(f"  Tren dien thoai (cung Wi-Fi): http://{local_ip}:{PORT}")
    print("  Nhan Ctrl+C de dung server.")
    print("=" * 56)
    server = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), GameHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nDa dung server.")
