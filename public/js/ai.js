import { WORLD_PRESETS, COSMIC_TIERS } from "./worlds.js";
import { computeDerivedStats, getSkillStageDetails } from "./engine.js";
import {
  ORIGIN_ENTITIES,
  CATALOG_PHYSIQUES,
  CATALOG_CONG_PHAP,
  CATALOG_CHIEN_PHAP,
  CATALOG_THUAT,
  MYTHIC_CREATURES,
} from "./catalog.js";

function pickRandomSample(arr, tier, count = 4) {
  const pool = arr.filter((x) => x.tier === tier || x.tier === Math.max(1, tier - 1));
  const src = pool.length >= count ? pool : arr;
  const copy = [...src];
  const out = [];
  while (out.length < count && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    narrative: { type: "STRING" },
    mode: { type: "STRING", enum: ["normal", "combat", "ngodao"] },
    choices: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          text: { type: "STRING" },
          statTag: { type: "STRING" },
          risk: { type: "STRING" },
        },
        required: ["text", "statTag"],
      },
    },
    enemy: {
      type: "OBJECT",
      nullable: true,
      properties: {
        name: { type: "STRING" },
        realm: { type: "STRING" },
        hp: { type: "INTEGER" },
        maxHp: { type: "INTEGER" },
        maxHpChanged: { type: "BOOLEAN", nullable: true },
        hpHealed: { type: "BOOLEAN", nullable: true },
        intent: { type: "STRING" },
      },
    },
    ngodaoQuestion: { type: "STRING", nullable: true },
    stateChanges: {
      type: "OBJECT",
      properties: {
        hpDelta: { type: "INTEGER" },
        mpDelta: { type: "INTEGER" },
        cultivationDelta: { type: "INTEGER" },
        potentialDelta: { type: "INTEGER" },
        ageDelta: { type: "INTEGER" },
        primaryCurrencyDelta: { type: "INTEGER" },
        contribDelta: { type: "INTEGER" },
        statDeltas: {
          type: "OBJECT",
          properties: {
            cancot: { type: "INTEGER" },
            tamtin: { type: "INTEGER" },
            linhhon: { type: "INTEGER" },
            ngotinh: { type: "INTEGER" },
            thienphu: { type: "INTEGER" },
            khivan: { type: "INTEGER" },
            congduc: { type: "INTEGER" },
            nghiepluc: { type: "INTEGER" },
            nhanduyen: { type: "INTEGER" },
            danhvong: { type: "INTEGER" },
          },
        },
        armorDelta: { type: "INTEGER" },
        resistDeltas: {
          type: "OBJECT",
          properties: {
            physical: { type: "INTEGER" },
            magic: { type: "INTEGER" },
            soul: { type: "INTEGER" },
            poison: { type: "INTEGER" },
            law: { type: "INTEGER" },
          },
        },
        newItems: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              type: { type: "STRING" },
              slot: { type: "STRING", enum: ["armor", "weapon", "accessory"], nullable: true },
              qty: { type: "INTEGER" },
              armorBonus: { type: "INTEGER", nullable: true },
              resistBonus: {
                type: "OBJECT",
                nullable: true,
                properties: {
                  physical: { type: "INTEGER" },
                  magic: { type: "INTEGER" },
                  soul: { type: "INTEGER" },
                  poison: { type: "INTEGER" },
                  law: { type: "INTEGER" },
                },
              },
              statBonuses: {
                type: "OBJECT",
                nullable: true,
                properties: {
                  cancot: { type: "INTEGER" },
                  tamtin: { type: "INTEGER" },
                  linhhon: { type: "INTEGER" },
                  ngotinh: { type: "INTEGER" },
                  thienphu: { type: "INTEGER" },
                  khivan: { type: "INTEGER" },
                },
              },
              effects: { type: "STRING", nullable: true },
              grantedSkills: {
                type: "ARRAY",
                nullable: true,
                items: {
                  type: "OBJECT",
                  properties: {
                    name: { type: "STRING" },
                    category: { type: "STRING" },
                    grade: { type: "STRING" },
                    tier: { type: "INTEGER" },
                    level: { type: "INTEGER" },
                    mastery: { type: "INTEGER" },
                    daoIntent: { type: "STRING" },
                    effect: { type: "STRING" },
                  },
                },
              },
              desc: { type: "STRING" },
            },
          },
        },
        newSkills: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              category: { type: "STRING" },
              grade: { type: "STRING" },
              tier: { type: "INTEGER" },
              level: { type: "INTEGER" },
              mastery: { type: "INTEGER" },
              daoIntent: { type: "STRING" },
              effect: { type: "STRING" },
            },
          },
        },
        relationshipUpdates: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              type: { type: "STRING" },
              affinityDelta: { type: "INTEGER" },
              status: { type: "STRING" },
            },
          },
        },
        parallelRealm: { type: "STRING", nullable: true },
        realmUpdate: { type: "STRING", nullable: true },
        physiqueUpdate: { type: "STRING", nullable: true },
        physiqueProgressDelta: { type: "INTEGER" },
        timelineUpdate: { type: "STRING", nullable: true },
        newCausalAnchor: { type: "STRING", nullable: true },
        systemAlert: { type: "STRING", nullable: true },
      },
    },
    summaryUpdate: { type: "STRING" },
    hiddenNotesUpdate: { type: "STRING" },
  },
  required: ["narrative", "mode", "choices", "stateChanges", "summaryUpdate", "hiddenNotesUpdate"],
};

export function pickModel(settings, state, isMajorEvent = false) {
  if (settings.customModel) return settings.customModel;
  const pref = settings.modelMode || "auto";
  if (pref === "pro") return "gemini-3.8-pro";
  return "gemini-3.8-flash";
}

export function buildSystemPrompt(state) {
  const world = WORLD_PRESETS[state.worldId];
  const tierInfo = COSMIC_TIERS[state.player.tier - 1];
  const derived = computeDerivedStats(state.player);
  const p = state.player;
  const hiddenTail = String(state.hiddenNotes || "").slice(-700);
  const originEntity = ORIGIN_ENTITIES[p.physiqueGroup]?.[0];

  return `Bạn là Game Master (GM) tiểu thuyết tương tác đa vũ trụ tiếng Việt. Văn phong: ${world.styleRef}. Giọng: ${state.tone}.

=== BỐI CẢNH & NHÂN VẬT ===
- Thế giới: ${tierInfo.name} | Giới vực: ${state.currentParallelRealm} | Dòng TG: ${state.timeline || "Hiện Tại"} | ${state.isAfterlife ? "ÂM GIỚI (TU QUỶ)" : "Dương gian"} | Mỏ neo: ${(state.causalAnchors || []).slice(-4).join(" | ") || "Chưa có"}
- ${p.name} | ${p.originName} | Thể chất: ${p.physiqueName || "Phàm Thể"} (${p.physiqueGroup || "Cơ Bản"}, ${p.physiqueProgress || 0}%, T${p.tier}/5${p.tier >= 4 ? " HÓA ĐẠO" : ""}) | Bàn tay vàng: ${p.goldenName}
- Cảnh giới: ${p.realm} | Tuổi: ${p.age}/${p.lifespan} | HP: ${p.hp}/${p.maxHp} | MP: ${p.mp}/${p.maxMp} | Tu vi: ${p.cultivation}%
- Chỉ số: Căn cốt ${p.stats.cancot}, Tâm trí ${p.stats.tamtin}, Linh hồn ${p.stats.linhhon}, Ngộ tính ${p.stats.ngotinh}, Thiên phú ${p.stats.thienphu}, Khí vận ${p.stats.khivan}, Công đức ${p.stats.congduc}, Nghiệp lực ${p.stats.nghiepluc}, Nhân duyên ${p.stats.nhanduyen}, Danh vọng ${p.stats.danhvong} (May mắn thực ${derived.effectiveLuck}, Nhạy âm mưu ${derived.conspiracySense}).
- Thần Thức: ${derived.hasDivineSense ? "ĐÃ KHAI MỞ" : "CHƯA CÓ (dưới Hóa Thần cấm viết dùng thần thức, chỉ có ngũ quan/linh cảm)"}.
- Trang bị & Kháng: Giáp [${p.defense?.equippedArmor || "Không"}], Vũ khí [${p.equipment?.weapon || "Không"}], Phụ kiện [${p.equipment?.accessory || "Không"}], Giáp ${derived.baseArmor}, Kháng VL ${derived.effectiveResist.physical}% / Phép ${derived.effectiveResist.magic}% / Hồn ${derived.effectiveResist.soul}% / Độc ${derived.effectiveResist.poison}% / Luật ${derived.effectiveResist.law}%.${derived.equipmentEffects?.length ? ` Hiệu ứng: ${derived.equipmentEffects.join(" | ")}` : ""}
- Kỹ năng: ${p.skills.map((s) => `${s.name}${s.isDao ? "[ĐẠO]" : ""}(B${s.tier}L${s.level},${getSkillStageDetails(s).summaryText})`).join("; ")}
- Túi đồ: ${p.inventory.slice(-10).map((i) => `${i.name}x${i.qty}`).join("; ")}
- Nhân mạch: ${p.relationships.slice(-8).map((r) => `${r.name}[${r.type},${r.affinity}]`).join("; ")}${state.mode === "combat" && state.enemy ? `\n- ĐỊCH ĐANG CHIẾN (KHÓA maxHp): ${state.enemy.name} (${state.enemy.realm}) | HP: ${state.enemy.hp}/${state.enemy.maxHp} | Ý đồ: ${state.enemy.intent || "Đang đánh"}` : ""}
- Gợi ý T${p.tier}: Công pháp [${pickRandomSample(CATALOG_CONG_PHAP, p.tier, 2).map((x) => x.name).join(", ")}]; Chiến pháp [${pickRandomSample(CATALOG_CHIEN_PHAP, p.tier, 2).map((x) => x.name).join(", ")}]; Sinh vật [${pickRandomSample(MYTHIC_CREATURES, p.tier, 2).map((c) => c.name).join(", ")}].

=== ÂM MƯU ẨN (KHÔNG TIẾT LỘ TRỰC TIẾP, CHỈ RẢI MANH MỐI) ===
${hiddenTail}
- Liên kết gốc: ${originEntity?.name || "Đạo Nguyên Chi Tổ"} — ${originEntity?.secret || "Càng tu cao càng lộ chân tướng vật chứa."}
- Chỉ đạo Tác giả: ${state.authorDirectives || "Không."}

=== QUY TẮC ===
1. Dưới Hóa Thần tuyệt đối không viết dùng Thần Thức. Lồng ghép tông môn/thế gia/di tích/âm mưu/truyền công. ~15% lượt khám phá kích hoạt mode "ngodao" đặt câu hỏi triết học/vũ trụ.
2. Combat: đặt mode "combat", điền \`enemy\` ngắn gọn (HP tham chiếu: Luyện Khí 100-1k+, Trúc Cơ 1k-5k, Kim Đan 5k-10k, Nguyên Anh 10k-50k, Hóa Thần+ 50k+). Giữ nguyên \`enemy.maxHp\` và kế thừa \`enemy.hp\` từ lượt trước; chỉ đặt \`maxHpChanged=true\` khi có skill trừ/buff/giải Max HP, \`hpHealed=true\` khi hồi máu. \`hp<=0\` -> \`mode="normal"\`, \`enemy=null\`.
3. Tuân thủ kết quả xúc xắc/DMG từ Engine. Khi thất bại trước cường giả cao hơn -> trừ \`hpDelta\` cực nặng (có thể chết ngay).
4. CẤM ĐỘT PHÁ MỒM: Lượt thường không viết đã đột phá cảnh giới và để \`realmUpdate=null\` (trừ kỳ ngộ truyền công/bị phế).
5. \`potentialDelta\` mặc định 0 (chỉ thưởng khi ăn Thiên Tài Địa Bảo hoặc sáng tạo công pháp ≥80/100đ). Trang bị gắn \`slot\` (\`armor|weapon|accessory\`), \`statBonuses\`, \`armorBonus\`, \`resistBonus\`, \`effects\`.
6. \`choices\` (3-4 lựa chọn) PHẢI bám sát hoàn cảnh & vật phẩm/kỹ năng thực tế đang có; \`statTag\` chỉ dùng: \`Căn cốt\`, \`Tâm trí\`, \`Linh hồn\`, \`Ngộ tính\`, \`Thiên phú\`, \`Khí vận\`.
7. \`narrative\` tiếng Việt giàu hình ảnh, 160–280 chữ.`;
}

const DIRECT_MODEL_CACHE = new Map();

async function fetchWithTimeout(url, options, timeoutMs = 30000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function postDirectGemini(apiKey, modelName, payload) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = structuredClone(payload);
  if (!modelName.toLowerCase().includes("pro")) {
    body.generationConfig = body.generationConfig || {};
    body.generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }
  let res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    45000
  );
  if (res.status === 400 && body.generationConfig?.thinkingConfig) {
    delete body.generationConfig.thinkingConfig;
    res = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      45000
    );
  }
  return res;
}

export async function listGeminiModels(apiKey) {
  const isLocal = /^(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.)/.test(location.hostname);
  if (isLocal) {
    try {
      const r = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      if (r.ok) {
        const d = await r.json();
        return d.models || [];
      }
    } catch {
      // Fallback to direct Google API
    }
  }
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
  const d = await r.json();
  if (!r.ok) throw new Error(d.error?.message || "Không quét được danh sách model");
  const excluded = ["omni", "image", "tts", "robotics", "computer-use", "embedding", "aqa", "audio"];
  return (d.models || [])
    .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
    .map((m) => m.name.replace(/^models\//, ""))
    .filter((n) => n.toLowerCase().includes("gemini") && !excluded.some((ex) => n.toLowerCase().includes(ex)))
    .sort()
    .reverse();
}

async function callGeminiProxyOrDirect({ apiKey, model, payload }) {
  const isLocal = /^(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.)/.test(location.hostname);
  if (isLocal) {
    try {
      const res = await fetchWithTimeout(
        "/api/gemini",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, model, payload }),
        },
        65000
      );
      if (res.status !== 404 && res.status !== 405) {
        const data = await res.json();
        if (!res.ok) {
          const detailMsg = data.details ? `\n${data.details}` : "";
          throw new Error(`${data.error || "Lỗi kết nối Gemini API"}${detailMsg}`);
        }
        return data;
      }
    } catch (e) {
      if (e.name === "AbortError") throw new Error("Gemini API quá thời gian chờ (65s). Hãy thử lại hoặc chọn model Flash trong ⚙️ Cài Đặt.");
      if (e.message && e.message.includes("Gemini API Error")) throw e;
    }
  }

  const wantPro = model.toLowerCase().includes("pro");
  const cacheKey = `${apiKey}:${wantPro}`;
  const storedCache = (() => {
    try { return JSON.parse(localStorage.getItem("dao_nguyen_model_cache") || "{}")[cacheKey]; } catch { return null; }
  })();
  const activeModel = DIRECT_MODEL_CACHE.get(cacheKey) || storedCache || model;

  let res;
  let data = {};
  let lastStatus = 500;
  const attempts = [];
  try {
    res = await postDirectGemini(apiKey, activeModel, payload);
    lastStatus = res.status;
    data = await res.json();
    if (res.ok) return { ...data, _resolvedModel: activeModel };
    attempts.push(`${activeModel}:${res.status}`);
  } catch (e) {
    lastStatus = e.name === "AbortError" ? 504 : 500;
    res = { status: lastStatus };
    attempts.push(`${activeModel}:${lastStatus}(${e.name || "err"})`);
  }

  if ([404, 429, 500, 503, 504].includes(lastStatus)) {
    DIRECT_MODEL_CACHE.delete(cacheKey);
    try {
      const m = JSON.parse(localStorage.getItem("dao_nguyen_model_cache") || "{}");
      delete m[cacheKey];
      localStorage.setItem("dao_nguyen_model_cache", JSON.stringify(m));
    } catch {}
    const models = await listGeminiModels(apiKey).catch(() => []);
    const score = (n) => {
      const low = n.toLowerCase();
      const tierMatch = (wantPro ? low.includes("pro") : low.includes("flash")) ? 1 : 0;
      const notLite = !low.includes("lite") ? 1 : 0;
      const notExp = !low.includes("exp") && !low.includes("preview") ? 1 : 0;
      return tierMatch * 4 + notLite * 2 + notExp;
    };
    const sorted = [...models].filter((c) => c !== activeModel).sort((a, b) => score(b) - score(a));
    for (const cand of sorted.slice(0, 5)) {
      try {
        const r2 = await postDirectGemini(apiKey, cand, payload);
        const d2 = await r2.json();
        if (r2.ok) {
          DIRECT_MODEL_CACHE.set(cacheKey, cand);
          try {
            const m = JSON.parse(localStorage.getItem("dao_nguyen_model_cache") || "{}");
            m[cacheKey] = cand;
            localStorage.setItem("dao_nguyen_model_cache", JSON.stringify(m));
          } catch {}
          return { ...d2, _resolvedModel: cand };
        }
        attempts.push(`${cand}:${r2.status}`);
        if (r2.status !== 404) {
          lastStatus = r2.status;
          data = d2;
        }
      } catch (e2) {
        const st = e2.name === "AbortError" ? 504 : 500;
        attempts.push(`${cand}:${st}`);
      }
    }
  }
  const detail = data.error?.message || "Quá thời gian chờ hoặc hết quota.";
  if (lastStatus === 429) {
    throw new Error(`Hết giới hạn lượt miễn phí (429): ${detail}\n💡 Mẹo: Free Tier giới hạn số lượt/phút (RPM) hoặc token/phút (TPM). Hãy đợi ~30–60 giây rồi gửi lại, hoặc vào ⚙️ Cài Đặt → 🔍 Quét chọn model Flash-Lite (quota cao hơn).\n[Đã thử: ${attempts.join(", ")}]`);
  }
  throw new Error(`Gemini API Error (${lastStatus}): ${detail}\n[Đã thử: ${attempts.join(", ")}]`);
}

export function getActiveProvider(settings = {}) {
  return settings.provider || "gemini";
}

export function getActiveApiKey(settings = {}) {
  const provider = getActiveProvider(settings);
  if (provider === "groq") return (settings.groqApiKey || "").trim();
  if (provider === "openrouter") return (settings.openrouterApiKey || "").trim();
  return (settings.apiKey || "").trim();
}

const OPENAI_JSON_FORMAT_HINT = `
=== BẮT BUỘC TRẢ VỀ ĐÚNG 1 JSON OBJECT HỢP LỆ (KHÔNG MARKDOWN) ===
{
  "narrative": "string (diễn biến chi tiết bằng tiếng Việt)",
  "mode": "normal | combat | ngodao",
  "choices": [{ "text": "string", "statTag": "Căn cốt | Tâm trí | Linh hồn | Ngộ tính | Thiên phú | Khí vận", "risk": "Thấp | Trung bình | Cao" }],
  "enemy": null | { "name": "string", "realm": "string", "hp": 100, "maxHp": 100, "maxHpChanged": false, "hpHealed": false, "intent": "string" },
  "ngodaoQuestion": null | "string",
  "stateChanges": {
    "hpDelta": 0, "mpDelta": 0, "cultivationDelta": 0, "potentialDelta": 0, "ageDelta": 0,
    "primaryCurrencyDelta": 0, "contribDelta": 0,
    "statDeltas": {}, "armorDelta": 0, "resistDeltas": {},
    "newItems": [], "newSkills": [], "relationshipUpdates": [],
    "parallelRealm": null, "realmUpdate": null, "physiqueUpdate": null, "physiqueProgressDelta": 0,
    "timelineUpdate": null, "newCausalAnchor": null, "systemAlert": null
  },
  "summaryUpdate": "string (1-2 câu tóm tắt lượt này)",
  "hiddenNotesUpdate": "string (ghi chú âm mưu ẩn nếu có)"
}`;

export async function listProviderModels(provider, apiKey) {
  if (provider === "groq") {
    const r = await fetchWithTimeout(
      "https://api.groq.com/openai/v1/models",
      { headers: { Authorization: `Bearer ${apiKey}` } },
      20000
    );
    const d = await r.json();
    if (!r.ok) throw new Error(d.error?.message || "Không quét được model Groq");
    const excluded = ["whisper", "tts", "guard", "safeguard"];
    const priority = (id) => {
      const low = id.toLowerCase();
      if (low.includes("llama-3.3-70b")) return 10;
      if (low.includes("qwen")) return 9;
      if (low.includes("llama-4")) return 8;
      if (low.includes("deepseek")) return 7;
      return 1;
    };
    return (d.data || [])
      .map((m) => m.id)
      .filter((id) => id && !excluded.some((ex) => id.toLowerCase().includes(ex)))
      .sort((a, b) => priority(b) - priority(a) || a.localeCompare(b));
  }
  if (provider === "openrouter") {
    const r = await fetchWithTimeout(
      "https://openrouter.ai/api/v1/models",
      { headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {} },
      20000
    );
    const d = await r.json();
    if (!r.ok) throw new Error(d.error?.message || "Không quét được model OpenRouter");
    const freeModels = (d.data || [])
      .map((m) => m.id)
      .filter((id) => id && id.endsWith(":free"));
    return freeModels.sort();
  }
  return listGeminiModels(apiKey);
}

async function callOpenAICompatible({ url, apiKey, model, systemPrompt, userContent, temperature = 0.85, extraHeaders = {}, providerName = "AI" }) {
  let res;
  let data = {};
  try {
    res = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...extraHeaders,
        },
        body: JSON.stringify({
          model,
          temperature,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
        }),
      },
      45000
    );
    data = await res.json().catch(() => ({}));
  } catch (e) {
    if (e.name === "AbortError") {
      throw new Error(`${providerName} API quá thời gian chờ (45s). Hãy thử lại.`);
    }
    throw new Error(`${providerName} lỗi kết nối: ${e.message}`);
  }
  if (!res.ok) {
    const msg = data.error?.message || `HTTP ${res.status}`;
    if (res.status === 429) {
      throw new Error(`${providerName} giới hạn lượt (429): ${msg}`);
    }
    throw new Error(`${providerName} API Error (${res.status}): ${msg}`);
  }
  const raw = data?.choices?.[0]?.message?.content || "";
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  if (!cleaned) throw new Error(`${providerName} không trả về nội dung hợp lệ.`);
  return JSON.parse(cleaned);
}

export async function callGeminiGM({ settings, state, userPrompt, isMajorEvent = false }) {
  const provider = getActiveProvider(settings);
  const apiKey = getActiveApiKey(settings);
  if (!apiKey) {
    throw new Error("NO_API_KEY");
  }

  const recentLogs = state.logs
    .slice(-3)
    .map((l) => {
      const txt = String(l.text || "").replace(/\n\[AI:[^\]]+\]$/, "").trim();
      const shortTxt = txt.length > 280 ? `${txt.slice(0, 280)}...` : txt;
      return l.type === "player" ? `[Người chơi]: ${shortTxt}` : `[Diễn biến]: ${shortTxt}`;
    })
    .join("\n");

  const summaryTail = String(state.storySummary || "").slice(-900);
  const fullUserContent = `Tóm tắt cốt truyện:\n${summaryTail}\n\nGần nhất:\n${recentLogs || "(Mới bắt đầu)"}\n\nLượt này:\n${userPrompt}`;

  let parsed;
  let modelUsed = "";

  if (provider === "groq" || provider === "openrouter") {
    const isGroq = provider === "groq";
    const groqFallbacks = [
      "meta-llama/llama-4-scout-17b-16e-instruct",
      "llama-3.3-70b-versatile",
      "qwen/qwen3-32b",
      "llama-3.1-8b-instant",
    ];
    const customM = (settings.customModel || "").trim();
    const candidates = isGroq
      ? customM
        ? [customM, ...groqFallbacks.filter((m) => m !== customM)]
        : groqFallbacks
      : [customM || "meta-llama/llama-3.3-70b-instruct:free"];
    const url = isGroq
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://openrouter.ai/api/v1/chat/completions";
    const extraHeaders = isGroq
      ? {}
      : { "HTTP-Referer": location.origin, "X-Title": "Dao Nguyen Chronicles" };
    let lastErr = null;
    for (const cand of candidates) {
      try {
        parsed = await callOpenAICompatible({
          url,
          apiKey,
          model: cand,
          systemPrompt: `${buildSystemPrompt(state)}\n${OPENAI_JSON_FORMAT_HINT}`,
          userContent: fullUserContent,
          temperature: 0.85,
          extraHeaders,
          providerName: isGroq ? "Groq" : "OpenRouter",
        });
        modelUsed = cand;
        break;
      } catch (err) {
        lastErr = err;
        if (!/(429|404|400)/.test(err.message)) throw err;
      }
    }
    if (!parsed) throw lastErr || new Error("Không gọi được model.");
  } else {
    const model = pickModel(settings, state, isMajorEvent);
    const payload = {
      systemInstruction: {
        parts: [{ text: buildSystemPrompt(state) }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: fullUserContent }],
        },
      ],
      generationConfig: {
        temperature: 0.9,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    };

    const data = await callGeminiProxyOrDirect({ apiKey, model, payload });

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("Gemini không trả về nội dung hợp lệ.");
    }
    parsed = JSON.parse(rawText);
    modelUsed = data._resolvedModel || model;
  }

  parsed.narrative = parsed.narrative || "...";
  parsed.mode = ["normal", "combat", "ngodao"].includes(parsed.mode) ? parsed.mode : "normal";
  parsed.choices = Array.isArray(parsed.choices) ? parsed.choices : [];
  parsed.stateChanges = parsed.stateChanges || {};

  if (parsed.enemy) {
    const cleanField = (str, maxLen) =>
      String(str || "")
        .split(/(?:JSON schema|validator|combat mode|system enemy|control character)/i)[0]
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxLen);
    parsed.enemy.name = cleanField(parsed.enemy.name, 65) || "Địch Thủ";
    parsed.enemy.realm = cleanField(parsed.enemy.realm, 40) || "Không rõ";
    parsed.enemy.intent = cleanField(parsed.enemy.intent, 140) || "Chuẩn bị ra chiêu.";
  }

  return {
    modelUsed,
    result: parsed,
  };
}

export async function compactStoryMemory({ settings, state }) {
  const provider = getActiveProvider(settings);
  const apiKey = getActiveApiKey(settings);
  if (!apiKey) return null;

  const prompt = `Hãy nén (compact) tóm tắt cốt truyện và sổ tay âm mưu dưới đây thành bản cực kỳ súc tích để tiết kiệm token nhưng KHÔNG làm mất các sự kiện cốt lõi, tên NPC quan trọng, ân oán, lời hứa và âm mưu đang diễn ra.

=== TÓM TẮT HIỆN TẠI ===
${state.storySummary}

=== SỔ TAY ÂM MƯU ẨN ===
${state.hiddenNotes}`;

  if (provider === "groq" || provider === "openrouter") {
    const isGroq = provider === "groq";
    const model = (settings.customModel || "").trim() || (isGroq ? "llama-3.3-70b-versatile" : "meta-llama/llama-3.3-70b-instruct:free");
    const url = isGroq
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://openrouter.ai/api/v1/chat/completions";
    try {
      return await callOpenAICompatible({
        url,
        apiKey,
        model,
        systemPrompt: 'Trả về JSON object có đúng 2 trường: {"compactedSummary":"...","compactedHiddenNotes":"..."}',
        userContent: prompt,
        temperature: 0.3,
        providerName: isGroq ? "Groq" : "OpenRouter",
      });
    } catch {
      return null;
    }
  }

  const model = settings.customModel || "gemini-3.8-flash";
  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          compactedSummary: { type: "STRING" },
          compactedHiddenNotes: { type: "STRING" },
        },
        required: ["compactedSummary", "compactedHiddenNotes"],
      },
    },
  };

  try {
    const data = await callGeminiProxyOrDirect({ apiKey, model, payload });
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return rawText ? JSON.parse(rawText) : null;
  } catch {
    return null;
  }
}
