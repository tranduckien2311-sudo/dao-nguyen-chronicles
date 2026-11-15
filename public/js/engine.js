import { WORLD_PRESETS, ORIGINS, GOLDEN_FINGERS, COSMIC_TIERS, PHYSIQUES } from "./worlds.js";
import { CATALOG_PHYSIQUES } from "./catalog.js";

const STORAGE_KEY = "dao_nguyen_saves_v1";
const SETTINGS_KEY = "dao_nguyen_settings_v1";

export function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function listSaves() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") || [];
  } catch {
    return [];
  }
}

export function saveGameState(state) {
  const saves = listSaves();
  const idx = saves.findIndex((s) => s.id === state.id);
  const record = {
    id: state.id,
    name: state.player.name,
    worldName: WORLD_PRESETS[state.worldId]?.name || state.worldId,
    tier: state.player.tier,
    realm: state.player.realm,
    turn: state.turn,
    updatedAt: new Date().toISOString(),
    state,
  };
  if (idx >= 0) saves[idx] = record;
  else saves.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saves.slice(0, 12)));
}

export function deleteSave(id) {
  const saves = listSaves().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
}

export function syncTamSinhThachDaily(player) {
  const todayStr = new Date().toLocaleDateString("en-CA");
  if (!player.tamSinhThach || player.tamSinhThach.lastResetDate !== todayStr) {
    player.tamSinhThach = {
      usesLeft: 3,
      maxPerDay: 3,
      lastResetDate: todayStr,
    };
  }
  return player.tamSinhThach;
}

export function getEquipSlot(item) {
  if (!item) return null;
  if (item.slot === "armor" || item.slot === "weapon" || item.slot === "accessory") return item.slot;
  const t = `${item.type || ""} ${item.name || ""}`;
  if (/hộ giáp|chiến giáp|pháp y|áo choàng|giáp/i.test(t)) return "armor";
  if (/vũ khí|kiếm|đao|thương|trượng|pháp bảo|thần binh|cung|súng/i.test(t)) return "weapon";
  if (/trang sức|nhẫn|ngọc bội|linh châu|dây chuyền|phù văn|ấn/i.test(t)) return "accessory";
  if (item.armorBonus || item.statBonuses || item.grantedSkills?.length) return "accessory";
  return null;
}

export function getEquippedItems(player) {
  const inv = player?.inventory || [];
  const equipped = inv.filter((i) => i.equipped);
  if (equipped.length === 0 && player?.defense?.equippedArmor) {
    const legacy = inv.find((i) => i.name === player.defense.equippedArmor);
    if (legacy) equipped.push(legacy);
  }
  return equipped;
}

export function toggleEquipItem(player, itemIndex) {
  const item = player?.inventory?.[itemIndex];
  if (!item) return { changed: false, reason: "Không tìm thấy vật phẩm." };
  const slot = getEquipSlot(item);
  if (!slot) return { changed: false, reason: "Vật phẩm này không phải trang bị." };

  player.equipment = player.equipment || { armor: null, weapon: null, accessory: null };
  player.skills = player.skills || [];

  const removeGearSkills = (gearName) => {
    player.skills = player.skills.filter((sk) => sk.fromEquipment !== gearName);
  };

  if (item.equipped) {
    item.equipped = false;
    if (player.equipment[slot] === item.name) player.equipment[slot] = null;
    if (slot === "armor" && player.defense) player.defense.equippedArmor = "Không";
    removeGearSkills(item.name);
    return { changed: true, equipped: false, slot, item };
  }

  // Unequip previous item in the same slot
  for (const other of player.inventory) {
    if (other.equipped && getEquipSlot(other) === slot) {
      other.equipped = false;
      removeGearSkills(other.name);
    }
  }

  item.equipped = true;
  item.slot = slot;
  player.equipment[slot] = item.name;
  if (slot === "armor") {
    player.defense = player.defense || {
      equippedArmor: item.name,
      armor: 0,
      resistances: { physical: 0, magic: 0, soul: 0, poison: 0, law: 0 },
    };
    player.defense.equippedArmor = item.name;
  }
  if (Array.isArray(item.grantedSkills)) {
    for (const gs of item.grantedSkills) {
      if (gs?.name && !player.skills.some((sk) => sk.name === gs.name)) {
        player.skills.unshift({
          ...structuredClone(gs),
          fromEquipment: item.name,
        });
      }
    }
  }
  return { changed: true, equipped: true, slot, item };
}

export function computeDerivedStats(player, lv = null) {
  const raw = player.stats;
  const equippedItems = getEquippedItems(player);
  const equipStatBonuses = {};
  let equipArmor = 0;
  const equipResists = { physical: 0, magic: 0, soul: 0, poison: 0, law: 0 };
  const equipmentEffects = [];

  for (const eq of equippedItems) {
    if (eq.statBonuses) {
      for (const [k, v] of Object.entries(eq.statBonuses)) {
        if (typeof v === "number" && v !== 0) {
          equipStatBonuses[k] = (equipStatBonuses[k] || 0) + v;
        }
      }
    }
    if (eq.armorBonus) equipArmor += eq.armorBonus;
    if (eq.resistBonus) {
      for (const [rk, rv] of Object.entries(eq.resistBonus)) {
        if (typeof rv === "number") equipResists[rk] = (equipResists[rk] || 0) + rv;
      }
    }
    if (eq.effects) equipmentEffects.push(`${eq.name}: ${eq.effects}`);
  }

  const physique =
    PHYSIQUES.find((ph) => ph.id === player.physiqueId) ||
    CATALOG_PHYSIQUES.find((ph) => ph.id === player.physiqueId) ||
    PHYSIQUES[0];
  const phyBonus = physique.bonus || {};

  const s = { ...raw };
  for (const [k, v] of Object.entries(equipStatBonuses)) {
    if (k in s) s[k] += v;
  }

  const effectiveTalent = Math.round(s.thienphu + s.cancot * 0.45);
  const effectiveComprehension = Math.round(s.ngotinh + s.tamtin * 0.3);
  const effectiveLuck = Math.round(s.khivan + s.congduc * 0.25 - s.nghiepluc * 0.3);
  const soulDefense = Math.round(s.linhhon * 1.5);
  const baseArmor = Math.round(s.cancot * 1.5) + (player.defense?.armor || 0) + equipArmor + (physique.id === "thanh_the" ? 10 : 0) + (phyBonus.armorBonus || 0);
  const res = player.defense?.resistances || {};
  const effectiveResist = {
    physical: Math.min(85, Math.max(res.physical || 0, equipResists.physical) + Math.floor(s.cancot * 0.6)),
    magic: Math.min(85, Math.max(res.magic || 0, equipResists.magic) + Math.floor(s.tamtin * 0.5)),
    soul: Math.min(90, Math.max(res.soul || 0, equipResists.soul) + Math.floor(s.linhhon * 1.2) + (physique.id === "hon_the" ? 15 : 0) + (phyBonus.resistSoul || 0)),
    poison: Math.min(85, Math.max(res.poison || 0, equipResists.poison) + Math.floor(s.cancot * 0.4)),
    law: Math.min(80, Math.max(res.law || 0, equipResists.law) + (player.tier >= 3 ? Math.floor(s.ngotinh * 0.5) : 0)),
  };
  const artifactSync = Math.min(100, 20 + s.linhhon * 4 + (physique.id === "kiem_tam" ? 20 : 0));
  const conspiracySense = Math.round(s.tamtin * 1.3 + s.ngotinh * 0.5 + (physique.id === "linh_tam" ? 8 : 0));
  const breakthroughBonus = Math.round(s.linhhon * 1.2 + effectiveLuck * 0.8);
  const cultivationSpeed = Math.round(100 + effectiveTalent * 2.5 + effectiveComprehension * 2 + (physique.speedBonus || 0));
  const hasSpecialSenseItem = (player.inventory || []).some((i) =>
    /(thần thức|nguyên thần|ma pháp chi tâm|linh nhãn|tinh thần hải)/i.test(`${i.name} ${i.desc} ${i.effects || ""}`)
  );
  const hasSpecialSenseSkill = (player.skills || []).some((s) =>
    /(thần thức|nguyên thần|ma pháp chi tâm|linh thị|tinh thần hải)/i.test(`${s.name} ${s.effect} ${s.daoIntent}`)
  );
  const hasDivineSense =
    player.tier >= 2 ||
    /hóa thần|luyện hư|hợp thể|đại thừa|độ kiếp|ma đạo sư|thánh vực|bán thần|chấp hành quan|siêu việt|hằng tinh|thiên hà|tiên|thần/i.test(player.realm || "") ||
    hasSpecialSenseItem ||
    hasSpecialSenseSkill;

  return {
    effectiveStats: s,
    equipStatBonuses,
    equipmentEffects,
    effectiveTalent,
    effectiveComprehension,
    effectiveLuck,
    soulDefense,
    baseArmor,
    effectiveResist,
    artifactSync,
    conspiracySense,
    breakthroughBonus,
    cultivationSpeed,
    hasDivineSense,
  };
}

export function createNewGame({ name, worldId, originId, goldenId, buildId, physiqueId, profession }) {
  const world = WORLD_PRESETS[worldId];
  const origin = ORIGINS.find((o) => o.id === originId) || ORIGINS[0];
  const golden = GOLDEN_FINGERS.find((g) => g.id === goldenId) || GOLDEN_FINGERS[0];
  const physique =
    PHYSIQUES.find((ph) => ph.id === physiqueId) ||
    CATALOG_PHYSIQUES.find((ph) => ph.id === physiqueId) ||
    PHYSIQUES[0];

  const baseStats = {
    cancot: 8,
    tamtin: 8,
    linhhon: 8,
    ngotinh: 8,
    thienphu: 8,
    khivan: 8,
    congduc: 10,
    nghiepluc: 0,
    nhanduyen: 20,
    danhvong: 5,
  };

  if (buildId === "thetu") baseStats.cancot += 5;
  if (buildId === "phaptu") baseStats.tamtin += 5;
  if (buildId === "hontu" || buildId === "phapbao" || buildId === "nguthu") baseStats.linhhon += 5;
  if (buildId === "daotu") baseStats.ngotinh += 5;

  for (const [k, v] of Object.entries(origin.bonus || {})) {
    if (k in baseStats) baseStats[k] += v;
  }
  for (const [k, v] of Object.entries(golden.bonus || {})) {
    if (k in baseStats) baseStats[k] += v;
  }
  for (const [k, v] of Object.entries(physique.bonus || {})) {
    if (k in baseStats) baseStats[k] += v;
  }

  const maxHp = 100 + baseStats.cancot * 12;
  const maxMp = 80 + baseStats.tamtin * 10 + baseStats.linhhon * 6;

  const starterArmor = {
    name: worldId === "tutien" ? "Thanh Vân Bố Y" : worldId === "maphap" ? "Áo Choàng Học Đồ" : "Giáp Nano Sơ Cấp",
    type: "Hộ Giáp",
    slot: "armor",
    equipped: true,
    qty: 1,
    armorBonus: 8,
    statBonuses: { cancot: 1 },
    resistBonus: { physical: 5, magic: 5 },
    effects: "Hộ thân cơ bản (+1 Căn Cốt, +8 Giáp, +5% Kháng Vật Lý/Phép).",
    desc: "Trang bị phòng ngự cơ bản (+1 Căn Cốt, +8 Giáp, +5% Kháng Vật Lý/Phép).",
  };
  const inventory = [
    { name: "Hồi Khí Đan / Dung Dịch Hồi Phục", type: "Đan Dược", qty: 2, desc: "Hồi 40% HP & MP." },
    starterArmor,
  ];
  if (golden.startItem) {
    inventory.unshift({ ...golden.startItem, qty: 1 });
  }

  const skills = structuredClone(world.defaultSkills);
  if (golden.startSkill) {
    skills.unshift(structuredClone(golden.startSkill));
  }

  const seed = world.conspiracySeeds[Math.floor(Math.random() * world.conspiracySeeds.length)];
  const hiddenNotes = [
    `Âm mưu nhánh thế giới: ${seed}`,
    `Bí mật xuất thân (${origin.name}): ${origin.secretHook}`,
    `Cái giá Bàn Tay Vàng (${golden.name}): ${golden.hiddenCost}`,
  ].join("\n");

  const currencies = {};
  for (const c of world.currencies) {
    currencies[c.key] = c.start;
  }

  const newState = {
    id: `run_${Date.now()}`,
    worldId,
    turn: 0,
    mode: "normal", // normal | combat | ngodao | gameover
    isAfterlife: false,
    afterlifeRealmIndex: 0,
    currentParallelRealm: world.parallelRealms[0],
    timeline: "Hiện Tại",
    causalAnchors: [],
    player: {
      name: name.trim() || "Lâm Phong",
      originId,
      originName: origin.name,
      goldenId,
      goldenName: golden.name,
      buildId,
      physiqueId: physique.id,
      physiqueName: physique.name,
      physiqueGroup: physique.group,
      physiqueBonus: structuredClone(physique.bonus || {}),
      physiqueProgress: 0,
      tamSinhThach: {
        usesLeft: 3,
        maxPerDay: 3,
        lastResetDate: new Date().toLocaleDateString("en-CA"),
      },
      tier: 1,
      realmIndex: 0,
      realm: world.realmsByTier[1][0],
      age: 18,
      lifespan: 120,
      hp: maxHp,
      maxHp,
      mp: maxMp,
      maxMp,
      cultivation: 0,
      potentialPoints: 3,
      stats: baseStats,
      defense: {
        equippedArmor: starterArmor.name,
        armor: 0,
        resistances: { physical: 0, magic: 0, soul: 0, poison: 0, law: 0 },
      },
      equipment: {
        armor: starterArmor.name,
        weapon: null,
        accessory: null,
      },
      currencies,
      professions: [{ name: profession, level: 1, rank: "Nhất Phẩm Học Đồ", exp: 0 }],
      skills,
      inventory,
      relationships: [
        {
          name: worldId === "tutien" ? "Thanh Vân Tông (Ngoại Môn)" : worldId === "maphap" ? "Tháp Pháp Sư Sơ Cấp" : "Chi Nhánh Tinh Hệ 09",
          type: "Sư Môn / Tổ Chức",
          affinity: 30,
          loyalty: 60,
          status: "Thành viên mới",
        },
      ],
    },
    enemy: null,
    ngodaoQuestion: null,
    choices: [],
    logs: [],
    storySummary: `Khởi đầu tại ${world.name}, ${name.trim() || "Lâm Phong"} mang thân phận ${origin.name}.`,
    hiddenNotes,
    authorDirectives: "",
    tone: "Cân não, chặt chẽ, phong cách tiểu thuyết mạng",
    snapshots: [],
  };
  syncPhysiqueTierAbilities(newState.player);
  return newState;
}

export function rollCheck(statValue, difficulty = 12) {
  const d20 = Math.floor(Math.random() * 20) + 1;
  const total = d20 + Math.floor(statValue / 2);
  let tier = "Thành Công";
  if (d20 === 20 || total >= difficulty + 10) tier = "Đại Thành Công";
  else if (d20 === 1 || total < difficulty - 5) tier = "Đại Thất Bại";
  else if (total < difficulty) tier = "Thất Bại";
  return { d20, total, difficulty, tier };
}

export function resolveCombatCheck(state, userText) {
  const derived = computeDerivedStats(state.player);
  const text = (userText || "").trim();
  const lower = text.toLowerCase();

  if (text.length < 4) {
    return {
      outcome: "Mất Tiên Cơ - Bị Đả Thương",
      reason: "Hành động quá sơ sài, không đủ ứng biến trước sát chiêu của địch.",
      roll: { d20: 1, total: 1 },
    };
  }

  // Kiểm tra hành động ngạo mạn phi thực tế ở tầng thấp
  const godlikeAbuse = /(búng tay chết|nhất kích tất sát|vô địch|xóa sổ vũ trụ|chết ngay)/i.test(lower);
  if (godlikeAbuse && state.player.tier < 4) {
    return {
      outcome: "Mất Tiên Cơ - Bị Đả Thương",
      reason: "Vọng tưởng vượt cấp, sơ hở toàn thân khiến địch nhân chớp thời cơ phản công trọng thương!",
      roll: { d20: 2, total: 2 },
    };
  }

  // Kiểm tra có nhắc đến kỹ năng đã học hoặc chiến thuật hợp lý không
  const matchedSkill = state.player.skills.find((sk) => lower.includes(sk.name.toLowerCase().slice(0, 6)));
  const bonus = matchedSkill ? matchedSkill.tier * 3 + Math.floor(matchedSkill.level / 2) : 0;
  const baseStat = Math.max(state.player.stats.cancot, state.player.stats.tamtin, state.player.stats.linhhon);
  const d20 = Math.floor(Math.random() * 20) + 1;
  const luckMod = Math.floor(derived.effectiveLuck / 6);
  const score = d20 + Math.floor(baseStat / 2) + bonus + luckMod;

  if (d20 === 1 || score < 14) {
    return {
      outcome: "Mất Tiên Cơ - Bị Đả Thương",
      reason: "Phán đoán sai ý đồ địch hoặc vận khí bất ổn, bị đả thương và mất nhịp độ.",
      roll: { d20, total: score },
    };
  }
  if (d20 >= 18 || score >= 24) {
    return {
      outcome: "Đoạt Tiên Cơ - Khắc Chế",
      reason: matchedSkill
        ? `Vận dụng chuẩn xác [${matchedSkill.name}] đánh trúng tử huyệt của địch!`
        : "Chiến thuật sắc bén, đọc thấu sơ hở của địch để tung đòn chí mạng!",
      roll: { d20, total: score },
    };
  }
  return {
    outcome: "Giao Tranh Cân Bằng",
    reason: "Ứng biến hợp lý, hai bên giằng co quyết liệt.",
    roll: { d20, total: score },
  };
}

export function resolveBreakthrough(state) {
  const derived = computeDerivedStats(state.player);
  const baseChance = 55 + derived.breakthroughBonus;
  const roll = Math.floor(Math.random() * 100) + 1;
  const success = roll <= Math.min(95, Math.max(20, baseChance));
  return { success, roll, chance: Math.min(95, Math.max(20, baseChance)) };
}

export function canCreateTechnique(state) {
  const p = state.player;
  const masteredSkills = (p.skills || []).filter((s) => s.mastery >= 60 || s.level >= 3 || s.tier >= 2);
  const hasOriginKnowledge =
    (p.originId === "xuyenkhong" || p.originId === "trungsinh") &&
    p.stats.ngotinh + p.stats.tamtin >= 20;
  const hasHighComprehension = p.stats.ngotinh >= 15 && (p.skills || []).length >= 2;

  if (masteredSkills.length > 0 || hasOriginKnowledge || hasHighComprehension) {
    return {
      allowed: true,
      bases: [
        ...p.skills.map((s) => `${s.name} (Bậc ${s.tier} Lv.${s.level}, Lĩnh ngộ ${s.mastery}%)`),
        ...(p.originId === "xuyenkhong" ? ["Kiến thức Khoa học / Vật lý Hiện đại"] : []),
        ...(p.originId === "trungsinh" ? ["Ký ức Tu luyện Kiếp trước"] : []),
      ],
    };
  }
  return {
    allowed: false,
    reason:
      "Chưa đủ cơ sở kiến thức! Cần có ít nhất 1 công pháp đạt Lĩnh Ngộ ≥ 60% (hoặc Lv.3+), HOẶC Ngộ Tính ≥ 15 với từ 2 kỹ năng trở lên để tham chiếu.",
    bases: [],
  };
}

export function resolveCustomTechnique(state, techName, principle, baseKnowledge) {
  const derived = computeDerivedStats(state.player);
  const difficulty = 50 - Math.min(35, derived.effectiveComprehension + Math.floor(derived.effectiveLuck / 2));
  const roll = Math.floor(Math.random() * 100) + 1;
  const success = roll >= difficulty && principle.trim().length >= 15 && Boolean(baseKnowledge);
  return { success, roll, threshold: difficulty, techName, principle, baseKnowledge };
}

export function canTimeTravel(state) {
  const p = state.player;
  if (state.timeline && state.timeline !== "Hiện Tại") {
    return { allowed: true, reason: "Đang ở quá khứ, có thể quay về Hiện Tại." };
  }
  if (p.tier >= 4) {
    return { allowed: true, reason: "Đã đạt Tầng 4 (Hỗn Độn Đa Nguyên), đủ sức nghịch chuyển dòng thời gian." };
  }
  const timeSkill = (p.skills || []).find((s) =>
    /(thời gian|quang âm|nhân quả|luân hồi)/i.test(`${s.name} ${s.daoIntent} ${s.effect}`)
  );
  if (p.tier >= 3 && timeSkill) {
    return { allowed: true, reason: `Đạt Tầng 3 và nắm giữ [${timeSkill.name}].` };
  }
  const tier4Artifact = (p.inventory || []).find((i) =>
    /(tầng 4|tầng 5|hỗn độn|chân lý|đại đạo)/i.test(`${i.name} ${i.type} ${i.desc}`)
  );
  if (tier4Artifact) {
    return { allowed: true, reason: `Sở hữu bảo vật cấp cao [${tier4Artifact.name}].` };
  }
  const tier3TimeArtifact = (p.inventory || []).find(
    (i) =>
      /(thời gian|quang âm|sa lậu|nhân quả|luân hồi)/i.test(`${i.name} ${i.desc}`) &&
      /(tầng 3|cổ thần|thái cổ)/i.test(`${i.name} ${i.type} ${i.desc}`)
  );
  if (tier3TimeArtifact) {
    return { allowed: true, reason: `Sở hữu bảo vật Thời Gian Tầng 3 [${tier3TimeArtifact.name}].` };
  }
  return {
    allowed: false,
    reason:
      "Chưa đủ điều kiện! Cần đạt Tầng 4+, hoặc Tầng 3 tu Thời Gian/Nhân Quả/Luân Hồi, hoặc có Bảo vật Tầng 4+, hoặc Bảo vật Thời Gian Tầng 3.",
  };
}

export function getContinuousLevel(state) {
  if (!state || !state.player) return 1;
  const p = state.player;
  if (state.isAfterlife) {
    return (state.afterlifeRealmIndex || 0) + 1;
  }
  const world = WORLD_PRESETS[state.worldId];
  let offset = 0;
  for (let t = 1; t < (p.tier || 1); t++) {
    offset += (world?.realmsByTier?.[t]?.length || 0);
  }
  return offset + (p.realmIndex || 0) + 1;
}

export function getPhysiqueInfo(player) {
  const found =
    CATALOG_PHYSIQUES.find((ph) => ph.id === player.physiqueId) ||
    PHYSIQUES.find((ph) => ph.id === player.physiqueId) ||
    CATALOG_PHYSIQUES.find((ph) => ph.name === player.physiqueName) ||
    PHYSIQUES[0];
  let nextId = found.nextPhysiqueId || null;
  let nextName = found.nextPhysiqueName || null;
  if (!nextId && found.id === "phamthe") {
    nextId = "phy_1";
    nextName = CATALOG_PHYSIQUES[0]?.name || "Bách Độc Bất Xâm Thể";
  }
  return { current: found, nextId, nextName, effectiveBonus: player.physiqueBonus || found.bonus || {} };
}

export function getPhysiqueTierAbilities(physique) {
  if (Array.isArray(physique?.tierAbilities) && physique.tierAbilities.length > 0) {
    return physique.tierAbilities;
  }
  const baseName = (physique?.name || "Phàm Thể").replace(" Thể", "");
  const group = physique?.group || "Cơ Bản";
  return [
    {
      unlockTier: 1,
      name: `Thần Thông T1: ${baseName} Khai Khiếu`,
      category: "Thần Thông Thể Chất",
      grade: "Phàm/Hoàng Giai",
      tier: 1,
      level: 1,
      mastery: 25,
      isDao: false,
      daoIntent: "Sơ Khởi Bản Mệnh",
      effect: `Thần thông Tầng 1 thức tỉnh từ [${physique?.name || "Phàm Thể"}].`,
    },
    {
      unlockTier: 2,
      name: `Thần Thông T2: ${baseName} Linh Ấn`,
      category: "Thần Thông Thể Chất",
      grade: "Địa Giai",
      tier: 2,
      level: 1,
      mastery: 25,
      isDao: false,
      daoIntent: `Huyền Ấn ${group}`,
      effect: `Thần thông Tầng 2 của [${physique?.name || "Phàm Thể"}], dung hợp pháp tắc Tân Thần Giới.`,
    },
    {
      unlockTier: 3,
      name: `Thần Thông T3: ${baseName} Cực Cảnh`,
      category: "Thần Thông Thể Chất",
      grade: "Thiên Giai",
      tier: 3,
      level: 1,
      mastery: 25,
      isDao: false,
      daoIntent: `Cổ Thần ${group}`,
      effect: `Thần thông Tầng 3 cực cảnh của [${physique?.name || "Phàm Thể"}].`,
    },
    {
      unlockTier: 4,
      name: `Đại Đạo T4: ${group} Chi Đạo (${baseName})`,
      category: "Đại Đạo Thể Chất",
      grade: "Hỗn Độn Giai",
      tier: 4,
      level: 1,
      mastery: 35,
      isDao: true,
      daoIntent: `Thần Thông Hóa Đạo • ${group}`,
      effect: `Tầng 4 Thần Thông Hóa Đạo! Thần thông thể chất hợp nhất thành Đại Đạo, thao túng Hỗn Độn.`,
    },
    {
      unlockTier: 5,
      name: `Chân Đạo T5: ${baseName} Nguyên Thủy Đạo`,
      category: "Nguyên Thủy Đại Đạo",
      grade: "Nguyên Thủy Giai",
      tier: 5,
      level: 1,
      mastery: 50,
      isDao: true,
      daoIntent: "Vạn Đạo Quy Nguyên",
      effect: `Tầng 5 Nguyên Thủy Chân Đạo! Đạo đạt tới Chân Lý tuyệt đối.`,
    },
  ];
}

export function syncPhysiqueTierAbilities(player) {
  const { current: physique } = getPhysiqueInfo(player);
  const abilities = getPhysiqueTierAbilities(physique);
  const currentTier = Math.max(1, Math.min(5, player.tier || 1));
  player.skills = player.skills || [];
  const newlyUnlocked = [];
  const evolvedToDao = [];

  for (const ab of abilities) {
    if (ab.unlockTier <= currentTier) {
      const exists = player.skills.some(
        (s) => s.name === ab.name || (s.physiqueOriginId === physique.id && s.unlockTier === ab.unlockTier)
      );
      if (!exists) {
        const cloned = {
          ...structuredClone(ab),
          physiqueOriginId: physique.id,
        };
        player.skills.unshift(cloned);
        newlyUnlocked.push(cloned);
      }
    }
  }

  if (currentTier >= 4) {
    for (const sk of player.skills) {
      const isPhysiqueDivine =
        sk.category === "Thần Thông Thể Chất" ||
        sk.category === "Đại Đạo Thể Chất" ||
        Boolean(sk.physiqueOriginId);
      if (isPhysiqueDivine && (!sk.isDao || (currentTier === 5 && sk.tier < 5))) {
        sk.isDao = true;
        sk.tier = Math.max(sk.tier || 1, currentTier);
        sk.category = currentTier >= 5 ? "Nguyên Thủy Đại Đạo" : "Đại Đạo Thể Chất (Hóa Đạo)";
        sk.grade = currentTier >= 5 ? "Nguyên Thủy Giai" : "Hỗn Độn Giai";
        sk.daoIntent = currentTier >= 5 ? "Vạn Đạo Quy Nguyên" : `Thần Thông Hóa Đạo • ${physique.group}`;
        if (!String(sk.effect || "").includes("[Đã Hóa Đạo]")) {
          sk.effect = `${sk.effect || ""} [Đã Hóa Đạo: Thần thông Tầng ${currentTier} thăng hoa thành Bản Nguyên Đại Đạo!]`.trim();
        }
        evolvedToDao.push(sk.name);
      }
    }
  }

  return { newlyUnlocked, evolvedToDao };
}

export function enterAfterlife(state) {
  const world = WORLD_PRESETS[state.worldId];
  state.isAfterlife = true;
  state.afterlifeRealmIndex = 0;
  state.currentParallelRealm = world.afterlife.name;
  state.player.realm = world.afterlife.realms[0];
  state.player.hp = Math.max(50, Math.round(state.player.maxHp * 0.6));
  state.player.mp = Math.max(50, Math.round(state.player.maxMp * 0.8));
  state.mode = "normal";
  state.enemy = null;
  state.logs.push({
    type: "system",
    title: `LINH HỒN RỚT XUỐNG ${world.afterlife.name.toUpperCase()}`,
    text: `Nhục thân đã hủy, nhưng Linh Hồn (${state.player.stats.linhhon}) vẫn còn nguyên vẹn! Ngươi chuyển sang tu luyện Quỷ Đạo (${state.player.realm}). Hãy tìm cách tích lũy sức mạnh để Tái Tạo Nhục Thân hoặc Hoàn Dương Báo Thù!`,
  });
}

export function pushSnapshot(state) {
  const copy = structuredClone(state);
  copy.snapshots = [];
  state.snapshots = [copy, ...(state.snapshots || [])].slice(0, 5);
}

export function exportNovelMarkdown(state) {
  const world = WORLD_PRESETS[state.worldId];
  const lines = [
    `# Nhật Ký Hành Trình: ${state.player.name}`,
    `- **Thế giới:** ${world?.name || state.worldId} (${COSMIC_TIERS[state.player.tier - 1]?.name})`,
    `- **Xuất thân:** ${state.player.originName} | **Bàn tay vàng:** ${state.player.goldenName}`,
    `- **Cảnh giới hiện tại:** ${state.player.realm}`,
    "",
    "---",
    "",
  ];
  for (const log of state.logs) {
    if (log.type === "player") {
      lines.push(`> **Hành động của ${state.player.name}:** ${log.text}\n`);
    } else if (log.type === "narrative") {
      lines.push(`${log.text}\n`);
    } else if (log.type === "system") {
      lines.push(`**[Hệ Thống - ${log.title || "Thông Báo"}]:** ${log.text}\n`);
    }
  }
  return lines.join("\n");
}
