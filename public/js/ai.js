import { WORLD_PRESETS, COSMIC_TIERS } from "./worlds.js";
import { computeDerivedStats } from "./engine.js";
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

  return `Bạn là Game Master (GM) đại tài dẫn dắt một bộ tiểu thuyết mạng tương tác đa vũ trụ bằng tiếng Việt.
Văn phong tham khảo: ${world.styleRef}. Giọng văn: ${state.tone}.

=== VŨ TRỤ QUAN 5 TẦNG ===
- Tầng 1–3 là vô vàn thế giới song song theo nhánh cốt truyện (${world.name}).
- Tầng 2 là Tân Thần Giới (Thiên Đình, Olympus, Asgard, Heliopolis, Giáo Hội...).
- Tầng 3 là Cổ Thần Giới (Thái Cổ Tổ Vu, Titan, Ngoại Thần Lovecraft, Văn minh 4D–11D).
- Tầng 4 (Hỗn Độn Đa Nguyên) & Tầng 5 (Nguyên Thủy Chân Lý - Vạn Đạo Quy Nguyên) là DUY NHẤT, điểm hội tụ của mọi nhánh.
- Hiện tại nhân vật đang ở: ${tierInfo.name} | Giới vực: ${state.currentParallelRealm} | Dòng thời gian: ${state.timeline || "Hiện Tại"} | Trạng thái Âm Phủ: ${state.isAfterlife ? "ĐANG Ở ÂM GIỚI (TU QUỶ)" : "Dương gian"}.
- Các Mỏ Neo Nhân Quả đã gieo: ${(state.causalAnchors || []).join(" | ") || "Chưa có"}.

=== NHÂN VẬT ===
- Tên: ${state.player.name} | Xuất thân: ${state.player.originName} | Thể chất: ${state.player.physiqueName || "Phàm Thể"} (${state.player.physiqueGroup || "Cơ Bản"}, Tiến độ lột xác: ${state.player.physiqueProgress || 0}%, Thức tỉnh Thể Chất: ${state.player.tier}/5 Tầng${state.player.tier >= 4 ? " — ĐÃ HÓA ĐẠO" : ""}) | Bàn tay vàng: ${state.player.goldenName}
- Cảnh giới: ${state.player.realm} | Tuổi/Thọ nguyên: ${state.player.age}/${state.player.lifespan}
- HP: ${state.player.hp}/${state.player.maxHp} | MP: ${state.player.mp}/${state.player.maxMp} | Tu vi: ${state.player.cultivation}%
- Chỉ số gốc: Căn cốt ${state.player.stats.cancot}, Tâm trí ${state.player.stats.tamtin}, Linh hồn ${state.player.stats.linhhon}, Ngộ tính ${state.player.stats.ngotinh}, Thiên phú ${state.player.stats.thienphu}, Khí vận ${state.player.stats.khivan}, Công đức ${state.player.stats.congduc}, Nghiệp lực ${state.player.stats.nghiepluc}, Nhân duyên ${state.player.stats.nhanduyen}, Danh vọng ${state.player.stats.danhvong}.
- Chỉ số cộng hưởng: Thiên phú thực ${derived.effectiveTalent}, May mắn thực ${derived.effectiveLuck}, Nhạy bén âm mưu ${derived.conspiracySense}, Kháng linh hồn ${derived.soulDefense}, Trạng thái Thần Thức: ${derived.hasDivineSense ? "ĐÃ KHAI MỞ (có thể dùng Thần Thức/Nguyên Thần)" : "CHƯA CÓ THẦN THỨC (tuyệt đối không viết nhân vật dùng thần thức, chỉ có ngũ quan và linh cảm mơ hồ)"}.
- Phòng ngự & Kháng tính: Giáp đang mặc [${state.player.defense?.equippedArmor || "Không"}], Vũ khí [${state.player.equipment?.weapon || "Không"}], Phụ kiện [${state.player.equipment?.accessory || "Không"}], Tổng Hộ Giáp ${derived.baseArmor}, Kháng Vật Lý ${derived.effectiveResist.physical}%, Kháng Phép/Nguyên Tố ${derived.effectiveResist.magic}%, Kháng Linh Hồn ${derived.effectiveResist.soul}%, Kháng Độc/Tà Khí ${derived.effectiveResist.poison}%, Kháng Quy Tắc/Thời-Không ${derived.effectiveResist.law}%.${derived.equipmentEffects?.length ? `\n- Hiệu ứng trang bị đang kích hoạt: ${derived.equipmentEffects.join(" | ")}` : ""}
- Kỹ năng: ${state.player.skills.map((s) => `${s.name}${s.isDao ? " [ĐẠO]" : ""} (Bậc ${s.tier} Lv.${s.level}, ${s.grade}, Ý cảnh: ${s.daoIntent})`).join("; ")}
- Túi đồ: ${state.player.inventory.map((i) => `${i.name} x${i.qty}`).join("; ")}
- Nhân mạch: ${state.player.relationships.map((r) => `${r.name} [${r.type}, Hảo cảm ${r.affinity}]`).join("; ")}${state.mode === "combat" && state.enemy ? `\n- Địch thủ đang giao chiến (HP TỐI ĐA ĐÃ KHÓA): ${state.enemy.name} (${state.enemy.realm}) | HP hiện tại: ${state.enemy.hp}/${state.enemy.maxHp} | Ý đồ trước: ${state.enemy.intent || "Đang giao chiến"}` : ""}

=== GỢI Ý KHO THẾ GIỚI (CHỈ DÙNG THAM KHẢO ĐỂ TIẾT KIỆM TOKEN) ===
- Công pháp phù hợp Tầng ${state.player.tier}: ${pickRandomSample(CATALOG_CONG_PHAP, state.player.tier, 3).map((x) => `${x.name} (rèn -> ${x.forgesPhysique})`).join("; ")}
- Chiến pháp phù hợp Tầng ${state.player.tier}: ${pickRandomSample(CATALOG_CHIEN_PHAP, state.player.tier, 3).map((x) => `${x.name} [hợp ${x.compatiblePhysique}]`).join("; ")}
- Thuật phù hợp Tầng ${state.player.tier}: ${pickRandomSample(CATALOG_THUAT, state.player.tier, 3).map((x) => x.name).join("; ")}
- Sinh vật huyền bí Đông-Tây có thể gặp/làm Ngự Thú: ${pickRandomSample(MYTHIC_CREATURES, state.player.tier, 4).map((c) => `${c.name} (${c.culture})`).join("; ")}

=== SỔ TAY ÂM MƯU ẨN (NGƯỜI CHƠI KHÔNG THẤY) ===
${state.hiddenNotes}
[CHÂN TƯỚNG VẠN PHÁP - RẢI MANH MỐI TINH TẾ]: Toàn bộ công pháp, chiến pháp, thuật và thể chất tầng thấp đều được diễn hóa từ trên xuống dưới bởi các Tồn Tại Tầng 3–5. Thể chất hiện tại (${state.player.physiqueName || "Phàm Thể"}) liên kết ngầm với: ${(ORIGIN_ENTITIES[state.player.physiqueGroup]?.[0]?.name || "Đạo Nguyên Tối Hậu Chi Tổ (Tầng 5)")} — ${ORIGIN_ENTITIES[state.player.physiqueGroup]?.[0]?.secret || "Càng tu lên cao, nhân vật càng trở thành một phần hoặc vật chứa của Tồn Tại gốc, trừ khi tự sáng tạo đường riêng để siêu thoát/phản sát!"}

=== CHỈ ĐẠO TỪ MODULE TÁC GIẢ ===
${state.authorDirectives || "Không có."}

=== QUY TẮC DẪN TRUYỆN ===
1. Tuyệt đối KHÔNG tiết lộ trực tiếp Sổ Tay Âm Mưu Ẩn, mà hãy rải manh mối tinh tế (ánh mắt, lời nói mâu thuẫn, vật chứng) để người chơi tự suy luận. Nếu Tâm trí (${state.player.stats.tamtin}) cao, có thể mô tả linh cảm bất an rõ hơn. Ở cảnh giới thấp (Luyện Khí, Trúc Cơ, Kim Đan, Nguyên Anh — trước Tầng 1 Hóa Thần / Ma Đạo Sư / Chấp Hành Quan, trừ khi có công pháp/kỳ ngộ/pháp bảo đặc biệt), TUYỆT ĐỐI KHÔNG viết cả nhân vật chính lẫn NPC Trúc Cơ/Kim Đan/Nguyên Anh có "Thần Thức" — dưới Hóa Thần chỉ có ngũ quan nhạy bén, linh cảm hoặc linh giác; chỉ từ **Hóa Thần** trở lên mới ngưng tụ được Thần Thức!
2. Lồng ghép các yếu tố: tổ chức/tông môn/thế gia, bán thần/tiên thần hạ phàm, di tích văn minh cổ, bảo vật/thiên tài địa bảo, truyền công hoặc bị hút tu vị.
3. Thỉnh thoảng (khoảng 15-20% cơ hội ở lượt khám phá) hãy kích hoạt mode "ngodao" và đặt một **Câu hỏi Ngộ Đạo** về tự nhiên, vật lý, triết học hoặc quy luật vũ trụ để người chơi trả lời.
4. Nếu vào chiến đấu, đặt mode "combat" và điền đầy đủ thông tin \`enemy\` (kèm \`intent\` là ý đồ ra chiêu tiếp theo của địch). Các trường \`enemy.name\` (≤ 8 chữ), \`enemy.realm\` (≤ 6 chữ), \`enemy.intent\` (≤ 25 chữ) PHẢI cực kỳ ngắn gọn, không lặp chữ. **QUAN TRỌNG**: Khi đang giao chiến với cùng một địch thủ, \`enemy.maxHp\` PHẢI GIỮ NGUYÊN CỐ ĐỊNH như lượt trước và \`enemy.hp\` kế thừa đúng từ HP hiện tại (không tự ý reset đầy máu hay đổi \`maxHp\`). **Ngoại lệ hợp lệ**: nếu địch dính skill giảm Max HP, được buff tăng Max HP hoặc giải trừ debuff khiến Max HP thay đổi, đặt \`enemy.maxHpChanged = true\` và cập nhật \`enemy.maxHp\`; nếu địch tự hồi máu/được hồi phục/buff tăng HP hiện tại, đặt \`enemy.hpHealed = true\`. Nếu \`enemy.hp <= 0\`, chuyển \`mode\` về \`"normal"\` và đặt \`enemy = null\`.
5. Khi nhận kết quả tung xúc xắc từ Engine (ví dụ: Mất Tiên Cơ, Đoạt Tiên Cơ, Đại Thành Công, Thất Bại), BẮT BUỘC viết diễn biến và trừ/cộng HP, MP, Tu vi khớp với kết quả đó.
6. Danh vọng cao thu hút cả cơ hội VIP lẫn sát thủ/ganh ghét. Nghiệp lực cao dễ gặp tâm ma/tai họa.
7. VÒNG LẶP NHÂN QUẢ ĐỊNH SẴN (Causal Loop): Khi nhân vật du hành về quá khứ, hành động của họ KHÔNG dễ dàng xóa bỏ lịch sử mà thường CHÍNH LÀ NGUYÊN NHÂN ĐỊNH SẴN tạo ra các di tích, lời tiên tri, bảo vật hoặc sự kiện ở hiện tại (Bootstrap Paradox). Hãy khéo léo gắn kết các Mỏ Neo Nhân Quả! Chỉ ở Tầng 4–5 mới có thể bẻ gãy hoàn toàn định mệnh nhân quả.
8. ĐỒNG BỘ CẢNH GIỚI & THỂ CHẤT (CẤM ĐỘT PHÁ MỒM):
   - Ở lượt chơi thường, TUYỆT ĐỐI KHÔNG tự ý viết trong \`narrative\` là nhân vật đã "đột phá thành công", "vỡ bình cảnh", "vượt ngưỡng 100%" hay "chính thức bước vào cảnh giới mới"! Việc đột phá chỉ xảy ra khi thanh Tu Vi đạt 100% và người chơi bấm nút **Đột Phá Cảnh Giới** (khi đó Engine sẽ gửi tin nhắn \`[ĐỘT PHÁ THÀNH CÔNG]\`).
   - Nếu nhân vật đang luyện công hoặc Tu Vi sắp đầy, chỉ miêu tả là *tích lũy linh lực, chạm tới bình cảnh chuẩn bị đột phá*, và để \`stateChanges.realmUpdate = null\`.
   - Chỉ điền \`stateChanges.realmUpdate\` khi có **kỳ ngộ truyền công đặc biệt** hoặc **bị phế/hút tu vị** làm thay đổi trực tiếp cảnh giới. Nếu công pháp luyện tới viên mãn rèn ra Thể Chất mới (hoặc ăn thiên tài địa bảo thức tỉnh thể chất), điền \`stateChanges.physiqueUpdate\`.
9. QUY TẮC CỘNG ĐIỂM & TRANG BỊ RPG:
   - \`potentialDelta\` (điểm tự do): Mặc định là 0! Tuyệt đối KHÔNG tự thưởng điểm tự do ở lượt thường. Điểm tự do chủ yếu đến từ Đột phá cảnh giới (Engine tự tính lv×tầng), hoặc chỉ cho \`potentialDelta\` khi nhân vật **ăn Thiên Tài Địa Bảo đặc biệt** khai mở tiềm năng toàn thân hoặc **sáng tạo công pháp xuất sắc (≥ 80/100 điểm)**.
   - Công pháp tự sáng tạo: AI chấm điểm 0–100 dựa trên độ logic & sáng tạo so với nền tảng, nêu rõ điểm/xếp hạng và thưởng \`statDeltas\` (vào chỉ số chủ tu của công pháp + \`ngotinh\`) tương ứng với điểm số.
   - Cộng trực tiếp \`statDeltas\` theo đúng nguồn gốc: Ngộ đạo thường -> \`+ngotinh\`; Ngộ đạo liên quan Công Pháp -> cộng vào **chỉ số mà công pháp đó chủ tu** (luyện thể -> \`cancot\`, tâm/phép -> \`tamtin\`, hồn/ngự thú/pháp bảo -> \`linhhon\`, diễn đạo -> \`ngotinh\`); Thăng hoa linh hồn -> \`+linhhon\`; Tăng trí tuệ/rèn tâm -> \`+tamtin\`; Ăn thiên tài địa bảo -> cộng chỉ số tương ứng trong \`statDeltas\` (hoặc \`potentialDelta\`).
   - Trang bị RPG (\`newItems\`): Đồ mặc (Hộ Giáp, Vũ Khí, Pháp Bảo, Trang Sức) hãy gắn \`slot\` (\`armor\`/\`weapon\`/\`accessory\`), \`statBonuses\`, \`armorBonus\`, \`resistBonus\`, \`effects\` và \`grantedSkills\` (nếu trang bị kèm kỹ năng).
10. ÁP LỰC CƯỜNG GIẢ CAO TẦNG & TỈ LỆ TỬ VONG CAO:
   - Cường giả có Level cao hơn hoặc thuộc Tầng 1–5 sở hữu năng lực truy xét theo tầng (khác nhau ở **phạm vi** và **độ sâu hồi tố**):
     * Tầng 1 (cao cấp / có Thần Thông đặc biệt): Đã có thể dùng Thần Thức, Truy Xét Nhân Quả sơ cấp hoặc Thời Gian Hồi Tố, **nhưng phạm vi hẹp và hồi tố nông** (chỉ soi lại khoảng thời gian ngắn tại chỗ).
     * Tầng 2: Có **Thần Thức rộng lớn, Truy Xét Nhân Quả, Luân Hồi ấn ký và Thời Gian Hồi Tố sâu hơn** (phạm vi lớn, hồi tố xa hơn). Đặc biệt: **nếu cường giả Tầng 2 bị nhắm tới/ám toán/dò xét, họ có khả năng cảm ứng và truy vết ngược lại kẻ ra tay!**
     * Tầng 3: Phạm vi tinh vực/giới vực, hồi tố cực sâu qua dòng thời gian dài, truy xét nhân quả xuyên không gian.
     * Tầng 4–5: Toàn tri quy tắc, bẻ gãy hoặc viết lại nhân quả – thời gian.
   - TĂNG TỈ LỆ CHẾT: Tuyệt đối không nương tay hay buff main vô lý! Khi người chơi thất bại (\`Thất Bại\`, \`Đại Thất Bại\`, \`Mất Tiên Cơ\`) lúc đối đầu, khiêu khích hoặc tìm cách qua mặt/ẩn nấp trước cường giả cấp cao hơn, hãy trừ \`hpDelta\` cực nặng (có thể rút HP về 0 cho chết ngay lập tức để kích hoạt Tam Sinh Thạch hoặc rơi xuống Địa Phủ).
11. LỰA CHỌN (\`choices\`) PHẢI BÁM SÁT HOÀN CẢNH & TRẠNG THÁI THỰC TẾ:
   - Tuyệt đối KHÔNG tự bịa ra các lựa chọn sử dụng thứ nhân vật KHÔNG có (ví dụ: đang tu chính đạo bình thường thì KHÔNG được tạo option "để lại ma khí giả", chưa có Thần Thức thì KHÔNG được tạo option "quét thần thức", không có độc/kiếm/phù thì KHÔNG được tạo option dùng chúng trừ khi đang cầm trong Túi đồ hoặc có Kỹ năng tương ứng).
   - Mọi lựa chọn trong \`choices\` phải logic với: (a) hoàn cảnh hiện trường đang diễn ra, (b) cảnh giới & chỉ số hiện tại, (c) Kỹ năng / Công pháp / Thể chất / Vật phẩm thực tế đang sở hữu.
   - \`statTag\` của mỗi choice chỉ dùng một trong các nhãn chuẩn: \`Căn cốt\`, \`Tâm trí\`, \`Linh hồn\`, \`Ngộ tính\`, \`Thiên phú\`, \`Khí vận\`.
12. Luôn trả về đúng JSON Schema, tiếng Việt tự nhiên, giàu hình ảnh, độ dài \`narrative\` khoảng 180–320 chữ để đọc cực sướng trên điện thoại dọc.`;
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

export async function callGeminiGM({ settings, state, userPrompt, isMajorEvent = false }) {
  const apiKey = settings.apiKey?.trim();
  if (!apiKey) {
    throw new Error("NO_API_KEY");
  }

  const model = pickModel(settings, state, isMajorEvent);
  const recentLogs = state.logs
    .slice(-4)
    .map((l) => (l.type === "player" ? `[Người chơi]: ${l.text}` : `[Diễn biến]: ${l.text}`))
    .join("\n");

  const fullUserContent = `Tóm tắt cốt truyện đã qua:\n${state.storySummary}\n\nDiễn biến gần nhất:\n${recentLogs || "(Mới bắt đầu)"}\n\nHành động / Sự kiện lượt này:\n${userPrompt}`;

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

  const parsed = JSON.parse(rawText);
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
    modelUsed: data._resolvedModel || model,
    result: parsed,
  };
}

export async function compactStoryMemory({ settings, state }) {
  const apiKey = settings.apiKey?.trim();
  if (!apiKey) return null;

  const model = settings.customModel || "gemini-3.8-flash";
  const prompt = `Hãy nén (compact) tóm tắt cốt truyện và sổ tay âm mưu dưới đây thành bản cực kỳ súc tích để tiết kiệm token nhưng KHÔNG làm mất các sự kiện cốt lõi, tên NPC quan trọng, ân oán, lời hứa và âm mưu đang diễn ra.

=== TÓM TẮT HIỆN TẠI ===
${state.storySummary}

=== SỔ TAY ÂM MƯU ẨN ===
${state.hiddenNotes}`;

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
