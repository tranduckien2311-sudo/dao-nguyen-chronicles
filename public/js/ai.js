import { WORLD_PRESETS, COSMIC_TIERS, BUILD_PATHS, WESTERN_CLASSES, WESTERN_GRIMOIRES, WESTERN_SPELLS, WESTERN_ITEMS } from "./worlds.js";
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
        afterlifeFormUpdate: { type: "STRING", nullable: true },
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

export function buildStaticSystemPrompt(state) {
  const world = WORLD_PRESETS[state.worldId];
  const isWest = state.worldId === "maphap";
  const westRule = isWest
    ? `\n7. TÂY VỰC: Cấm từ Tu Tiên (linh khí, đan điền, kinh mạch, đan dược, đạo hữu). Dùng: Ma Lực(Mana), Minh Tưởng, Ma Điển, Ấn Chú, Ma Dược, Huyết Mạch, Cổ Vật, Hội Pháp Sư.`
    : "";

  return `GM tiểu thuyết tương tác tiếng Việt. Văn phong:${world.styleRef}. Giọng:${state.tone}.
[LUẬT]
1. Mạch truyện TỪ NHỎ ĐẾN LỚN, TỪ YẾU ĐẾN MẠNH, chuyện nhỏ tăng dần (sinh hoạt đời thường, mâu thuẫn nhỏ, không nhảy cóc đại chiến). Người chơi là người bình thường (không hào quang nhân vật chính, nhưng không xui tận mạng). Hãm hại/hạ độc/hấp tinh/sập bẫy chỉ xảy ra khi vào hiểm địa, đắc tội kẻ xấu hoặc Đại Thất Bại. Dẫn dắt tự nhiên để sau này mới chọn Class/Nghề hoặc đổi physiqueUpdate qua công pháp/kì ngộ. Dưới Hóa Thần cấm Thần Thức. ~15% lượt thường mở mode="ngodao".
2. Combat: mode="combat", enemy ngắn (LuyệnKhí 100-1k+, TrúcCơ 1k-5k, KimĐan 5k-10k, NguyênAnh 10k-50k, HóaThần+ 50k+). Giữ nguyên enemy.maxHp & kế thừa enemy.hp; chỉ đặt maxHpChanged=true khi đổi MaxHP, hpHealed=true khi hồi máu. hp<=0 -> mode="normal", enemy=null.
3. Theo xúc xắc/DMG Engine; không biến câu hành động thành tên chiêu. Thất Bại -> hỏng việc/tổn nhẹ-vừa; Đại Thất Bại/hiểm địa -> có thể trúng bẫy, độc, hãm hại, hao tu vi (cultivationDelta<0). Text nhảm/vô nghĩa/lạc ngữ cảnh/tự bịa cơ duyên -> Thiên Phạt (-50..100% HP, 0 thưởng). Tìm chết/thua cường giả -> viết rõ bị nhìn thấu, chưởng chết/vạn kiếm xuyên tâm rồi hpDelta=-999999.
4. Lượt thường không đột phá mồm (realmUpdate=null). potentialDelta mặc định 0. Trang bị gắn slot(armor|weapon|accessory).
5. choices(3-4 mục) sát hoàn cảnh; statTag chỉ dùng: Căn cốt|Tâm trí|Linh hồn|Ngộ tính|Thiên phú|Khí vận.
6. narrative CỰC NGẮN (40-80 chữ), đi thẳng diễn biến & kết quả. summaryUpdate<=15 chữ.${westRule}`;
}

export function buildDynamicStateBlock(state) {
  const tierInfo = COSMIC_TIERS[state.player.tier - 1];
  const derived = computeDerivedStats(state.player);
  const p = state.player;
  const hiddenTail = String(state.hiddenNotes || "").slice(-220);
  const originEntity = ORIGIN_ENTITIES[p.physiqueGroup]?.[0];
  const isWest = state.worldId === "maphap";
  const buildObj = p.buildId
    ? WESTERN_CLASSES.find((b) => b.id === p.buildId) || BUILD_PATHS.find((b) => b.id === p.buildId)
    : null;
  const buildLabel = buildObj ? buildObj.name : "Chưa chọn";
  const profLabel = p.professions?.length ? p.professions.map((pr) => pr.name).join(",") : "Chưa có";
  const catalogHint =
    state.mode === "normal" && state.turn % 3 === 1
      ? isWest
        ? `\nGợi ý T${p.tier}: ${pickRandomSample(WESTERN_GRIMOIRES, p.tier, 1).map((x) => x.name)} | ${pickRandomSample(WESTERN_ITEMS, p.tier, 1).map((x) => x.name)}`
        : `\nGợi ý T${p.tier}: ${pickRandomSample(CATALOG_CONG_PHAP, p.tier, 1).map((x) => x.name)} | ${pickRandomSample(MYTHIC_CREATURES, p.tier, 1).map((c) => c.name)}`
      : "";
  const resEntries = Object.entries(derived.effectiveResist || {})
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k}:${v}%`)
    .join(" ");

  return `[NV] ${p.name} | ${p.originName} | Class:${buildLabel} | Nghề:${profLabel} | Thể:${p.physiqueName || "Phàm Thể"}(${p.physiqueProgress || 0}%,T${p.tier}) | BTV:${p.goldenName}
- ${tierInfo.short} | ${state.currentParallelRealm} | ${state.timeline || "Hiện Tại"}${state.isAfterlife ? (state.afterlifeForm === "ghost_body" ? " | QUỶ THỂ" : " | HỒN THỂ(CănCốt=0,HP=MP)") : ""} | ${p.realm} | Tuổi:${p.age}/${p.lifespan} | HP:${p.hp}/${p.maxHp} MP:${p.mp}/${p.maxMp} TuVi:${p.cultivation}%
- ChỉSố: CC ${p.stats.cancot}, TT ${p.stats.tamtin}, LH ${p.stats.linhhon}, NT ${p.stats.ngotinh}, TP ${p.stats.thienphu}, KV ${p.stats.khivan}, May ${derived.effectiveLuck}, Giáp ${derived.baseArmor}${resEntries ? `, Kháng[${resEntries}]` : ""}, ThầnThức:${derived.hasDivineSense ? "CÓ" : "0"}
- Skill: ${p.skills.slice(0, 3).map((s) => `${s.name}(B${s.tier}L${s.level})`).join("; ")}
- Đồ: ${p.inventory.slice(-4).map((i) => `${i.name}x${i.qty}`).join("; ")}
- QuanHệ: ${p.relationships.slice(-3).map((r) => `${r.name}[${r.affinity}]`).join("; ")}${state.mode === "combat" && state.enemy ? `\n- ĐỊCH: ${state.enemy.name}(${state.enemy.realm}) HP:${state.enemy.hp}/${state.enemy.maxHp} Ý:${state.enemy.intent || "Đánh"}` : ""}${catalogHint}
[ẨN] ${hiddenTail} | Gốc:${originEntity?.name || "Đạo Nguyên"} | ChỉĐạo:${state.authorDirectives || "0"}`;
}

export function buildSystemPrompt(state) {
  return `${buildStaticSystemPrompt(state)}\n${buildDynamicStateBlock(state)}`;
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

const OPENAI_JSON_FORMAT_HINT = `Trả đúng 1 JSON object: {"narrative":"str","mode":"normal|combat|ngodao","choices":[{"text":"str","statTag":"Căn cốt|Tâm trí|Linh hồn|Ngộ tính|Thiên phú|Khí vận","risk":"Thấp|TB|Cao"}],"enemy":null|{"name":"str","realm":"str","hp":0,"maxHp":0,"maxHpChanged":false,"hpHealed":false,"intent":"str"},"ngodaoQuestion":null|"str","stateChanges":{"hpDelta":0,"mpDelta":0,"cultivationDelta":0,"potentialDelta":0,"ageDelta":0,"primaryCurrencyDelta":0,"contribDelta":0,"statDeltas":{},"armorDelta":0,"resistDeltas":{},"newItems":[],"newSkills":[],"relationshipUpdates":[],"parallelRealm":null,"realmUpdate":null,"physiqueUpdate":null,"afterlifeFormUpdate":null,"physiqueProgressDelta":0,"timelineUpdate":null,"newCausalAnchor":null,"systemAlert":null},"summaryUpdate":"str","hiddenNotesUpdate":"str"}`;

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
    .slice(-1)
    .map((l) => {
      const txt = String(l.text || "").replace(/\n\[AI:[^\]]+\]$/, "").trim();
      const shortTxt = txt.length > 120 ? `${txt.slice(0, 120)}...` : txt;
      return l.type === "player" ? `[P]: ${shortTxt}` : `[GM]: ${shortTxt}`;
    })
    .join("\n");

  const summaryTail = String(state.storySummary || "").slice(-350);
  const staticSys = buildStaticSystemPrompt(state);
  const dynamicBlock = buildDynamicStateBlock(state);
  const fullUserContent = `${dynamicBlock}\n\nTóm tắt:${summaryTail}\nGần nhất:${recentLogs || "(Mới)"}\nLượt này:${userPrompt}`;

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
          systemPrompt: `${staticSys}\n${OPENAI_JSON_FORMAT_HINT}`,
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
        parts: [{ text: staticSys }],
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
