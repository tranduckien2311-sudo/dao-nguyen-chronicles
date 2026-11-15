import {
  WORLD_PRESETS,
  ORIGINS,
  GOLDEN_FINGERS,
  BUILD_PATHS,
  COSMIC_TIERS,
  SKILL_TIERS,
  PHYSIQUES,
  WESTERN_BLOODLINES,
  WESTERN_CLASSES,
  WESTERN_GRIMOIRES,
  WESTERN_SPELLS,
  WESTERN_ITEMS,
} from "./worlds.js";
import {
  CATALOG_PHYSIQUES,
  CATALOG_CONG_PHAP,
  CATALOG_CHIEN_PHAP,
  CATALOG_THUAT,
  MYTHIC_CREATURES,
} from "./catalog.js";
import {
  loadSettings,
  saveSettings,
  listSaves,
  saveGameState,
  deleteSave,
  computeDerivedStats,
  createNewGame,
  rollCheck,
  checkAbsurdOrSuicidalAction,
  resolveCombatCheck,
  resolveBreakthrough,
  resolveCustomTechnique,
  canCreateTechnique,
  enterAfterlife,
  canTimeTravel,
  getPhysiqueInfo,
  getContinuousLevel,
  getEquipSlot,
  toggleEquipItem,
  syncPhysiqueTierAbilities,
  syncTamSinhThachDaily,
  syncRealmVitals,
  getSkillStageDetails,
  applySkillLevelUpRewards,
  isSkillAtMaxCap,
  rollOriginByDice,
  rollGoldenFingerByDice,
  choosePlayerClass,
  choosePlayerProfession,
  pushSnapshot,
  exportNovelMarkdown,
} from "./engine.js";
import { callGeminiGM, compactStoryMemory, listProviderModels, getActiveProvider, getActiveApiKey } from "./ai.js";

let settings = loadSettings();
let state = null;
let isBusy = false;

const $ = (id) => document.getElementById(id);

function init() {
  bindStaticEvents();
  const saves = listSaves();
  if (saves.length > 0) {
    state = saves[0].state;
    if (syncRealmVitals(state)) saveGameState(state);
    renderAll();
  }
}

function bindStaticEvents() {
  $("btn-toggle-top").addEventListener("click", () => {
    $("top-panel").classList.toggle("collapsed");
  });

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      $(`tab-${btn.dataset.tab}`).classList.add("active");
    });
  });

  document.querySelectorAll(".close-modal").forEach((btn) => {
    btn.addEventListener("click", () => $(btn.dataset.close).classList.add("hidden"));
  });

  $("btn-open-new")?.addEventListener("click", openNewGameModal);
  $("btn-open-saves")?.addEventListener("click", openSettingsModal);
  $("btn-settings").addEventListener("click", openSettingsModal);
  $("btn-author").addEventListener("click", openAuthorModal);
  $("btn-timetravel").addEventListener("click", openTimeTravelModal);
  $("btn-breakthrough").addEventListener("click", handleBreakthrough);

  $("action-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const val = $("action-input").value.trim();
    if (!val || isBusy) return;
    $("action-input").value = "";
    handlePlayerAction(val, "text");
  });
}

function applyTheme() {
  if (!state) return;
  const theme = state.isAfterlife ? "amphu" : WORLD_PRESETS[state.worldId]?.theme || "tutien";
  document.documentElement.setAttribute("data-theme", theme);
}

function renderAll() {
  if (!state) return;
  applyTheme();
  renderTopHud();
  renderTabs();
  renderFeed();
  renderActionArea();
}

function renderTopHud() {
  const p = state.player;
  const lv = getContinuousLevel(state);
  p.continuousLevel = lv;
  $("hud-name").textContent = p.name;
  $("hud-tier-badge").textContent = `Tầng ${p.tier} • Lv.${lv}`;
  $("hud-afterlife-badge").classList.toggle("hidden", !state.isAfterlife);
  $("hud-realm").textContent = p.realm;
  $("hud-age").textContent = `${p.age}/${p.lifespan} tuổi`;
  $("hud-world-realm").textContent = state.currentParallelRealm;
  $("hud-timeline").textContent = state.timeline || "Hiện Tại";

  $("hp-text").textContent = `${p.hp}/${p.maxHp}`;
  $("hp-bar").style.width = `${Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100))}%`;
  $("mp-text").textContent = `${p.mp}/${p.maxMp}`;
  $("mp-bar").style.width = `${Math.max(0, Math.min(100, (p.mp / p.maxMp) * 100))}%`;
  $("tuvi-text").textContent = `${p.cultivation}%`;
  $("tuvi-bar").style.width = `${Math.max(0, Math.min(100, p.cultivation))}%`;

  const isWest = state.worldId === "maphap";
  const mpLbl = $("mp-text")?.previousElementSibling;
  if (mpLbl) mpLbl.textContent = isWest ? "Mana" : "Linh Lực";
  const tuviLbl = $("tuvi-text")?.previousElementSibling;
  if (tuviLbl) tuviLbl.textContent = isWest ? "Ma Lực / XP" : "Tu Vi";
  $("btn-breakthrough").textContent = isWest ? "⚡ Tấn Thăng" : "⚡ Đột Phá";
  const tabSkillsBtn = document.querySelector('.tab-btn[data-tab="skills"]');
  if (tabSkillsBtn) tabSkillsBtn.textContent = isWest ? "Ma Điển & Phép" : "Kỹ Năng";
  const tabBagBtn = document.querySelector('.tab-btn[data-tab="bag"]');
  if (tabBagBtn) tabBagBtn.textContent = isWest ? "Hành Trang" : "Túi & Nghề";

  $("btn-breakthrough").classList.toggle("hidden", p.cultivation < 100 || state.mode === "combat");
}

function renderTabs() {
  const p = state.player;
  const derived = computeDerivedStats(p, getContinuousLevel(state));
  const world = WORLD_PRESETS[state.worldId];
  const isWest = state.worldId === "maphap";

  // STATS TAB
  const statLabels = isWest
    ? [
        ["cancot", "Thể Lực"],
        ["tamtin", "Tinh Thần"],
        ["linhhon", "Linh Hồn"],
        ["ngotinh", "Tri Thức"],
        ["thienphu", "Thiên Phú"],
        ["khivan", "May Mắn"],
        ["congduc", "Ân Điển"],
        ["nghiepluc", "Tội Nghiệp"],
        ["nhanduyen", "Hảo Cảm"],
        ["danhvong", "Danh Tiếng"],
      ]
    : [
        ["cancot", "Căn Cốt"],
        ["tamtin", "Tâm Trí"],
        ["linhhon", "Linh Hồn"],
        ["ngotinh", "Ngộ Tính"],
        ["thienphu", "Thiên Phú"],
        ["khivan", "Khí Vận"],
        ["congduc", "Công Đức"],
        ["nghiepluc", "Nghiệp Lực"],
        ["nhanduyen", "Nhân Duyên"],
        ["danhvong", "Danh Vọng"],
      ];
  const allocatable = new Set(["cancot", "tamtin", "linhhon", "ngotinh", "thienphu", "khivan"]);

  const phyInfo = getPhysiqueInfo(p);
  const phyProg = p.physiqueProgress || 0;
  const tst = syncTamSinhThachDaily(p);
  const phyBonusText = Object.entries(phyInfo.effectiveBonus || {})
    .filter(([, v]) => typeof v === "number" && v > 0)
    .map(([k, v]) => `+${v} ${k}`)
    .join(", ");

  const currentBuild = p.buildId
    ? WESTERN_CLASSES.find((b) => b.id === p.buildId) || BUILD_PATHS.find((b) => b.id === p.buildId)
    : null;
  const isMortalBody = p.physiqueId === "phamthe" || p.physiqueId === "wb_human";

  $("tab-stats").innerHTML = `
    <div class="list-card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px;">
      <span>Thể chất: <strong style="color:var(--accent)">${escapeHtml(p.physiqueName || "Phàm Thể")}</strong> (${phyProg}%)${isMortalBody ? " <em style='font-size:10px;color:var(--muted);'>(Hình thành sau qua công pháp & kì ngộ)</em>" : ""}</span>
      <span>Điểm Tiềm Năng: <strong style="color:var(--accent)">${p.potentialPoints}</strong></span>
      <div style="width:100%;display:flex;justify-content:space-between;align-items:center;font-size:10.5px;color:var(--muted);">
        <span>${isWest ? "Class / Chức Nghiệp" : "Hướng Đạo / Class"}: <strong style="color:var(--text)">${currentBuild ? escapeHtml(currentBuild.name) : "Chưa định hình (Chọn sau theo mạch truyện)"}</strong></span>
        ${!currentBuild ? `<button id="btn-choose-class" class="mini-btn">⚔️ Chọn Class</button>` : ""}
      </div>
      ${phyBonusText ? `<span style="color:var(--muted);width:100%;font-size:10.5px;">Điểm gốc thể chất (mỗi lần lên Lv × Tầng): <strong style="color:var(--accent)">${phyBonusText}</strong></span>` : ""}
      ${
        phyInfo.nextName
          ? `<div style="width:100%;display:flex;justify-content:space-between;align-items:center;font-size:10.5px;color:var(--muted);">
               <span>Tiến hóa tiếp: <strong>${escapeHtml(phyInfo.nextName)}</strong></span>
               ${phyProg >= 100 ? `<button id="btn-evolve-physique" class="mini-btn">🔥 Lột Xác Thể Chất</button>` : ""}
             </div>`
          : ""
      }
      <span style="color:var(--muted);width:100%;">May mắn thực: <strong>${derived.effectiveLuck}</strong> • Tốc độ tu: <strong>${derived.cultivationSpeed}%</strong> • Độ hợp Pháp bảo: <strong>${derived.artifactSync}%</strong></span>
      <span style="color:var(--muted);width:100%;font-size:10.5px;">Thức tỉnh Thể Chất: <strong>${p.tier}/5 Tầng</strong> ${p.tier >= 4 ? "• <strong style='color:var(--accent)'>⚡ Thần Thông Đã Hóa Đạo</strong>" : "(Tầng 4+ Hóa Đạo)"}</span>
      <span style="color:var(--muted);width:100%;font-size:10.5px;">🪨 Tam Sinh Thạch: <strong style="color:var(--accent)">${tst.usesLeft}/${tst.maxPerDay}</strong> lần quay lại hôm nay (hết 3 lần hồn xuống Địa Phủ)</span>
    </div>
    <div class="stats-grid">
      ${statLabels
        .map(
          ([key, label]) => {
            const eqBonus = derived.equipStatBonuses?.[key] || 0;
            return `
        <div class="stat-chip">
          <span>${label}</span>
          <span>
            <strong>${p.stats[key]}</strong>${eqBonus ? `<span style="color:var(--accent);font-size:10px;"> (+${eqBonus} TB)</span>` : ""}
            ${
              p.potentialPoints > 0 && allocatable.has(key)
                ? `<button class="stat-plus" data-stat="${key}">+</button>`
                : ""
            }
          </span>
        </div>`;
          }
        )
        .join("")}
    </div>
    <div class="list-card" style="margin-top:6px;">
      <div class="list-card-head">
        <span>🛡️ Hộ Giáp: <strong style="color:var(--accent)">${derived.baseArmor}</strong></span>
        <span style="color:var(--muted);font-size:10.5px;">Giáp: ${escapeHtml(p.equipment?.armor || p.defense?.equippedArmor || "Không")} • Vũ khí: ${escapeHtml(p.equipment?.weapon || "Không")}</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;font-size:10.5px;color:var(--muted);">
        <span>Vật lý: <strong>${derived.effectiveResist.physical}%</strong></span>
        <span>• Phép: <strong>${derived.effectiveResist.magic}%</strong></span>
        <span>• Linh hồn: <strong>${derived.effectiveResist.soul}%</strong></span>
        <span>• Độc/Tà: <strong>${derived.effectiveResist.poison}%</strong></span>
        <span>• Quy tắc: <strong>${derived.effectiveResist.law}%</strong></span>
      </div>
      ${
        derived.equipmentEffects?.length
          ? `<div style="margin-top:4px;font-size:10.5px;color:var(--accent);">✨ ${derived.equipmentEffects.map(escapeHtml).join(" • ")}</div>`
          : ""
      }
    </div>
  `;

  $("btn-evolve-physique")?.addEventListener("click", handleEvolvePhysique);
  $("btn-choose-class")?.addEventListener("click", openChooseClassModal);

  $("tab-stats").querySelectorAll(".stat-plus").forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.stat;
      if (state.player.potentialPoints <= 0) return;
      const isSoulForm = Boolean(state.isAfterlife && state.afterlifeForm !== "ghost_body");
      if (isSoulForm && k === "cancot") {
        alert("Đang ở trạng thái Hồn Thể (chưa có thân xác), Căn cốt cố định 0! Tu thành Quỷ Thể để khôi phục.");
        return;
      }
      state.player.potentialPoints -= 1;
      state.player.stats[k] += 1;
      if (k === "cancot") {
        state.player.maxHp += 12;
        state.player.hp += 12;
      }
      if (k === "tamtin") {
        state.player.maxMp += 10;
        state.player.mp += 10;
      }
      if (k === "linhhon") {
        state.player.maxMp += 6;
        state.player.mp += 6;
      }
      if (isSoulForm) {
        state.player.maxHp = state.player.maxMp;
        state.player.hp = state.player.mp;
      }
      saveGameState(state);
      renderTopHud();
      renderTabs();
    });
  });

  // SKILLS TAB
  $("tab-skills").innerHTML = `
    <div style="display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
      <button id="btn-open-create-tech" class="mini-btn">${isWest ? "📜 Biên Soạn Ma Pháp / Nghi Thức" : "📜 Sáng Tạo Công Pháp"}</button>
      <button id="btn-open-catalog" class="mini-btn">${isWest ? "📚 Kho Ma Điển & Huyết Mạch" : "📚 Thư Viện (100 Thể Chất • 600 Pháp)"}</button>
    </div>
    ${p.skills
      .map((sk, idx) => {
        const stage = getSkillStageDetails(sk, p.tier);
        return `
      <div class="list-card">
        <div class="list-card-head">
          <span>${sk.name} <span style="color:var(--accent)">[Bậc ${sk.tier} Lv.${sk.level}]</span> ${sk.isDao ? `<span style="color:#ffd166;font-size:10px;border:1px solid #ffd166;padding:0 4px;border-radius:4px;">⚡ ĐẠO</span>` : ""} ${sk.fromEquipment ? `<span style="color:#90dbf4;font-size:10px;border:1px solid #90dbf4;padding:0 4px;border-radius:4px;">🎒 ${escapeHtml(sk.fromEquipment)}</span>` : ""}</span>
          <div style="display:flex;gap:4px;">
            <button class="mini-btn btn-insert-skill" data-name="${sk.name}">Dùng</button>
            ${
              isSkillAtMaxCap(sk)
                ? `<span style="color:var(--muted);font-size:10px;align-self:center;">🔒 Cực hạn</span>`
                : sk.mastery >= 100
                ? `<button class="mini-btn btn-evolve-skill" data-idx="${idx}">⚡ Diễn Hóa</button>`
                : ""
            }
          </div>
        </div>
        <div style="color:var(--muted);font-size:10.5px;margin-top:2px;">
          ${sk.category} • ${sk.grade} • Lĩnh ngộ: ${sk.mastery}% • Đạo Ý Cảnh: <strong>${sk.daoIntent}</strong>
        </div>
        <div style="margin-top:3px;">${sk.effect}</div>
        <div style="margin-top:3px;font-size:10.5px;color:var(--accent);">📈 Cộng hưởng tầng: ${stage.summaryText}</div>
        ${
          stage.specials.length
            ? `<div style="margin-top:3px;font-size:10.5px;color:#ffd166;">${stage.specials.map((sp) => `✨ ${escapeHtml(sp)}`).join("<br>")}</div>`
            : ""
        }
      </div>`;
      })
      .join("")}
  `;

  $("btn-open-create-tech")?.addEventListener("click", openCreateTechniqueModal);
  $("btn-open-catalog")?.addEventListener("click", openCatalogModal);
  $("tab-skills").querySelectorAll(".btn-insert-skill").forEach((b) => {
    b.addEventListener("click", () => {
      $("action-input").value = `${$("action-input").value} [Thi triển ${b.dataset.name}]`.trim();
      $("action-input").focus();
    });
  });
  $("tab-skills").querySelectorAll(".btn-evolve-skill").forEach((b) => {
    b.addEventListener("click", () => handleEvolveSkill(Number(b.dataset.idx)));
  });

  // BAG & PROFESSIONS TAB
  $("tab-bag").innerHTML = `
    <div class="list-card" style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;">
      ${world.currencies
        .map((c) => `<span>${c.label}: <strong style="color:var(--accent)">${p.currencies[c.key] ?? 0}</strong></span>`)
        .join("")}
      <button id="btn-absorb-stone" class="mini-btn">✨ Hấp Thụ Hồi Khí</button>
    </div>
    <div class="list-card">
      <div class="list-card-head">
        <span>🛠 Nghề Nghiệp (Bách Nghệ)</span>
        <button id="btn-choose-prof" class="mini-btn">➕ Chọn Nghề</button>
      </div>
      ${
        p.professions?.length
          ? p.professions
              .map(
                (pr) => `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
          <span>${pr.name} (${pr.rank} - Lv.${pr.level})</span>
          <button class="mini-btn btn-use-prof" data-prof="${pr.name}">Thi triển</button>
        </div>`
              )
              .join("")
          : `<div style="font-size:10.5px;color:var(--muted);margin-top:4px;">Chưa có nghề nghiệp — sẽ học/chọn sau khi có cơ duyên trong mạch truyện.</div>`
      }
    </div>
    <div class="list-card">
      <div class="list-card-head"><span>🎒 Trang Bị Đang Mặc</span></div>
      <div style="font-size:10.5px;color:var(--muted);margin-top:3px;">
        Giáp: <strong style="color:var(--text)">${escapeHtml(p.equipment?.armor || p.defense?.equippedArmor || "Trống")}</strong> •
        Vũ khí: <strong style="color:var(--text)">${escapeHtml(p.equipment?.weapon || "Trống")}</strong> •
        Phụ kiện: <strong style="color:var(--text)">${escapeHtml(p.equipment?.accessory || "Trống")}</strong>
      </div>
    </div>
    ${p.inventory
      .map(
        (item, idx) => {
          const slot = getEquipSlot(item);
          const statText = item.statBonuses
            ? Object.entries(item.statBonuses).filter(([, v]) => v).map(([k, v]) => `+${v} ${k}`).join(", ")
            : "";
          const skillText = item.grantedSkills?.length
            ? `Kỹ năng: ${item.grantedSkills.map((g) => g.name).join(", ")}`
            : "";
          const btnLabel = slot ? (item.equipped ? "Tháo" : "Trang bị") : "Dùng";
          return `
      <div class="list-card">
        <div class="list-card-head">
          <span>${item.name} x${item.qty} <span style="color:var(--muted)">(${item.type}${item.equipped ? " • Đang mặc" : ""})</span></span>
          <button class="mini-btn btn-use-item" data-idx="${idx}">${btnLabel}</button>
        </div>
        <div style="color:var(--muted);margin-top:2px;">${item.desc || ""}</div>
        ${
          statText || item.effects || skillText
            ? `<div style="color:var(--accent);font-size:10.5px;margin-top:2px;">${[statText, item.effects, skillText].filter(Boolean).join(" • ")}</div>`
            : ""
        }
      </div>`;
        }
      )
      .join("")}
  `;

  $("btn-choose-prof")?.addEventListener("click", openChooseProfessionModal);
  $("btn-absorb-stone")?.addEventListener("click", () => {
    if ((state.player.currencies.primary || 0) < 10) {
      alert("Không đủ tài nguyên (cần ít nhất 10).");
      return;
    }
    state.player.currencies.primary -= 10;
    state.player.mp = Math.min(state.player.maxMp, state.player.mp + 35);
    state.player.cultivation = Math.min(100, state.player.cultivation + 12);
    saveGameState(state);
    renderTopHud();
    renderTabs();
  });

  $("tab-bag").querySelectorAll(".btn-use-prof").forEach((b) => {
    b.addEventListener("click", () => {
      if (isBusy) return;
      handlePlayerAction(`Sử dụng nghề [${b.dataset.prof}] trong tình huống hiện tại (chế tạo/bói toán/bố trận).`, "text");
    });
  });

  $("tab-bag").querySelectorAll(".btn-use-item").forEach((b) => {
    b.addEventListener("click", () => {
      const idx = Number(b.dataset.idx);
      const item = state.player.inventory[idx];
      if (!item || isBusy) return;
      if (item.type === "Đan Dược") {
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + Math.round(state.player.maxHp * 0.4));
        state.player.mp = Math.min(state.player.maxMp, state.player.mp + Math.round(state.player.maxMp * 0.4));
        item.qty -= 1;
        if (item.qty <= 0) state.player.inventory.splice(idx, 1);
        saveGameState(state);
        renderTopHud();
        renderTabs();
      } else if (getEquipSlot(item)) {
        toggleEquipItem(state.player, idx);
        saveGameState(state);
        renderTopHud();
        renderTabs();
      } else {
        handlePlayerAction(`Sử dụng vật phẩm [${item.name}] (${item.desc}).`, "text");
      }
    });
  });

  // SOCIAL TAB
  $("tab-social").innerHTML = `
    <div class="list-card">
      <div class="list-card-head"><span>🌌 Giới Vực Song Song</span></div>
      <div style="color:var(--muted);margin-top:3px;">
        Hiện tại: <strong style="color:var(--accent)">${state.currentParallelRealm}</strong><br/>
        Các giới khác: ${world.parallelRealms.join(" • ")}
      </div>
    </div>
    ${p.relationships
      .map(
        (r) => `
      <div class="list-card">
        <div class="list-card-head">
          <span>${r.name}</span>
          <span style="color:var(--accent)">Hảo cảm: ${r.affinity}</span>
        </div>
        <div style="color:var(--muted);font-size:10.5px;">${r.type} • ${r.status || "Bình thường"}</div>
      </div>`
      )
      .join("")}
  `;
}

function renderFeed() {
  const feed = $("story-feed");
  if (!state || state.logs.length === 0) return;

  feed.innerHTML = state.logs
    .map((l) => {
      if (l.type === "player") {
        return `<div class="log-entry log-player">${escapeHtml(l.text)}</div>`;
      }
      if (l.type === "system") {
        return `<div class="log-entry log-system"><strong>${escapeHtml(l.title || "Hệ Thống")}:</strong> ${escapeHtml(l.text)}</div>`;
      }
      let badge = "";
      if (l.combatOutcome) {
        const cls = l.combatOutcome.includes("Đoạt") ? "win" : l.combatOutcome.includes("Mất") ? "lose" : "draw";
        badge = `<div class="log-combat-badge ${cls}">${escapeHtml(l.combatOutcome)}</div><br/>`;
      }
      return `<div class="log-entry log-narrative">${badge}${escapeHtml(l.text)}</div>`;
    })
    .join("");

  if (isBusy) {
    feed.innerHTML += `<div class="loading-bubble" style="display:flex;justify-content:space-between;align-items:center;gap:8px;"><span>⏳ Thiên Đạo AI đang diễn hóa nhân quả...</span><button id="btn-cancel-wait" class="mini-btn" type="button">Hủy chờ</button></div>`;
    $("btn-cancel-wait")?.addEventListener("click", () => {
      isBusy = false;
      renderAll();
    });
  }
  feed.scrollTop = feed.scrollHeight;
}

function renderActionArea() {
  const area = $("action-area");
  const banner = $("mode-banner");
  const choicesEl = $("choices-list");
  const chipsEl = $("quick-chips");
  const input = $("action-input");

  if (!state || state.mode === "gameover") {
    area.classList.add("hidden");
    banner.classList.add("hidden");
    return;
  }

  area.classList.remove("hidden");

  if (state.mode === "combat" && state.enemy) {
    const cleanEnemyStr = (str, maxLen) =>
      String(str || "")
        .split(/(?:JSON schema|validator|combat mode|system enemy|control character)/i)[0]
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxLen);
    const eName = cleanEnemyStr(state.enemy.name, 65) || "Địch Thủ";
    const eRealm = cleanEnemyStr(state.enemy.realm, 40) || "Không rõ";
    const eIntent = cleanEnemyStr(state.enemy.intent, 140) || "Đang quan sát";
    banner.classList.remove("hidden", "ngodao");
    banner.innerHTML = `
      <div style="display:flex;justify-content:space-between;font-weight:700;gap:6px;">
        <span>⚔️ ${escapeHtml(eName)} (${escapeHtml(eRealm)})</span>
        <span style="white-space:nowrap;">HP: ${state.enemy.hp}/${state.enemy.maxHp}</span>
      </div>
      <div style="color:#fca5a5;font-size:11px;margin-top:2px;">Ý đồ địch: ${escapeHtml(eIntent)}</div>
    `;
    choicesEl.innerHTML = "";
    chipsEl.classList.remove("hidden");
    chipsEl.innerHTML = state.player.skills
      .map((s) => `<button class="chip-btn" data-name="${escapeHtml(s.name)}">${escapeHtml(s.name)}</button>`)
      .join("");
    chipsEl.querySelectorAll(".chip-btn").forEach((c) => {
      c.addEventListener("click", () => {
        input.value = `${input.value} Dùng [${c.dataset.name}] `.trimStart();
        input.focus();
      });
    });
    input.placeholder = "Nhập chiêu thức & chiến thuật! (Viết bừa sẽ Mất Tiên Cơ)";
  } else if (state.mode === "ngodao" && state.ngodaoQuestion) {
    banner.classList.remove("hidden");
    banner.classList.add("ngodao");
    banner.innerHTML = `<strong>🌌 CÂU HỎI NGỘ ĐẠO:</strong> ${escapeHtml(state.ngodaoQuestion)}`;
    choicesEl.innerHTML = "";
    chipsEl.classList.add("hidden");
    input.placeholder = "Nhập lời giải đáp Ngộ Đạo (áp dụng tự nhiên, vật lý, triết lý)...";
  } else {
    banner.classList.add("hidden");
    chipsEl.classList.add("hidden");
    choicesEl.innerHTML = (state.choices || [])
      .map(
        (c, i) => `
      <button class="choice-btn" data-idx="${i}">
        <span>${escapeHtml(c.text)}</span>
        <span class="choice-tag">${escapeHtml(c.statTag)}</span>
      </button>`
      )
      .join("");
    choicesEl.querySelectorAll(".choice-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (isBusy) return;
        const choice = state.choices[Number(btn.dataset.idx)];
        handlePlayerAction(choice.text, "choice", choice.statTag);
      });
    });
    input.placeholder = "Nhập hành động tự do hoặc suy luận bóc trần âm mưu...";
  }
}

async function handlePlayerAction(text, kind = "text", statTag = "") {
  if (!getActiveApiKey(settings)) {
    openSettingsModal();
    alert("Vui lòng nhập API Key (Gemini, Groq hoặc OpenRouter) để AI dẫn truyện.");
    return;
  }

  pushSnapshot(state);
  state.logs.push({ type: "player", text });

  let promptDetail = "";
  let combatOutcome = null;
  let combatResult = null;
  let forceDeath = false;

  const absurdCheck = kind === "text" ? checkAbsurdOrSuicidalAction(state, text) : null;
  if (absurdCheck) {
    forceDeath = Boolean(absurdCheck.forceDeath);
  }

  if (state.mode === "combat") {
    const res = resolveCombatCheck(state, text);
    combatResult = res;
    if (res.forceDeath) forceDeath = true;
    combatOutcome = `${res.outcome} (Gây ${res.playerDmg} DMG • Nhận ${res.enemyDmg} DMG)`;
    const curEnemyHp = state.enemy ? Number(state.enemy.hp) || 0 : 0;
    const expectedEnemyHp = Math.max(0, curEnemyHp - res.playerDmg);
    promptDetail = `[CHẾ ĐỘ CHIẾN ĐẤU] Người chơi nhập: "${text}".\nKết quả thẩm định Engine: ${res.outcome} (${res.reason}, d20=${res.roll.d20}, tổng=${res.roll.total}).\nSát thương Engine tính toán: Người chơi gây **${res.playerDmg} DMG** lên địch${state.enemy ? ` (HP địch còn khoảng ${expectedEnemyHp}/${state.enemy.maxHp})` : ""}; Địch phản đòn gây **${res.enemyDmg} DMG** lên người chơi (đã trừ Giáp/Kháng).\nHãy viết diễn biến chiến đấu khớp với lượng sát thương này, đặt \`stateChanges.hpDelta = ${-res.enemyDmg}\` và cập nhật \`enemy.hp = ${expectedEnemyHp}\` (nếu địch chết đặt \`mode="normal"\`, \`enemy=null\`).${absurdCheck ? `\n${absurdCheck.promptNote}` : ""}`;
  } else if (state.mode === "ngodao") {
    const roll = rollCheck(state.player.stats.ngotinh + state.player.stats.tamtin, 14);
    promptDetail = `[TRẢ LỜI NGỘ ĐẠO] Câu hỏi: "${state.ngodaoQuestion}".\nCâu trả lời của người chơi: "${text}".\nTung xúc xắc Ngộ Tính: ${roll.tier}.\nHãy chấm độ sâu sắc câu trả lời (nếu hay hãy thưởng Tu vi lớn, Ngộ tính hoặc Thần thông/Đạo Ý Cảnh mới!) rồi chuyển về mode="normal".${absurdCheck ? `\n${absurdCheck.promptNote}` : ""}`;
  } else {
    const statMap = {
      "Căn cốt": state.player.stats.cancot,
      cancot: state.player.stats.cancot,
      "Tâm trí": state.player.stats.tamtin,
      tamtin: state.player.stats.tamtin,
      "Linh hồn": state.player.stats.linhhon,
      linhhon: state.player.stats.linhhon,
      "Ngộ tính": state.player.stats.ngotinh,
      ngotinh: state.player.stats.ngotinh,
      "Thiên phú": computeDerivedStats(state.player).effectiveTalent,
      thienphu: computeDerivedStats(state.player).effectiveTalent,
      "Khí vận": computeDerivedStats(state.player).effectiveLuck,
      khivan: computeDerivedStats(state.player).effectiveLuck,
    };
    const val = statMap[statTag] ?? state.player.stats.tamtin;
    const roll = rollCheck(val, 14);
    const estDmg = Math.max(15, Math.round((state.player.maxHp || 150) * 0.16 + val * 3));
    const atkHint = /(giết|đánh|chém|tấn công|ám sát|xông|công kích|hạ thủ)/i.test(text)
      ? ` Sát thương ước tính ở cảnh giới [${state.player.realm}] chỉ ~${estDmg} DMG (nếu đối thủ là Chưởng Môn/Trưởng Lão/cảnh giới cao hơn thì đòn này vô hiệu hoặc bị phản sát nặng).`
      : "";
    const failHazard =
      roll.tier === "Đại Thất Bại"
        ? ` [ĐẠI THẤT BẠI] Không có hào quang nhân vật chính: nếu bối cảnh phù hợp (hang động/bí cảnh/đắc tội kẻ xấu), có thể cho sập bẫy, trúng độc, bị hãm hại hoặc bị thương nặng / hao tu vi.`
        : roll.tier === "Thất Bại"
        ? ` [THẤT BẠI HỢP LÝ] Việc không thành, tốn công sức, lộ sơ hở hoặc tổn thất nhẹ-vừa; KHÔNG ép dính bẫy hay hạ độc nếu đang ở sinh hoạt thường ngày.`
        : "";
    promptDetail = `Người chơi chọn/hành động (${kind === "choice" ? `gắn chỉ số ${statTag}` : "tự do"}): "${text}".\nKết quả xúc xắc Engine: ${roll.tier} (d20=${roll.d20}, tổng=${roll.total}/${roll.difficulty}).${atkHint}${failHazard}${absurdCheck ? `\n${absurdCheck.promptNote}` : kind === "text" ? `\n[KIỂM TRA NGỮ CẢNH] Nếu text nhảm, vô nghĩa, không liên quan hiện trường hoặc tự bịa cơ duyên (vd bí kíp từ trời rơi xuống): BẮT BUỘC giáng Thiên Phạt (trừ 50-100% HP, KHÔNG thưởng đồ). Nếu tìm chết: viết rõ bối cảnh bị cường giả nhìn thấu, một chưởng đánh chết hoặc vạn kiếm xuyên tâm rồi đặt hpDelta=-999999.` : ""}`;
  }

  isBusy = true;
  renderFeed();

  try {
    const { modelUsed, result } = await callGeminiGM({
      settings,
      state,
      userPrompt: promptDetail,
      isMajorEvent: state.mode === "ngodao",
    });
    applyAiResult(result, combatOutcome, modelUsed, combatResult, forceDeath);

    if ((state.storySummary || "").length > 1400) {
      const sumLines = state.storySummary.split("\n").filter(Boolean);
      if (sumLines.length > 8) {
        state.storySummary = [...sumLines.slice(0, 2), ...sumLines.slice(-6)].join("\n");
      }
    }
    if ((state.hiddenNotes || "").length > 1000) {
      const noteLines = state.hiddenNotes.split("\n").filter(Boolean);
      if (noteLines.length > 6) {
        state.hiddenNotes = [...noteLines.slice(0, 2), ...noteLines.slice(-4)].join("\n");
      }
    }
  } catch (err) {
    state.logs.push({ type: "system", title: "Lỗi AI", text: err.message });
  } finally {
    isBusy = false;
    saveGameState(state);
    renderAll();
  }
}

function applyAiResult(res, combatOutcome = null, modelUsed = "", combatResult = null, forceDeath = false) {
  const prevEnemy = state.mode === "combat" && state.enemy ? state.enemy : null;
  state.turn += 1;
  state.mode = res.mode || "normal";
  state.choices = res.choices || [];
  if (res.mode === "combat" && res.enemy) {
    const nextEnemy = { ...res.enemy };
    const rawMax = Math.max(1, Number(nextEnemy.maxHp) || 100);
    const rawHp = Number.isFinite(Number(nextEnemy.hp)) ? Number(nextEnemy.hp) : rawMax;
    const norm = (s) => String(s || "").trim().toLowerCase();
    const prevName = norm(prevEnemy?.name);
    const nextName = norm(nextEnemy.name);
    const isSameEnemy =
      prevEnemy &&
      prevEnemy.maxHp > 0 &&
      (!nextName ||
        !prevName ||
        prevName === nextName ||
        prevName.includes(nextName) ||
        nextName.includes(prevName));
    if (isSameEnemy) {
      const prevMax = Math.max(1, Number(prevEnemy.maxHp));
      const prevHp = Math.max(0, Math.min(prevMax, Number(prevEnemy.hp) ?? prevMax));
      const allowMaxHpChange = nextEnemy.maxHpChanged === true && rawMax > 0;
      const allowHeal = nextEnemy.hpHealed === true;
      const lockedMax = allowMaxHpChange ? rawMax : prevMax;
      let nextHp = rawHp;
      if (!allowMaxHpChange && rawMax !== lockedMax) {
        nextHp = rawHp >= rawMax ? prevHp : Math.round((rawHp / rawMax) * lockedMax);
      }
      const maxAllowedHp = allowHeal ? lockedMax : Math.min(prevHp, lockedMax);
      nextEnemy.maxHp = lockedMax;
      let clampedHp = Math.max(0, Math.min(maxAllowedHp, nextHp));
      if (combatResult && combatResult.playerDmg > 0 && !allowHeal && clampedHp >= prevHp) {
        clampedHp = Math.max(0, prevHp - combatResult.playerDmg);
      }
      nextEnemy.hp = clampedHp;
    } else {
      nextEnemy.maxHp = rawMax;
      nextEnemy.hp = Math.max(0, Math.min(rawMax, rawHp));
    }
    delete nextEnemy.maxHpChanged;
    delete nextEnemy.hpHealed;
    if (nextEnemy.hp <= 0) {
      state.mode = "normal";
      state.enemy = null;
    } else {
      state.enemy = nextEnemy;
    }
  } else {
    state.enemy = null;
  }
  state.ngodaoQuestion = res.mode === "ngodao" ? res.ngodaoQuestion : null;

  const sc = res.stateChanges || {};
  const p = state.player;
  const isSoulForm = Boolean(state.isAfterlife && state.afterlifeForm !== "ghost_body");
  if (isSoulForm) {
    p.mp = forceDeath ? 0 : Math.max(0, Math.min(p.maxMp, p.mp + (sc.hpDelta || 0) + (sc.mpDelta || 0)));
    p.maxHp = p.maxMp;
    p.hp = p.mp;
  } else {
    p.hp = forceDeath ? 0 : Math.max(0, Math.min(p.maxHp, p.hp + (sc.hpDelta || 0)));
    p.mp = Math.max(0, Math.min(p.maxMp, p.mp + (sc.mpDelta || 0)));
  }
  p.cultivation = Math.max(0, Math.min(100, p.cultivation + (sc.cultivationDelta || 0)));
  p.potentialPoints = Math.max(0, p.potentialPoints + (sc.potentialDelta || 0));
  p.age += sc.ageDelta || 0;
  p.currencies.primary = Math.max(0, (p.currencies.primary || 0) + (sc.primaryCurrencyDelta || 0));
  p.currencies.contrib = Math.max(0, (p.currencies.contrib || 0) + (sc.contribDelta || 0));

  if (sc.statDeltas) {
    for (const [k, v] of Object.entries(sc.statDeltas)) {
      if (k in p.stats && v) {
        if (isSoulForm && k === "cancot") continue;
        p.stats[k] += v;
      }
    }
  }
  if (sc.armorDelta || sc.resistDeltas) {
    p.defense = p.defense || {
      equippedArmor: "Không",
      armor: 0,
      resistances: { physical: 0, magic: 0, soul: 0, poison: 0, law: 0 },
    };
    if (sc.armorDelta) p.defense.armor = Math.max(0, (p.defense.armor || 0) + sc.armorDelta);
    if (sc.resistDeltas) {
      for (const [rk, rv] of Object.entries(sc.resistDeltas)) {
        if (rv) p.defense.resistances[rk] = Math.max(0, (p.defense.resistances[rk] || 0) + rv);
      }
    }
  }
  if (Array.isArray(sc.newItems)) {
    for (const item of sc.newItems) {
      const existing = p.inventory.find((i) => i.name === item.name);
      if (existing) existing.qty += item.qty || 1;
      else p.inventory.push({ ...item, qty: item.qty || 1 });
    }
  }
  if (Array.isArray(sc.newSkills)) {
    for (const sk of sc.newSkills) {
      if (!p.skills.some((s) => s.name === sk.name)) p.skills.push(sk);
    }
  }
  if (Array.isArray(sc.relationshipUpdates)) {
    for (const ru of sc.relationshipUpdates) {
      const rel = p.relationships.find((r) => r.name === ru.name);
      if (rel) {
        rel.affinity += ru.affinityDelta || 0;
        if (ru.status) rel.status = ru.status;
      } else {
        p.relationships.push({
          name: ru.name,
          type: ru.type || "Nhân Vật",
          affinity: ru.affinityDelta || 0,
          status: ru.status || "Mới quen",
        });
      }
    }
  }
  if (sc.parallelRealm) state.currentParallelRealm = sc.parallelRealm;
  if (sc.physiqueProgressDelta) {
    p.physiqueProgress = Math.max(0, Math.min(100, (p.physiqueProgress || 0) + sc.physiqueProgressDelta));
  }
  if (sc.physiqueUpdate) {
    p.physiqueName = sc.physiqueUpdate;
    const matched = CATALOG_PHYSIQUES.find((ph) => ph.name === sc.physiqueUpdate);
    if (matched) {
      p.physiqueId = matched.id;
      p.physiqueGroup = matched.group;
    }
    p.physiqueProgress = 0;
    syncPhysiqueTierAbilities(p);
  }
  if (
    state.isAfterlife &&
    state.afterlifeForm !== "ghost_body" &&
    (sc.afterlifeFormUpdate === "ghost_body" ||
      /quỷ thể|tái tạo nhục thân|quỷ khu|âm thần thể/i.test(`${sc.physiqueUpdate || ""} ${sc.realmUpdate || ""}`))
  ) {
    state.afterlifeForm = "ghost_body";
    p.stats.cancot = Math.max(p.stats.cancot || 0, p.savedCancotBeforeDeath || 8);
    syncRealmVitals(state, true);
    state.logs.push({
      type: "system",
      title: "💀 TU THÀNH QUỶ THỂ",
      text: `Đã ngưng tụ thân xác âm giới! Căn cốt (${p.stats.cancot}) được khôi phục, Sinh Lực tách khỏi Linh Lực.`,
    });
  }
  if (sc.realmUpdate && sc.realmUpdate !== p.realm) {
    const oldLv = getContinuousLevel(state);
    p.realm = sc.realmUpdate;
    const realms = WORLD_PRESETS[state.worldId]?.realmsByTier?.[p.tier] || [];
    const foundIdx = realms.findIndex((r) => r.toLowerCase() === sc.realmUpdate.toLowerCase());
    if (foundIdx >= 0) {
      p.realmIndex = foundIdx;
      if (getContinuousLevel(state) > oldLv) {
        applyLevelUpRewards(state);
      }
    }
    syncRealmVitals(state, false);
  }
  if (sc.timelineUpdate) state.timeline = sc.timelineUpdate;
  if (sc.newCausalAnchor) {
    state.causalAnchors = state.causalAnchors || [];
    if (!state.causalAnchors.includes(sc.newCausalAnchor)) {
      state.causalAnchors.push(sc.newCausalAnchor);
    }
  }

  // Tăng độ lĩnh ngộ kỹ năng khi chiến đấu hoặc ngộ đạo
  if (combatOutcome && combatOutcome.includes("Đoạt") && p.skills.length > 0) {
    p.skills[0].mastery = Math.min(100, p.skills[0].mastery + 20);
  }

  state.logs.push({
    type: "narrative",
    text: `${res.narrative}\n\n[AI: ${modelUsed}]`,
    combatOutcome,
  });

  if (sc.systemAlert) {
    state.logs.push({ type: "system", title: "Biến Động", text: sc.systemAlert });
  }

  if (res.summaryUpdate) state.storySummary += `\n- Lượt ${state.turn}: ${res.summaryUpdate}`;
  if (res.hiddenNotesUpdate) state.hiddenNotes += `\n[Lượt ${state.turn}]: ${res.hiddenNotesUpdate}`;

  // Kiểm tra chết -> Tam Sinh Thạch quay lại lựa chọn trước (3 lần/ngày), hết 3 lần -> Địa Phủ / Game Over
  if (p.hp <= 0) {
    const tst = syncTamSinhThachDaily(p);
    if (!state.isAfterlife && tst.usesLeft > 0 && state.snapshots && state.snapshots.length > 0) {
      tst.usesLeft -= 1;
      const prev = state.snapshots[0];
      const remainingSnaps = state.snapshots.slice(1);
      const deathSnippet = (res.narrative || "Bị cường giả sát hại").slice(0, 140);
      state = prev;
      state.snapshots = remainingSnaps;
      state.player.tamSinhThach = tst;
      state.logs.push({
        type: "system",
        title: `🪨 TAM SINH THẠCH KÍCH HOẠT — CÒN ${tst.usesLeft}/3 LẦN HÔM NAY`,
        text: `Ngươi vừa bỏ mạng (${deathSnippet}...). Tam Sinh Thạch bùng phát ánh sáng nhân quả, đưa ngươi quay ngược về lựa chọn ngay trước lúc chết! Hôm nay còn ${tst.usesLeft}/3 lần hồi sinh (hết 3 lần sẽ hồn xuống Địa Phủ, qua ngày mới sẽ reset lại).`,
      });
    } else if (!state.isAfterlife && p.stats.linhhon >= 5) {
      enterAfterlife(state);
    } else {
      state.mode = "gameover";
      state.logs.push({
        type: "system",
        title: "HỒN PHI PHÁCH TÁN (GAME OVER)",
        text: "Thần hồn đã vỡ nát, cuộc đời này khép lại. Hãy khởi tạo cuộc đời mới hoặc dùng Bút Tác Giả để quay lại.",
      });
    }
  }
}

function applyLevelUpRewards(targetState) {
  const p = targetState.player;
  p.cultivation = 0;
  p.maxHp = Math.round(p.maxHp * 1.25);
  p.maxMp = Math.round(p.maxMp * 1.25);
  p.hp = p.maxHp;
  p.mp = p.maxMp;

  const lv = getContinuousLevel(targetState);
  const bonusPoints = Math.max(1, lv * p.tier);
  p.potentialPoints += bonusPoints;

  const phyGainLogs = [];
  if (targetState.isAfterlife && targetState.afterlifeForm !== "ghost_body") {
    const soulBonus = Math.max(1, Math.round((lv * p.tier) / 2));
    p.stats.linhhon += soulBonus;
    p.stats.cancot = 0;
    phyGainLogs.push(`+${soulBonus} Linh Hồn (Hồn Thể)`);
  }
  const { current: curPhysique, effectiveBonus: phyBonusObj } = getPhysiqueInfo(p);
  if (curPhysique && curPhysique.id !== "phamthe" && phyBonusObj) {
    for (const [bk, bv] of Object.entries(phyBonusObj)) {
      if (typeof bv !== "number" || bv === 0) continue;
      const addVal = bv * lv * p.tier;
      if (bk in p.stats) {
        p.stats[bk] += addVal;
        if (bk === "cancot") {
          p.maxHp += addVal * 12;
          p.hp = p.maxHp;
        } else if (bk === "tamtin") {
          p.maxMp += addVal * 10;
          p.mp = p.maxMp;
        } else if (bk === "linhhon") {
          p.maxMp += addVal * 6;
          p.mp = p.maxMp;
        }
        phyGainLogs.push(`+${addVal} ${bk}`);
      } else if (bk === "armorBonus") {
        p.defense = p.defense || {
          equippedArmor: "Không",
          armor: 0,
          resistances: { physical: 0, magic: 0, soul: 0, poison: 0, law: 0 },
        };
        p.defense.armor = (p.defense.armor || 0) + addVal;
        phyGainLogs.push(`+${addVal} Hộ Giáp`);
      } else if (bk === "resistSoul") {
        p.defense = p.defense || {
          equippedArmor: "Không",
          armor: 0,
          resistances: { physical: 0, magic: 0, soul: 0, poison: 0, law: 0 },
        };
        p.defense.resistances.soul = (p.defense.resistances.soul || 0) + addVal;
        phyGainLogs.push(`+${addVal}% Kháng Hồn`);
      }
    }
  }

  const tierSync = syncPhysiqueTierAbilities(p);
  syncRealmVitals(targetState, true);
  return { lv, bonusPoints, phyGainLogs, tierSync };
}

async function handleBreakthrough() {
  if (isBusy || state.player.cultivation < 100) return;
  const check = resolveBreakthrough(state);
  const world = WORLD_PRESETS[state.worldId];

  if (check.success) {
    const p = state.player;
    if (state.isAfterlife) {
      state.afterlifeRealmIndex = Math.min(world.afterlife.realms.length - 1, state.afterlifeRealmIndex + 1);
      p.realm = world.afterlife.realms[state.afterlifeRealmIndex];
    } else {
      const realms = world.realmsByTier[p.tier];
      if (p.realmIndex + 1 < realms.length) {
        p.realmIndex += 1;
        p.realm = realms[p.realmIndex];
      } else if (p.tier < 5) {
        p.tier += 1;
        p.realmIndex = 0;
        p.realm = world.realmsByTier[p.tier][0];
        p.lifespan += p.tier * 500;
        state.currentParallelRealm = COSMIC_TIERS[p.tier - 1].name;
      }
    }

    const { lv, bonusPoints, phyGainLogs, tierSync } = applyLevelUpRewards(state);
    let abilityNote = "";
    if (phyGainLogs.length > 0) {
      abilityNote += ` Thể chất [${p.physiqueName}] cộng thêm (${lv}×${p.tier}): ${phyGainLogs.join(", ")}.`;
    }
    if (tierSync.newlyUnlocked.length > 0) {
      abilityNote += ` Thể chất [${p.physiqueName}] thức tỉnh: ${tierSync.newlyUnlocked.map((x) => `[${x.name}]`).join(", ")}.`;
    }
    if (tierSync.evolvedToDao.length > 0) {
      abilityNote += ` THẦN THÔNG HÓA ĐẠO (Tầng ${p.tier}): ${tierSync.evolvedToDao.join(", ")} đã thăng hoa thành Đạo!`;
    }

    await handlePlayerAction(
      `[ĐỘT PHÁ THÀNH CÔNG] Tỉ lệ ${check.chance}% (roll ${check.roll}). Nhân vật chính thức đột phá lên cảnh giới [${p.realm}] (Tầng ${p.tier} • Lv.${lv}, nhận +${bonusPoints} Điểm Tiềm Năng = ${lv}×${p.tier})!${abilityNote} Hãy miêu tả thiên kiếp/dị tượng đột phá và sức mạnh mới.`,
      "system"
    );
  } else {
    state.player.cultivation = 55;
    state.player.hp = Math.max(10, Math.round(state.player.hp * 0.35));
    await handlePlayerAction(
      `[ĐỘT PHÁ THẤT BẠI - TẨU HỎA NHẬP MA] Tỉ lệ ${check.chance}% (roll ${check.roll}). Kinh mạch/Ma lực phản phệ trọng thương (mất 65% HP hiện tại), tiến độ tụt về 55%. Hãy miêu tả cảnh đột phá thất bại, tâm ma quấy phá hoặc bị kẻ khác thừa cơ hãm hại.`,
      "system"
    );
  }
}

async function handleEvolvePhysique() {
  if (isBusy) return;
  const info = getPhysiqueInfo(state.player);
  if (!info.nextId || (state.player.physiqueProgress || 0) < 100) return;

  const nextPhy = CATALOG_PHYSIQUES.find((ph) => ph.id === info.nextId);
  if (!nextPhy) return;

  const oldName = state.player.physiqueName || "Phàm Thể";
  const oldBonus = info.effectiveBonus || info.current?.bonus || {};
  const newBonus = {};
  const allKeys = new Set([...Object.keys(oldBonus), ...Object.keys(nextPhy.bonus || {})]);
  for (const k of allKeys) {
    const prevVal = typeof oldBonus[k] === "number" ? oldBonus[k] : 0;
    const nextVal = typeof nextPhy.bonus?.[k] === "number" ? nextPhy.bonus[k] : 0;
    const doubled = prevVal > 0 ? prevVal * 2 : nextVal;
    if (Math.max(nextVal, doubled) > 0) {
      newBonus[k] = Math.max(nextVal, doubled);
    }
  }

  state.player.physiqueId = nextPhy.id;
  state.player.physiqueName = nextPhy.name;
  state.player.physiqueGroup = nextPhy.group;
  state.player.physiqueBonus = newBonus;
  state.player.physiqueProgress = 0;
  syncPhysiqueTierAbilities(state.player);
  state.player.maxHp += 40;
  state.player.hp = state.player.maxHp;
  state.player.maxMp += 30;
  state.player.mp = state.player.maxMp;

  const newBonusDesc = Object.entries(newBonus).map(([k, v]) => `+${v} ${k}`).join(", ");
  saveGameState(state);
  await handlePlayerAction(
    `[LỘT XÁC THỂ CHẤT THÀNH CÔNG] Thể chất [${oldName}] đã đạt cực hạn và tiến hóa thành [${nextPhy.name}] (${nextPhy.grade}, +${nextPhy.speedBonus}% tốc độ tu luyện, điểm gốc x2 khi lên cấp: ${newBonusDesc})! Hãy miêu tả dị tượng lột xác thể chất kinh thiên động địa.`,
    "system"
  );
}

async function handleEvolveSkill(idx) {
  const sk = state.player.skills[idx];
  if (!sk || sk.mastery < 100 || isBusy) return;
  if (isSkillAtMaxCap(sk)) {
    alert("Công pháp này đã đạt cực hạn (Không Phẩm không có tầng sau)!");
    return;
  }

  if (sk.level < 10) {
    sk.level += 1;
    sk.mastery = 0;
  } else if (sk.tier < 5) {
    sk.tier += 1;
    sk.level = 1;
    sk.mastery = 0;
    sk.grade = SKILL_TIERS[sk.tier - 1].grade;
  }
  const reward = applySkillLevelUpRewards(state.player, sk);
  syncRealmVitals(state, false);
  state.logs.push({
    type: "system",
    title: `Tăng Tầng Công Pháp: ${sk.name} (Bậc ${sk.tier} Lv.${sk.level})`,
    text: `Nhận +${reward.freePts} Điểm Tự Do${reward.mandatoryPts > 0 ? `, +${reward.mandatoryPts} điểm bắt buộc vào ${reward.statLabel}` : ""}, +${reward.hpGain} HP tối đa, +${reward.mpGain} MP tối đa. ${reward.details.summaryText}.${reward.details.specials.length ? ` Hiệu ứng đặc biệt: ${reward.details.specials[reward.details.specials.length - 1]}` : ""}`,
  });
  saveGameState(state);
  await handlePlayerAction(
    `[DIỄN HÓA KỸ NĂNG] Kỹ năng [${sk.name}] đã tiến hóa lên Bậc ${sk.tier} Lv.${sk.level} (${sk.grade})! (${reward.details.summaryText}). Hãy đặt lại tên/hiệu ứng hoặc Đạo Ý Cảnh mới xứng tầm nếu sang Bậc mới.`,
    "system"
  );
}

// MODALS
function openNewGameModal() {
  const modal = $("modal-newgame");
  const titleEl = modal.querySelector(".modal-header h3");
  if (titleEl) titleEl.textContent = "✨ Khởi Tạo Nhân Vật & Nhánh Thế Giới";
  modal.classList.remove("hidden");
  const body = $("newgame-body");

  let rolledOrigin = rollOriginByDice();
  let rolledGolden = rollGoldenFingerByDice();

  body.innerHTML = `
    <div class="field-group">
      <label>Tên Nhân Vật</label>
      <input id="ng-name" value="Lâm Phong" />
    </div>
    <div class="field-group">
      <label>Chọn Cốt Truyện (Nhánh Thế Giới Song Song Tầng 1–3)</label>
      <select id="ng-world">
        ${Object.values(WORLD_PRESETS)
          .map((w) => `<option value="${w.id}">${w.name} — ${w.subtitle}</option>`)
          .join("")}
      </select>
    </div>
    <div class="field-group">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <label style="margin:0;">Xuất Thân Khởi Đầu (Gieo Xúc Xắc)</label>
        <button id="btn-roll-origin" type="button" class="mini-btn">🎲 Gieo Lại</button>
      </div>
      <div id="ng-origin-result" class="list-card" style="margin:0;padding:8px;"></div>
    </div>
    <div class="field-group">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <label id="lbl-ng-golden" style="margin:0;">Bàn Tay Vàng (Gieo Xúc Xắc Ngẫu Nhiên)</label>
        <button id="btn-roll-golden" type="button" class="mini-btn">🎲 Gieo Lại</button>
      </div>
      <div id="ng-golden-result" class="list-card" style="margin:0;padding:8px;"></div>
    </div>
    <div class="list-card" style="font-size:11px;color:var(--muted);margin-bottom:10px;">
      🌱 <strong>Khởi đầu Phàm Nhân:</strong> Class (Hướng Đạo), Nghề Nghiệp và Thể Chất sẽ <strong>không chọn từ đầu</strong> — nhân vật đi từ nhỏ đến lớn, từ yếu đến mạnh, tự định hình qua công pháp, sư môn và kì ngộ sau này.
    </div>
    <button id="btn-start-run" class="btn-primary">🚀 Bắt Đầu Hành Trình</button>
  `;

  const renderDiceResults = () => {
    const wid = $("ng-world").value;
    const isW = wid === "maphap";
    const o = rolledOrigin.origin;
    const g = rolledGolden.golden;
    const oName = isW && o.westName ? o.westName : o.name;
    const oDesc = isW && o.westDesc ? o.westDesc : o.desc;
    const gName = isW && g.westName ? g.westName : g.name;
    const gDesc = isW && g.westDesc ? g.westDesc : g.desc;

    $("lbl-ng-golden").textContent = isW
      ? "Di Sản / Dị Năng Khởi Đầu (Gieo Xúc Xắc)"
      : "Bàn Tay Vàng (Gieo Xúc Xắc Ngẫu Nhiên)";
    $("ng-origin-result").innerHTML = `
      <div>🎲 d20 = <strong style="color:var(--accent)">${rolledOrigin.d20}</strong> → <strong>${escapeHtml(oName)}</strong> (${o.startAge || 14} tuổi)</div>
      <div style="font-size:11px;color:var(--muted);margin-top:3px;">${escapeHtml(oDesc)}</div>
    `;
    $("ng-golden-result").innerHTML = `
      <div>🎲 d20 = <strong style="color:var(--accent)">${rolledGolden.d20}</strong> → <strong>${escapeHtml(gName)}</strong></div>
      <div style="font-size:11px;color:var(--muted);margin-top:3px;">${escapeHtml(gDesc)}</div>
    `;
  };

  $("ng-world").addEventListener("change", renderDiceResults);
  $("btn-roll-origin").addEventListener("click", () => {
    rolledOrigin = rollOriginByDice();
    renderDiceResults();
  });
  $("btn-roll-golden").addEventListener("click", () => {
    rolledGolden = rollGoldenFingerByDice();
    renderDiceResults();
  });
  renderDiceResults();

  $("btn-start-run").addEventListener("click", async () => {
    state = createNewGame({
      name: $("ng-name").value,
      worldId: $("ng-world").value,
      originId: rolledOrigin.origin.id,
      goldenId: rolledGolden.golden.id,
      buildId: null,
      physiqueId: null,
      profession: null,
    });
    syncRealmVitals(state, true);
    modal.classList.add("hidden");
    saveGameState(state);
    renderAll();

    if (getActiveApiKey(settings)) {
      await handlePlayerAction(
        `Mở màn chương 1: Nhân vật mới ${state.player.age} tuổi, xuất thân [${state.player.originName}], thể chất [${state.player.physiqueName}], chưa có Class hay Nghề nghiệp. Hãy bắt đầu từ chuyện nhỏ đời thường tại nơi xuất thân (quê nhà/thôn xóm/trấn nhỏ/ngoại môn tạp dịch), đi từ nhỏ đến lớn, từ yếu đến mạnh, và đưa ra 3-4 lựa chọn thực tế ban đầu.`,
        "system"
      );
    } else {
      state.logs.push({
        type: "system",
        title: "Chưa có Gemini API Key",
        text: "Nhân vật đã được tạo! Hãy bấm biểu tượng ⚙️ ở góc trên để dán Gemini API Key (miễn phí từ Google AI Studio), sau đó nhập hành động bất kỳ để bắt đầu chương 1.",
      });
      state.choices = [{ text: "Bắt đầu khám phá xung quanh", statTag: "Tâm trí" }];
      saveGameState(state);
      renderAll();
    }
  });
}

function openChooseClassModal() {
  if (!state || state.player.buildId) return;
  const modal = $("modal-newgame");
  const titleEl = modal.querySelector(".modal-header h3");
  const isW = state.worldId === "maphap";
  if (titleEl) titleEl.textContent = isW ? "⚔️ Chọn Class / Chức Nghiệp" : "⚔️ Định Hình Hướng Đạo / Class";
  modal.classList.remove("hidden");
  const classPool = isW ? WESTERN_CLASSES : BUILD_PATHS;
  $("newgame-body").innerHTML = `
    <div style="font-size:11.5px;color:var(--muted);margin-bottom:8px;">
      Chọn con đường tu luyện / chức nghiệp sau khi mạch truyện đã dẫn dắt. Lựa chọn này sẽ quyết định hệ số HP/MP và kỹ năng khởi đầu của hướng đó.
    </div>
    <div class="field-group">
      <label>${isW ? "Class / Chức Nghiệp" : "Hướng Đạo Chủ Đạo"}</label>
      <select id="pick-class-select">
        ${classPool
          .map((b) => {
            const hpTag = b.hpMult >= 1 ? `+${Math.round((b.hpMult - 1) * 100)}% HP` : `${Math.round((b.hpMult - 1) * 100)}% HP`;
            const mpTag = b.mpMult >= 1 ? `+${Math.round((b.mpMult - 1) * 100)}% MP` : `${Math.round((b.mpMult - 1) * 100)}% MP`;
            return `<option value="${b.id}">${b.name} (${hpTag}, ${mpTag})</option>`;
          })
          .join("")}
      </select>
    </div>
    <button id="btn-confirm-class" class="btn-primary">✅ Xác Nhận Chọn Class</button>
  `;
  $("btn-confirm-class").addEventListener("click", () => {
    const buildId = $("pick-class-select").value;
    const picked = choosePlayerClass(state, buildId);
    if (picked) {
      state.logs.push({
        type: "system",
        title: "Định Hình Con Đường",
        text: `Ngươi đã chính thức bước vào con đường [${picked.name}].`,
      });
      state.storySummary = `${state.storySummary} Đã chọn hướng [${picked.name}].`.slice(-600);
      saveGameState(state);
      renderAll();
    }
    modal.classList.add("hidden");
  });
}

function openChooseProfessionModal() {
  if (!state) return;
  const modal = $("modal-newgame");
  const titleEl = modal.querySelector(".modal-header h3");
  if (titleEl) titleEl.textContent = "🛠 Học / Chọn Nghề Nghiệp (Bách Nghệ)";
  modal.classList.remove("hidden");
  const world = WORLD_PRESETS[state.worldId];
  const learned = new Set((state.player.professions || []).map((pr) => pr.name));
  const available = world.professions.filter((pr) => !learned.has(pr));
  if (!available.length) {
    $("newgame-body").innerHTML = `<div class="list-card">Bạn đã học hết các nghề nghiệp hiện có của nhánh thế giới này.</div>`;
    return;
  }
  $("newgame-body").innerHTML = `
    <div style="font-size:11.5px;color:var(--muted);margin-bottom:8px;">
      Chọn nghề nghiệp phụ trợ sau khi nhân vật có cơ duyên tiếp xúc hoặc bái sư học nghề.
    </div>
    <div class="field-group">
      <label>Nghề Nghiệp</label>
      <select id="pick-prof-select">
        ${available.map((pr) => `<option value="${pr}">${pr}</option>`).join("")}
      </select>
    </div>
    <button id="btn-confirm-prof" class="btn-primary">✅ Bái Sư / Nhận Nghề</button>
  `;
  $("btn-confirm-prof").addEventListener("click", () => {
    const profName = $("pick-prof-select").value;
    if (choosePlayerProfession(state, profName)) {
      state.logs.push({
        type: "system",
        title: "Nhập Môn Nghề Nghiệp",
        text: `Ngươi đã bắt đầu học nghề [${profName} - Nhất Phẩm Học Đồ].`,
      });
      saveGameState(state);
      renderAll();
    }
    modal.classList.add("hidden");
  });
}

function openAuthorModal() {
  if (!state) return;
  const modal = $("modal-author");
  modal.classList.remove("hidden");
  $("author-body").innerHTML = `
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:8px;">
      <div class="field-group">
        <label>Cảnh Giới Hiện Tại (Sửa đồng bộ)</label>
        <input id="au-realm" value="${escapeHtml(state.player.realm)}" />
      </div>
      <div class="field-group">
        <label>Tu Vi (%)</label>
        <input id="au-tuvi" type="number" min="0" max="100" value="${state.player.cultivation}" />
      </div>
    </div>
    <div class="field-group">
      <label>Gieo Ý Tưởng / Định Hướng Cốt Truyện Cho AI</label>
      <textarea id="au-directive" rows="3" placeholder="VD: Cho một Bán Thần Olympus rơi xuống bí cảnh này, hoặc cho Sư huynh lộ mặt phản bội...">${escapeHtml(state.authorDirectives)}</textarea>
    </div>
    <div class="field-group">
      <label>Văn Phong & Nhịp Truyện</label>
      <input id="au-tone" value="${escapeHtml(state.tone)}" />
    </div>
    <div class="field-group">
      <label>Sổ Tay Âm Mưu Ẩn (Hidden GM Notes - Chỉ Tác Giả xem)</label>
      <textarea id="au-hidden" rows="4">${escapeHtml(state.hiddenNotes)}</textarea>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button id="au-save" class="btn-primary">💾 Lưu Can Thiệp</button>
      <button id="au-undo" class="btn-secondary">↩️ Quay Lại Lượt Trước (${state.snapshots?.length || 0})</button>
      <button id="au-export" class="btn-secondary">📖 Xuất Tiểu Thuyết (.md)</button>
    </div>
  `;

  $("au-save").addEventListener("click", () => {
    const newRealm = $("au-realm").value.trim();
    const newTuvi = Number($("au-tuvi").value);
    if (newRealm && newRealm !== state.player.realm) {
      state.player.realm = newRealm;
      const realms = WORLD_PRESETS[state.worldId]?.realmsByTier?.[state.player.tier] || [];
      const idx = realms.findIndex((r) => r.toLowerCase() === newRealm.toLowerCase());
      if (idx >= 0) state.player.realmIndex = idx;
    }
    if (!Number.isNaN(newTuvi)) {
      state.player.cultivation = Math.max(0, Math.min(100, newTuvi));
    }
    syncPhysiqueTierAbilities(state.player);
    state.authorDirectives = $("au-directive").value;
    state.tone = $("au-tone").value;
    state.hiddenNotes = $("au-hidden").value;
    saveGameState(state);
    modal.classList.add("hidden");
    renderAll();
  });

  $("au-undo").addEventListener("click", () => {
    if (!state.snapshots || state.snapshots.length === 0) {
      alert("Không còn bản lưu lượt trước.");
      return;
    }
    const prev = state.snapshots.shift();
    prev.snapshots = state.snapshots;
    state = prev;
    saveGameState(state);
    modal.classList.add("hidden");
    renderAll();
  });

  $("au-export").addEventListener("click", () => {
    const md = exportNovelMarkdown(state);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${state.player.name}_tieu_thuyet.md`;
    a.click();
  });
}

function openCreateTechniqueModal() {
  if (!state) return;
  const modal = $("modal-technique");
  modal.classList.remove("hidden");
  const check = canCreateTechnique(state);

  if (!check.allowed) {
    $("technique-body").innerHTML = `
      <div class="list-card" style="border-color:var(--danger);">
        <strong>🔒 Chưa Đủ Cơ Sở Kiến Thức</strong>
        <div style="color:var(--muted);margin-top:4px;">${escapeHtml(check.reason)}</div>
      </div>
    `;
    return;
  }

  $("technique-body").innerHTML = `
    <div class="field-group">
      <label>Cơ Sở Kiến Thức / Công Pháp Nền Tảng (Bắt buộc)</label>
      <select id="tech-base">
        ${check.bases.map((b) => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join("")}
      </select>
    </div>
    <div class="field-group">
      <label>Tên Công Pháp / Kiểu Tu Luyện Mới</label>
      <input id="tech-name" placeholder="VD: Lượng Tử Lôi Đình Quyết" />
    </div>
    <div class="field-group">
      <label>Nguyên Lý Diễn Hóa Từ Nền Tảng Trên (Tối thiểu 15 ký tự)</label>
      <textarea id="tech-principle" rows="4" placeholder="Giải thích rõ cách cải tiến/dung hợp từ cơ sở nền tảng đã chọn..."></textarea>
    </div>
    <button id="btn-submit-tech" class="btn-primary">⚡ Thử Nghiệm Sáng Tạo (Có rủi ro Tẩu Hỏa Nhập Ma)</button>
  `;

  $("btn-submit-tech").addEventListener("click", async () => {
    const base = $("tech-base").value;
    const name = $("tech-name").value.trim();
    const principle = $("tech-principle").value.trim();
    if (!name || principle.length < 15) {
      alert("Hãy nhập tên và giải thích rõ nguyên lý (ít nhất 15 ký tự).");
      return;
    }
    modal.classList.add("hidden");

    const checkRoll = resolveCustomTechnique(state, name, principle, base);
    if (checkRoll.success) {
      await handlePlayerAction(
        `[SÁNG TẠO CÔNG PHÁP THÀNH CÔNG] (Roll ${checkRoll.roll} >= ${checkRoll.threshold}). Dựa trên cơ sở: "${base}". Tên mới: "${name}". Nguyên lý: "${principle}". Hãy đóng vai Đạo Tổ thẩm định công pháp này trên thang điểm 0–100 (nêu rõ Điểm đánh giá + Xếp hạng S/A/B/C/D + nhận xét logic trong narrative), thêm công pháp vào \`newSkills\` với phẩm cấp/hiệu ứng/Đạo Ý Cảnh tương xứng, đồng thời thưởng \`statDeltas\` (cộng vào chỉ số chủ tu của công pháp + \`ngotinh\`) và \`potentialDelta\` (nếu đạt từ 80 điểm trở lên)!`,
        "system"
      );
    } else {
      state.player.hp = Math.max(5, Math.round(state.player.hp * 0.65));
      await handlePlayerAction(
        `[TẨU HỎA NHẬP MA KHI SÁNG TẠO CÔNG PHÁP] (Roll ${checkRoll.roll} < ${checkRoll.threshold}). Cố gắng diễn hóa "${name}" từ "${base}" nhưng nguyên lý sai lệch ("${principle}"). Kinh mạch phản phệ, trọng thương! Hãy viết diễn biến hậu quả.`,
        "system"
      );
    }
  });
}

function openTimeTravelModal() {
  if (!state) return;
  const modal = $("modal-timetravel");
  modal.classList.remove("hidden");
  const anchors = state.causalAnchors || [];
  const check = canTimeTravel(state);

  $("timetravel-body").innerHTML = `
    <div style="font-size:12px;color:var(--muted);">
      Dòng thời gian hiện tại: <strong style="color:var(--accent)">${escapeHtml(state.timeline || "Hiện Tại")}</strong><br/>
      <em>Quy luật Vòng Lặp Nhân Quả:</em> Hành động ở quá khứ thường chính là nguyên nhân định sẵn tạo ra các di tích, cơ duyên hoặc âm mưu ở tương lai!
    </div>
    <div class="list-card" style="border-color:${check.allowed ? "var(--tuvi)" : "var(--danger)"};">
      <strong>${check.allowed ? "✅ Đủ Điều Kiện Du Hành:" : "🔒 Chưa Đủ Điều Kiện:"}</strong>
      <div style="color:var(--muted);margin-top:2px;">${escapeHtml(check.reason)}</div>
    </div>
    <div class="field-group">
      <label>Mốc Thời Gian / Sự Kiện Muốn Du Hành Tới</label>
      <input id="tt-target" ${check.allowed ? "" : "disabled"} placeholder="VD: 1.000 năm trước thời Di Tích Cổ..." />
    </div>
    <div class="field-group">
      <label>Mục Đích / Hành Động Khi Quay Về</label>
      <textarea id="tt-intent" rows="3" ${check.allowed ? "" : "disabled"} placeholder="VD: Tìm chân tướng cuộc chiến Tân Thần - Cổ Thần..."></textarea>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button id="btn-tt-go" class="btn-primary" ${check.allowed ? "" : "disabled style='opacity:0.45;cursor:not-allowed;'"}>⏳ Kích Hoạt Ngược Dòng Thời Gian</button>
      ${
        state.timeline && state.timeline !== "Hiện Tại"
          ? `<button id="btn-tt-return" class="btn-secondary">⏩ Quay Về Hiện Tại</button>`
          : ""
      }
    </div>
    <hr style="border-color:var(--border);width:100%;" />
    <div style="font-weight:600;font-size:12px;">⚓ Các Mỏ Neo Nhân Quả Đã Gieo (${anchors.length})</div>
    ${
      anchors.length === 0
        ? `<div style="color:var(--muted);font-size:11.5px;">Chưa có mỏ neo nhân quả nào.</div>`
        : anchors.map((a) => `<div class="list-card">${escapeHtml(a)}</div>`).join("")
    }
  `;

  $("btn-tt-go").addEventListener("click", async () => {
    if (!check.allowed) return;
    const target = $("tt-target").value.trim();
    const intent = $("tt-intent").value.trim();
    if (!target) return alert("Hãy nhập mốc thời gian muốn du hành tới.");
    modal.classList.add("hidden");

    const roll = rollCheck(state.player.stats.linhhon + state.player.stats.ngotinh, 14);
    state.timeline = target;
    await handlePlayerAction(
      `[DU HÀNH VỀ QUÁ KHỨ - VÒNG LẶP NHÂN QUẢ] Nhân vật kích hoạt ngược dòng thời gian tới mốc: "${target}". Mục đích: "${intent || "Khám phá chân tướng"}". Kết quả ổn định thời-không: ${roll.tier} (d20=${roll.d20}). Hãy cập nhật \`timelineUpdate\`, tạo hoặc khép kín 1 \`newCausalAnchor\` cho thấy hành động ở quá khứ này chính là sự kiện định sẵn dẫn tới hiện tại!`,
      "system"
    );
  });

  $("btn-tt-return")?.addEventListener("click", async () => {
    modal.classList.add("hidden");
    state.timeline = "Hiện Tại";
    await handlePlayerAction(
      `[TRỞ VỀ HIỆN TẠI] Nhân vật quay trở lại dòng thời gian Hiện Tại sau chuyến du hành quá khứ. Hãy cập nhật \`timelineUpdate: "Hiện Tại"\` và miêu tả những biến đổi hoặc vòng lặp nhân quả vừa khép kín ở hiện tại!`,
      "system"
    );
  });
}

function openCatalogModal() {
  const modal = $("modal-catalog");
  modal.classList.remove("hidden");

  const isWest = state?.worldId === "maphap";
  const renderList = (cat, q = "") => {
    const query = q.trim().toLowerCase();
    const map = isWest
      ? {
          bloodlines: WESTERN_BLOODLINES,
          grimoires: WESTERN_GRIMOIRES,
          spells: WESTERN_SPELLS,
          items: WESTERN_ITEMS,
          creatures: MYTHIC_CREATURES.filter((c) => /hy lạp|bắc âu|ai cập|phương tây|lovecraft/i.test(c.culture || "")),
        }
      : {
          physiques: CATALOG_PHYSIQUES,
          congphap: CATALOG_CONG_PHAP,
          chienphap: CATALOG_CHIEN_PHAP,
          thuat: CATALOG_THUAT,
          creatures: MYTHIC_CREATURES,
        };
    const items = (map[cat] || []).filter((x) =>
      !query || `${x.name} ${x.group || ""} ${x.culture || ""} ${x.grade || ""} ${x.desc || x.effect || ""}`.toLowerCase().includes(query)
    );
    $("cat-results").innerHTML = items.slice(0, 60).map((it) => `
      <div class="list-card">
        <div class="list-card-head">
          <span>${escapeHtml(it.name)}</span>
          <span style="color:var(--accent);font-size:10.5px;">Tầng ${it.tier} ${it.grade ? `• ${escapeHtml(it.grade)}` : it.culture ? `• ${escapeHtml(it.culture)}` : ""}</span>
        </div>
        <div style="color:var(--muted);margin-top:2px;">${escapeHtml(it.desc || it.effect || "")}</div>
      </div>
    `).join("") + (items.length > 60 ? `<div style="color:var(--muted);font-size:11px;text-align:center;">Đang hiện 60/${items.length} mục. Hãy nhập từ khóa để lọc chi tiết hơn.</div>` : "");
  };

  $("catalog-body").innerHTML = `
    <div style="display:flex;gap:5px;flex-wrap:wrap;">
      <select id="cat-type" style="flex:1;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:7px;padding:7px;">
        ${
          isWest
            ? `<option value="bloodlines">Huyết Mạch Phương Tây</option>
               <option value="grimoires">Ma Điển (Grimoires)</option>
               <option value="spells">Ma Pháp & Ấn Chú (Spells)</option>
               <option value="items">Ma Dược & Cổ Vật (Items)</option>
               <option value="creatures">Sinh Vật Thần Thoại Tây Phương</option>`
            : `<option value="physiques">100 Thể Chất</option>
               <option value="congphap">200 Công Pháp (Rèn Thể Chất)</option>
               <option value="chienphap">200 Chiến Pháp</option>
               <option value="thuat">200 Thuật</option>
               <option value="creatures">200 Sinh Vật Huyền Bí Đông-Tây</option>`
        }
      </select>
      <input id="cat-search" placeholder="Tìm theo tên, Tầng, hệ..." style="flex:1;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:7px;padding:7px;" />
    </div>
    <div id="cat-results" style="max-height:55dvh;overflow-y:auto;"></div>
  `;

  const refresh = () => renderList($("cat-type").value, $("cat-search").value);
  $("cat-type").addEventListener("change", refresh);
  $("cat-search").addEventListener("input", refresh);
  refresh();
}

function openSettingsModal() {
  const modal = $("modal-settings");
  modal.classList.remove("hidden");
  const saves = listSaves();
  const curProvider = getActiveProvider(settings);
  const keyMeta = {
    gemini: { label: "Gemini API Key (Lấy tại aistudio.google.com)", placeholder: "AIza...", value: settings.apiKey || "" },
    groq: { label: "Groq API Key (Lấy miễn phí tại console.groq.com)", placeholder: "gsk_...", value: settings.groqApiKey || "" },
    openrouter: { label: "OpenRouter API Key (Lấy tại openrouter.ai)", placeholder: "sk-or-v1-...", value: settings.openrouterApiKey || "" },
  };
  const meta = keyMeta[curProvider] || keyMeta.gemini;

  $("settings-body").innerHTML = `
    <div class="field-group">
      <label>Nhà Cung Cấp AI (Provider)</label>
      <select id="set-provider">
        <option value="gemini" ${curProvider === "gemini" ? "selected" : ""}>Google Gemini (aistudio.google.com)</option>
        <option value="groq" ${curProvider === "groq" ? "selected" : ""}>Groq (Miễn phí nhanh, quota cao)</option>
        <option value="openrouter" ${curProvider === "openrouter" ? "selected" : ""}>OpenRouter (Nhiều model :free)</option>
      </select>
    </div>
    <div class="field-group">
      <label id="lbl-set-key">${meta.label}</label>
      <input id="set-key" type="password" value="${escapeHtml(meta.value)}" placeholder="${meta.placeholder}" />
    </div>
    <div class="field-group" id="grp-gemini-mode" style="${curProvider === "gemini" ? "" : "display:none;"}">
      <label>Chế Độ Model Gemini</label>
      <select id="set-model">
        <option value="auto" ${settings.modelMode === "auto" || !settings.modelMode ? "selected" : ""}>Tự Động (Flash)</option>
        <option value="flash" ${settings.modelMode === "flash" ? "selected" : ""}>Luôn dùng Flash (Nhanh nhất)</option>
        <option value="pro" ${settings.modelMode === "pro" ? "selected" : ""}>Luôn dùng Pro (Cân não sâu)</option>
      </select>
    </div>
    <div class="field-group">
      <label>Model Cụ Thể (Hoặc để mặc định của Provider)</label>
      <div style="display:flex;gap:6px;">
        <select id="set-custom-model" style="flex:1;">
          <option value="">-- Mặc định (Gemini: Auto / Groq: llama-3.3-70b-versatile) --</option>
          ${settings.customModel ? `<option value="${escapeHtml(settings.customModel)}" selected>${escapeHtml(settings.customModel)}</option>` : ""}
        </select>
        <button id="btn-fetch-models" class="btn-secondary" type="button">🔍 Quét</button>
      </div>
    </div>
    <div style="display:flex;gap:8px;">
      <button id="btn-save-settings" class="btn-primary">Lưu Cài Đặt</button>
      <button id="btn-new-from-set" class="btn-secondary">✨ Tạo Cuộc Đời Mới</button>
    </div>
    <hr style="border-color:var(--border);width:100%;" />
    <div style="font-weight:600;font-size:12px;">📂 Các Tiến Trình Đã Lưu (${saves.length})</div>
    ${
      saves.length === 0
        ? `<div style="color:var(--muted);font-size:12px;">Chưa có bản lưu nào.</div>`
        : saves
            .map(
              (s) => `
          <div class="list-card" style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <strong>${escapeHtml(s.name)}</strong> • Tầng ${s.tier} (${escapeHtml(s.realm)})<br/>
              <span style="color:var(--muted);font-size:10.5px;">${escapeHtml(s.worldName)} • Lượt ${s.turn}</span>
            </div>
            <div style="display:flex;gap:4px;">
              <button class="mini-btn btn-load-save" data-id="${s.id}">Chơi</button>
              <button class="mini-btn btn-del-save" data-id="${s.id}">Xóa</button>
            </div>
          </div>`
            )
            .join("")
    }
  `;

  const draftKeys = {
    gemini: settings.apiKey || "",
    groq: settings.groqApiKey || "",
    openrouter: settings.openrouterApiKey || "",
  };
  let activeDraftProvider = curProvider;

  $("set-provider").addEventListener("change", () => {
    draftKeys[activeDraftProvider] = $("set-key").value.trim();
    activeDraftProvider = $("set-provider").value;
    const m = keyMeta[activeDraftProvider] || keyMeta.gemini;
    $("lbl-set-key").textContent = m.label;
    $("set-key").placeholder = m.placeholder;
    $("set-key").value = draftKeys[activeDraftProvider] || "";
    $("grp-gemini-mode").style.display = activeDraftProvider === "gemini" ? "" : "none";
    $("set-custom-model").innerHTML = `<option value="">-- Mặc định (${activeDraftProvider === "groq" ? "llama-3.3-70b-versatile" : activeDraftProvider === "openrouter" ? "meta-llama/llama-3.3-70b-instruct:free" : "Auto"}) --</option>`;
  });

  $("btn-fetch-models").addEventListener("click", async () => {
    const prov = $("set-provider").value;
    const key = $("set-key").value.trim();
    if (!key && prov !== "openrouter") return alert("Hãy dán API Key trước.");
    $("btn-fetch-models").textContent = "⏳";
    try {
      const models = await listProviderModels(prov, key);
      const sel = $("set-custom-model");
      sel.innerHTML = `<option value="">-- Mặc định --</option>` +
        models.map((m) => `<option value="${escapeHtml(m)}" ${settings.customModel === m ? "selected" : ""}>${escapeHtml(m)}</option>`).join("");
    } catch (e) {
      alert(e.message);
    } finally {
      $("btn-fetch-models").textContent = "🔍 Quét";
    }
  });

  $("btn-save-settings").addEventListener("click", () => {
    const prov = $("set-provider").value;
    draftKeys[prov] = $("set-key").value.trim();
    settings.provider = prov;
    settings.apiKey = draftKeys.gemini;
    settings.groqApiKey = draftKeys.groq;
    settings.openrouterApiKey = draftKeys.openrouter;
    settings.modelMode = $("set-model").value;
    settings.customModel = $("set-custom-model").value;
    saveSettings(settings);
    modal.classList.add("hidden");
  });

  $("btn-new-from-set").addEventListener("click", () => {
    modal.classList.add("hidden");
    openNewGameModal();
  });

  $("settings-body").querySelectorAll(".btn-load-save").forEach((b) => {
    b.addEventListener("click", () => {
      const found = listSaves().find((s) => s.id === b.dataset.id);
      if (found) {
        state = found.state;
        if (syncRealmVitals(state)) saveGameState(state);
        modal.classList.add("hidden");
        renderAll();
      }
    });
  });

  $("settings-body").querySelectorAll(".btn-del-save").forEach((b) => {
    b.addEventListener("click", () => {
      deleteSave(b.dataset.id);
      openSettingsModal();
    });
  });
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

init();
