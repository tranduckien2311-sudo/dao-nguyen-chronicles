import json
from pathlib import Path

OUT_JS = Path(r"C:\Users\trand\.gemini\antigravity\scratch\dao-nguyen-chronicles\public\js\catalog.js")
OUT_MD = Path(r"C:\Users\trand\.gemini\antigravity\brain\058d7038-52c7-4de6-b827-e2e0b965f127\full_catalog_list.md")

# --- 12 TỒN TẠI NGUYÊN THỦY / CAO TẦNG (Vạn pháp diễn hóa từ trên xuống dưới) ---
ORIGIN_ENTITIES = {
    "Thể Xác": [
        {"name": "Bàn Cổ Thái Cổ Tổ Thần (Tầng 3 → 4)", "secret": "Nhục thân của ngươi đang tái dựng lại mảnh vỡ thân xác Bàn Cổ để Ngài mượn xác hoàn hồn."},
        {"name": "Vĩnh Hằng Chân Lý Chi Khu (Tầng 5)", "secret": "Mọi công pháp luyện thể đều là bản sao suy giảm từ Chân Thân của Tồn Tại Tầng 5."},
    ],
    "Tâm Linh": [
        {"name": "Akasha Toàn Tri Chi Nhãn (Tầng 4 → 5)", "secret": "Mỗi khi Tâm Trí tăng lên, Tồn Tại Toàn Tri đang nhìn xuyên qua đôi mắt của chính ngươi."},
        {"name": "Ngoại Thần Yog-Sothoth (Tầng 3 → 4)", "secret": "Tinh thần lực và ma pháp chi tâm thực chất là ăng-ten kết nối với tri thức cấm kỵ của Ngoại Thần."},
    ],
    "Linh Hồn": [
        {"name": "Vĩnh Hằng Bất Diệt Chân Linh (Tầng 5)", "secret": "Linh hồn ngươi là một mảnh phân hồn bị đánh rơi từ Kỷ Nguyên Trước của Ngài."},
        {"name": "Cửu U Minh Giới Chi Tổ (Tầng 3 → 4)", "secret": "Tu luyện Quỷ đạo/Linh hồn càng sâu, ấn ký Minh Tổ càng khắc chặt vào thức hải."},
    ],
    "Đạo": [
        {"name": "Đạo Nguyên Tối Hậu Chi Tổ (Tầng 5)", "secret": "Nguồn gốc của 3.000 Đại Đạo; mọi công pháp tầng thấp đều là mảnh vụn diễn hóa từ một hơi thở của Ngài."},
        {"name": "Thời Không Hỗn Độn Ma Thần (Tầng 4)", "secret": "Các thuật Không-Thời gian đang âm thầm đồng bộ hóa tọa độ linh hồn ngươi về Hỗn Độn Hải."},
    ],
    "Ngự Thú": [
        {"name": "Nguyên Thủy Sinh Linh Chi Tổ (Tầng 5)", "secret": "Huyết mạch vạn thú và thần thú Đông-Tây đều tách ra từ một thực thể Mẫu Thể Nguyên Thủy."},
        {"name": "Yggdrasil & Thái Cổ Thú Hoàng (Tầng 3 → 4)", "secret": "Khế ước Ngự Thú thực chất là kết nối lại mạng lưới sinh mệnh của Cây Thế Giới cổ đại."},
    ],
    "Pháp Bảo": [
        {"name": "Vạn Pháp Thần Binh Chi Tổ (Tầng 4 → 5)", "secret": "Luyện khí và Khí linh đều là mảnh vỡ của Thần Khí Khởi Nguyên đang tìm đường hợp nhất lại thành một."},
        {"name": "Cổ Bảo Tạo Hóa Lò Đỉnh (Tầng 3 → 4)", "secret": "Chủ nhân cũ của Lò Đỉnh đang dùng thể chất Pháp Bảo của ngươi để tự rèn lại bản thân."},
    ],
}

# --- 100 THỂ CHẤT (Xếp nghiêm ngặt từ Phàm -> Chân Lý) ---
PHYSIQUE_ROOTS = {
    "Thể Xác": [
        (1, "Hoàng Giai", "Thiết Bì Đồng Cốt Thể"),
        (1, "Hoàng Giai", "Bách Độc Bất Xâm Thể"),
        (1, "Huyền Giai", "Man Ngưu Cự Lực Thể"),
        (1, "Huyền Giai", "Huyền Thiết Bá Thể"),
        (1, "Địa Giai", "Kim Cương Bất Hoại Thể"),
        (1, "Địa Giai", "Long Tượng Trấn Ngục Thể"),
        (1, "Thiên Giai", "Bất Diệt Kim Thân"),
        (1, "Thiên Giai", "Cường Hóa Gen Nguyên Thủy"),
        (2, "Tiên / Thần Giai", "Hoang Cổ Thánh Thể"),
        (2, "Tiên / Thần Giai", "Thương Thiên Bá Thể"),
        (2, "Tiên / Thần Giai", "Asgard Chiến Thần Khu"),
        (3, "Cổ Thần Giai", "Thái Cổ Tổ Vu Thân"),
        (3, "Cổ Thần Giai", "Bàn Cổ Khai Thiên Khu"),
        (3, "Cổ Thần Giai", "Titan Bất Tử Thần Khu"),
        (4, "Hỗn Độn / Đạo Tận", "Hỗn Độn Vô Cấu Nhục Thân"),
        (4, "Hỗn Độn / Đạo Tận", "Bất Diệt Đại Đạo Thân"),
        (5, "Nguyên Thủy Chân Lý", "Vĩnh Hằng Chân Lý Chi Khu"),
    ],
    "Tâm Linh": [
        (1, "Hoàng Giai", "Tĩnh Tâm Minh Cảnh Thể"),
        (1, "Hoàng Giai", "Linh Mẫn Cảm Quan Thể"),
        (1, "Huyền Giai", "Băng Tâm Ngọc Khiết Thể"),
        (1, "Huyền Giai", "Thanh Minh Linh Thị Thể"),
        (1, "Địa Giai", "Ma Pháp Chi Tâm Sơ Khởi"),
        (1, "Địa Giai", "Thiên Nhãn Thông Minh Thể"),
        (1, "Thiên Giai", "Thất Khiếu Linh Lung Tâm"),
        (1, "Thiên Giai", "Vạn Tượng Huyễn Tâm Thể"),
        (2, "Tiên / Thần Giai", "Thần Thức Vô Lượng Thể"),
        (2, "Tiên / Thần Giai", "Thánh Quang Linh Tâm"),
        (2, "Tiên / Thần Giai", "Tinh Thần Hải Chi Tâm"),
        (3, "Cổ Thần Giai", "Toàn Tri Lượng Tử Não"),
        (3, "Cổ Thần Giai", "Cao Duy Thần Niệm Thể"),
        (3, "Cổ Thần Giai", "Thái Thượng Vong Tình Tâm"),
        (4, "Hỗn Độn / Đạo Tận", "Hỗn Độn Toàn Tri Thức Hải"),
        (4, "Hỗn Độn / Đạo Tận", "Akasha Chi Nhãn Thể"),
        (5, "Nguyên Thủy Chân Lý", "Nguyên Thủy Chân Lý Chi Tâm"),
    ],
    "Linh Hồn": [
        (1, "Hoàng Giai", "Ngưng Hồn Tĩnh Khí Thể"),
        (1, "Hoàng Giai", "An Hồn Định Phách Thể"),
        (1, "Huyền Giai", "U Minh Quỷ Hồn Thể"),
        (1, "Huyền Giai", "Tâm Ma Bất Xâm Thể"),
        (1, "Địa Giai", "Đoạt Xá Miễn Nhiễm Thể"),
        (1, "Địa Giai", "Vong Xuyên Độ Hồn Thể"),
        (1, "Thiên Giai", "Thái Sơ Linh Hồn Thể"),
        (1, "Thiên Giai", "Phản Hồn Thánh Khu"),
        (2, "Tiên / Thần Giai", "Cửu U Minh Đế Hồn Thể"),
        (2, "Tiên / Thần Giai", "Valhalla Anh Linh Thể"),
        (2, "Tiên / Thần Giai", "Thiên Hồn Quy Nhất Thể"),
        (3, "Cổ Thần Giai", "Bất Diệt Nguyên Thần Thể"),
        (3, "Cổ Thần Giai", "Cổ Thần Tàn Hồn Dung Hợp Thể"),
        (3, "Cổ Thần Giai", "Vĩnh Sinh Ý Thức Thể"),
        (4, "Hỗn Độn / Đạo Tận", "Hỗn Độn Nguyên Linh Thể"),
        (4, "Hỗn Độn / Đạo Tận", "Đa Nguyên Vạn Hồn Chi Chủ"),
        (5, "Nguyên Thủy Chân Lý", "Chân Lý Bất Tử Nguyên Linh"),
    ],
    "Đạo": [
        (1, "Hoàng Giai", "Linh Khí Thân Hòa Thể"),
        (1, "Hoàng Giai", "Ngũ Hành Tương Sinh Thể"),
        (1, "Huyền Giai", "Phong Lôi Đạo Ý Thể"),
        (1, "Huyền Giai", "Thái Cực Âm Dương Thể"),
        (1, "Địa Giai", "Tự Nhiên Đạo Vận Thể"),
        (1, "Địa Giai", "Tinh Thần Chi Đạo Thể"),
        (1, "Thiên Giai", "Tiên Thiên Đạo Thai"),
        (1, "Thiên Giai", "Thiên Mệnh Chi Tử Thể"),
        (2, "Tiên / Thần Giai", "Thái Thanh Đạo Khu"),
        (2, "Tiên / Thần Giai", "Luân Hồi Ấn Ký Thể"),
        (2, "Tiên / Thần Giai", "Vạn Pháp Bất Xâm Thể"),
        (3, "Cổ Thần Giai", "Thời Không Chi Tử Thể"),
        (3, "Cổ Thần Giai", "Nhân Quả Chi Tuyến Thể"),
        (3, "Cổ Thần Giai", "Hủy Diệt Tạo Hóa Đạo Thể"),
        (4, "Hỗn Độn / Đạo Tận", "Hồng Mông Tử Khí Đạo Thể"),
        (4, "Hỗn Độn / Đạo Tận", "Hỗn Độn Đạo Tận Chi Khu"),
        (5, "Nguyên Thủy Chân Lý", "Vạn Đạo Quy Nguyên Chi Thể"),
    ],
    "Ngự Thú": [
        (1, "Hoàng Giai", "Dã Thú Thân Hòa Thể"),
        (1, "Huyền Giai", "Linh Thú Khế Ước Thể"),
        (1, "Địa Giai", "Vạn Thú Thân Hòa Thể"),
        (1, "Địa Giai", "Bách Điểu Triều Phượng Thể"),
        (1, "Thiên Giai", "Chân Long Huyết Mạch Thể"),
        (1, "Thiên Giai", "Phượng Hoàng Niết Bàn Thể"),
        (2, "Tiên / Thần Giai", "Kỳ Lân Thụy Thú Thể"),
        (2, "Tiên / Thần Giai", "Cửu Vĩ Yêu Hồ Huyết Thể"),
        (2, "Tiên / Thần Giai", "Griffin Bầu Trời Thể"),
        (3, "Cổ Thần Giai", "Thái Cổ Thú Vương Huyết Mạch"),
        (3, "Cổ Thần Giai", "Thao Thiết Thôn Phệ Thể"),
        (3, "Cổ Thần Giai", "Fenrir Sói Tận Thế Thể"),
        (3, "Cổ Thần Giai", "Yggdrasil Thú Linh Thể"),
        (4, "Hỗn Độn / Đạo Tận", "Hỗn Độn Hung Thú Chi Chủ"),
        (4, "Hỗn Độn / Đạo Tận", "Đa Nguyên Vạn Yêu Cộng Chủ"),
        (5, "Nguyên Thủy Chân Lý", "Nguyên Thủy Sinh Linh Chi Tổ"),
    ],
    "Pháp Bảo": [
        (1, "Hoàng Giai", "Luyện Khí Sơ Thông Thể"),
        (1, "Huyền Giai", "Ngự Kiếm Thân Hòa Thể"),
        (1, "Địa Giai", "Thẻ Bài Phong Ấn Thể"),
        (1, "Địa Giai", "Phù Văn Đúc Thân Thể"),
        (1, "Thiên Giai", "Thiên Sinh Kiếm Tâm Thể"),
        (1, "Thiên Giai", "Khí Linh Cộng Hưởng Thể"),
        (2, "Tiên / Thần Giai", "Cửu Thiên Huyền Khí Thể"),
        (2, "Tiên / Thần Giai", "Thần Đỉnh Hộ Chủ Thể"),
        (2, "Tiên / Thần Giai", "Ma Trang Cấy Ghép Cực Hạn"),
        (3, "Cổ Thần Giai", "Cổ Bảo Thức Tỉnh Thể"),
        (3, "Cổ Thần Giai", "Linh Bảo Hóa Hình Chi Khu"),
        (3, "Cổ Thần Giai", "Trận Bàn Vũ Trụ Thể"),
        (4, "Hỗn Độn / Đạo Tận", "Hỗn Độn Chí Bảo Chi Khu"),
        (4, "Hỗn Độn / Đạo Tận", "Vạn Pháp Thần Binh Thể"),
        (4, "Hỗn Độn / Đạo Tận", "Đại Đạo Khí Tông Thể"),
        (5, "Nguyên Thủy Chân Lý", "Nguyên Thủy Chân Lý Thần Khí Thể"),
    ],
}

GROUP_STAT_MAP = {
    "Thể Xác": ("cancot", "armorBonus"),
    "Tâm Linh": ("tamtin", "ngotinh"),
    "Linh Hồn": ("linhhon", "resistSoul"),
    "Đạo": ("ngotinh", "thienphu"),
    "Ngự Thú": ("linhhon", "nhanduyen"),
    "Pháp Bảo": ("linhhon", "tamtin"),
}

TIER_SKILL_POOLS = {
    "Thể Xác": {
        1: [
            "Bá Lực Phá Giáp", "Thiết Cốt Chấn Địa", "Huyết Khí Cuồng Lan", "Long Tượng Cự Lực",
            "Kim Cang Bất Hoại Ấn", "Phá Sơn Trọng Quyền", "Cương Cân Thiết Tủy", "Nộ Huyết Bộc Phát",
        ],
        2: [
            "Cửu Chuyển Kim Thân", "Thái Cổ Cự Linh Biến", "Bất Diệt Huyết Hải", "Tinh Hà Đoán Cốt",
            "Vạn Kiếp Bất Phá Khu", "Trấn Ngục Thần Lực", "Phá Thiên Nhất Kích", "Thần Ma Luyện Thể",
        ],
        3: [
            "Cổ Thần Pháp Tướng", "Khai Thiên Tích Địa Quyền", "Bất Tử Chân Khu", "Nhất Lực Phá Vạn Pháp",
            "Hồng Hoang Thánh Thể Ấn", "Thôn Tinh Nghiền Nguyệt", "Vĩnh Hằng Chiến Huyết", "Thái Sơ Kim Thân",
        ],
    },
    "Tâm Linh": {
        1: [
            "Thanh Tâm Minh Kính", "Linh Đài Vô Trần", "Tĩnh Tâm Phá Huyễn", "Tinh Thần Chấn Nhiếp",
            "Thức Hải Ngưng Sương", "Ảo Ảnh Mê Tâm", "Đọc Tâm Vi Quang", "Ý Niệm Trảm Kích",
        ],
        2: [
            "Vạn Tượng Huyễn Cảnh", "Tâm Linh Phong Bạo", "Phá Vọng Chân Nhãn", "Thần Niệm Khống Tâm",
            "Cửu U Mộng Yểm", "Thiên Nhãn Thông Tâm", "Tâm Hải Cộng Hưởng", "Định Hồn Thần Chuông",
        ],
        3: [
            "Nhất Niệm Hoa Khai", "Tâm Giới Hàng Lâm", "Thái Cổ Huyễn Thế", "Vô Thượng Tâm Ấn",
            "Vạn Linh Quy Phục", "Thức Hải Vô Biên", "Mộng Đạo Luân Hồi", "Chân Tâm Bất Động",
        ],
    },
    "Linh Hồn": {
        1: [
            "Ngưng Hồn Tụ Phách", "U Minh Hồn Hỏa", "Thực Hồn Sơ Trảo", "Dẫn Hồn Quy Nguyên",
            "Hồn Ti Bẫy Rập", "Thanh Hồn Minh Đăng", "Hấp Hồn Hư Ảnh", "Tán Hồn Chú Ấn",
        ],
        2: [
            "Vạn Hồn Phiên Thiên", "Linh Hồn Xé Rách", "U Phủ Hoàng Tuyền Ấn", "Bất Tử Hồn Hạch",
            "Luyện Hồn Dung Lô", "Hồn Phách Phân Thân", "Thẩm Phán Chi Hồn", "Thôn Phệ Nguyên Thần",
        ],
        3: [
            "Nguyên Thần Pháp Tướng", "Luân Hồi Dẫn Độ", "Bất Diệt Chân Linh", "Hồn Hải Thôn Thiên",
            "Thái Cổ Hồn Tổ Ấn", "Vạn Linh Hồn Vực", "Sinh Tử Phán Quyết", "Siêu Thoát Linh Ấn",
        ],
    },
    "Đạo": {
        1: [
            "Ngộ Đạo Sơ Huyền", "Dẫn Khí Hợp Đạo", "Đạo Vận Lưu Chuyển", "Nhất Khí Hóa Linh",
            "Cảm Ứng Thiên Cơ", "Đạo Văn Sơ Khắc", "Quy Nguyên Tụ Đạo", "Thanh Phong Ngộ Ý",
        ],
        2: [
            "Thiên Đạo Cộng Hưởng", "Ngũ Hành Luân Chuyển", "Âm Dương Nghịch Đảo", "Vạn Pháp Qui Nhất",
            "Đạo Vực Sơ Thành", "Tiên Thiên Đạo Ấn", "Diễn Hóa Chu Thiên", "Phá Pháp Quy Chân",
        ],
        3: [
            "Ngôn Xuất Pháp Tùy", "Cổ Đạo Pháp Tướng", "Tam Thiên Đạo Tắc", "Vô Cực Diễn Đạo",
            "Thái Sơ Đạo Vận", "Trảm Nhân Quả Kiếm", "Thiên Địa Đồng Thọ", "Vạn Đạo Triều Tông",
        ],
    },
    "Ngự Thú": {
        1: [
            "Khế Ước Linh Ấn", "Ngự Thú Cộng Sinh", "Thú Hồn Phụ Thể", "Hoán Linh Sơ Triệu",
            "Thú Vương Uy Áp", "Huyết Mạch Kích Phát", "Dẫn Thú Quy Tâm", "Linh Thú Trợ Chiến",
        ],
        2: [
            "Vạn Thú Triều Bái", "Thần Thú Huyết Biến", "Hợp Thể Chiến Thú", "Ngự Linh Thần Vực",
            "Hoán Thú Thành Quân", "Cổ Thú Tái Hiện", "Thú Hồn Dung Hợp", "Bá Chủ Sơn Hải",
        ],
        3: [
            "Thái Cổ Thú Hoàng Ấn", "Vạn Linh Triệu Hoán", "Chân Long Phượng Vũ", "Bất Diệt Thú Tổ",
            "Sơn Hải Thú Giới", "Thú Đạo Chí Tôn", "Hồng Hoang Cự Thú Tướng", "Ngự Tận Vạn Linh",
        ],
    },
    "Pháp Bảo": {
        1: [
            "Ngự Khí Sơ Thông", "Tế Luyện Bản Mệnh", "Khí Hồn Cộng Hưởng", "Bách Binh Tề Minh",
            "Thức Khí Phá Giáp", "Linh Bảo Tụ Quang", "Dẫn Khí Nhập Bảo", "Hộ Chủ Linh Thuẫn",
        ],
        2: [
            "Vạn Bảo Quy Tông", "Bản Mệnh Thần Binh", "Khí Linh Hóa Hình", "Phá Giới Thần Kích",
            "Luyện Khí Thành Đạo", "Cửu Bảo Trấn Thiên", "Thần Binh Phệ Linh", "Vô Song Khí Vực",
        ],
        3: [
            "Tiên Thiên Chí Bảo Ấn", "Vạn Khí Triều Hoàng", "Thái Cổ Thần Lô", "Pháp Bảo Bất Diệt",
            "Bản Mệnh Diễn Thiên", "Đoạt Bảo Thần Thông", "Trấn Thế Đế Binh", "Chí Bảo Quy Nguyên",
        ],
    },
}

physiques = []
idx = 1
for group, entries in PHYSIQUE_ROOTS.items():
    group_items = []
    primary_stat, secondary_stat = GROUP_STAT_MAP[group]
    for i, (tier, grade, name) in enumerate(entries):
        speed_bonus = 10 + tier * 15 + (i % 3) * 4
        ent_list = ORIGIN_ENTITIES[group]
        ent = ent_list[i % len(ent_list)]
        p_val = tier * 2 + (i % 3) + 1
        s_val = tier * 2 + 1
        bonus = {primary_stat: p_val}
        if secondary_stat == "armorBonus":
            bonus["armorBonus"] = tier * 8 + (i % 3) * 3
        elif secondary_stat == "resistSoul":
            bonus["resistSoul"] = tier * 8 + 5
        else:
            bonus[secondary_stat] = s_val

        base_short = name.replace(" Thể", "")
        bonus_text = ", ".join(f"+{v} {k}" for k, v in bonus.items())
        pool = TIER_SKILL_POOLS[group]
        t1_name = pool[1][i % len(pool[1])]
        t2_name = pool[2][(i + 3) % len(pool[2])]
        t3_name = pool[3][(i + 5) % len(pool[3])]
        tier_abilities = [
            {
                "unlockTier": 1,
                "name": f"{t1_name} ({base_short})",
                "category": "Thần Thông Thể Chất",
                "grade": grade if tier == 1 else "Huyền Giai",
                "tier": 1,
                "level": 1,
                "mastery": 25,
                "isDao": False,
                "daoIntent": "Sơ Khởi Bản Mệnh",
                "effect": f"Thần thông Tầng 1 thức tỉnh từ [{name}] ({bonus_text}).",
            },
            {
                "unlockTier": 2,
                "name": f"{t2_name} ({base_short})",
                "category": "Thần Thông Thể Chất",
                "grade": "Địa Giai",
                "tier": 2,
                "level": 1,
                "mastery": 25,
                "isDao": False,
                "daoIntent": f"Huyền Ấn {group}",
                "effect": f"Thần thông Tầng 2 của [{name}], cộng hưởng linh lực & pháp tắc Tân Thần Giới.",
            },
            {
                "unlockTier": 3,
                "name": f"{t3_name} ({base_short})",
                "category": "Thần Thông Thể Chất",
                "grade": "Thiên Giai",
                "tier": 3,
                "level": 1,
                "mastery": 25,
                "isDao": False,
                "daoIntent": f"Cổ Thần {group}",
                "effect": f"Thần thông Tầng 3 cực cảnh của [{name}], chạm ngưỡng bản nguyên Cổ Thần Giới.",
            },
            {
                "unlockTier": 4,
                "name": f"Đại Đạo T4: {group} Chi Đạo ({base_short})",
                "category": "Đại Đạo Thể Chất",
                "grade": "Hỗn Độn Giai",
                "tier": 4,
                "level": 1,
                "mastery": 35,
                "isDao": True,
                "daoIntent": f"Thần Thông Hóa Đạo • {group}",
                "effect": f"Tầng 4 Thần Thông Hóa Đạo! Toàn bộ thần thông của [{name}] hợp nhất thành Đại Đạo, thao túng quy tắc Hỗn Độn.",
            },
            {
                "unlockTier": 5,
                "name": f"Chân Đạo T5: {ent['name']} Chi Nguyên Đạo",
                "category": "Nguyên Thủy Đại Đạo",
                "grade": "Nguyên Thủy Giai",
                "tier": 5,
                "level": 1,
                "mastery": 50,
                "isDao": True,
                "daoIntent": "Vạn Đạo Quy Nguyên",
                "effect": f"Tầng 5 Nguyên Thủy Chân Đạo! Đạo của [{name}] đạt tới Chân Lý tuyệt đối, có thể siêu thoát hoặc thay thế Tồn Tại gốc.",
            },
        ]
        divine_skill_name = tier_abilities[0]["name"]
        item = {
            "id": f"phy_{idx}",
            "name": name,
            "group": group,
            "tier": tier,
            "grade": grade,
            "speedBonus": speed_bonus,
            "bonus": bonus,
            "unlocksDivineSkill": tier_abilities[0],
            "tierAbilities": tier_abilities,
            "originEntity": ent["name"],
            "nextPhysiqueId": None,
            "nextPhysiqueName": None,
            "desc": f"Thể chất hệ {group} (Tầng {tier} • {grade}), +{speed_bonus}% tốc độ tu luyện, {bonus_text}. Mỗi tầng mở 1 Thần Thông (Tầng 4+ Hóa Đạo). Diễn hóa từ: {ent['name']}.",
        }
        group_items.append(item)
        physiques.append(item)
        idx += 1
    for j in range(len(group_items) - 1):
        group_items[j]["nextPhysiqueId"] = group_items[j + 1]["id"]
        group_items[j]["nextPhysiqueName"] = group_items[j + 1]["name"]
        group_items[j]["desc"] += f" [Max tiến hóa lên: {group_items[j + 1]['name']}]"

assert len(physiques) == 100

TIER_SPECS = [
    (
        1, "Hoàng Giai", 30,
        ["Dẫn Khí", "Trường Xuân", "Thiết Bố", "Thanh Phong", "Hỏa Diễm", "Thổ Độn", "Ngưng Thần", "Linh Mộc", "Băng Tâm", "Hàn Thiết"],
        ["Cơ Bản Quyết", "Nhập Môn Công", "Dưỡng Sinh Kinh", "Sơ Cấp Pháp"],
        ["Quyền", "Kiếm Quyết", "Chưởng", "Cầu Thuật"],
        ["Thuật", "Tiểu Quyết", "Ấn", "Phù"],
    ),
    (
        1, "Huyền Giai", 30,
        ["Thất Tinh", "Huyết Sát", "Thanh Mộc", "Lôi Đình", "U Ảnh", "Cuồng Phong", "Cửu Âm", "Liệt Dương", "Phá Giáp", "Truy Phong"],
        ["Luyện Khí Quyết", "Trúc Cơ Kinh", "Luyện Thể Pháp", "Tụ Khí Lục"],
        ["Trảm", "Liên Kích", "Băng Ấn", "Đao Pháp"],
        ["Bí Thuật", "Phù Chú", "Trận Ấn", "Độn Thuật"],
    ),
    (
        1, "Địa Giai", 25,
        ["Hỗn Nguyên", "Cửu Chuyển", "Thái Âm", "Tử Điện", "Lượng Tử", "Vạn Kiếm", "Bất Hoại", "Hư Không", "Minh Tưởng", "Ngự Thú"],
        ["Kim Đan Quyết", "Nguyên Anh Kinh", "Luyện Hồn Lục", "Cường Hóa Giao Thức"],
        ["Phá Diệt", "Thương Pháp", "Đại Trận", "Lượng Tử Pháo"],
        ["Nghi Thức", "Cấm Chú", "Thẻ Bài Pháp", "Chiêm Tinh Thuật"],
    ),
    (
        1, "Thiên Giai", 25,
        ["Vô Tự", "Bắc Minh", "Ngũ Hành", "Đại Nhật", "Cửu U", "Thiên Địa", "Tinh Thần", "Súc Địa", "Long Tượng", "Phượng Hoàng"],
        ["Hóa Thần Đạo Kinh", "Đại Thừa Tâm Pháp", "Thôn Phệ Chân Kinh", "Thiên Thư"],
        ["Thần Chưởng", "Tuyệt Sát Trảm", "Thiên Phạt Kích", "Nhiếp Hồn Ấn"],
        ["Đại Pháp", "Thiên Cơ Thuật", "Độ Kiếp Trận", "Phong Thần Thuật"],
    ),
    (
        2, "Tiên / Thần Giai", 30,
        ["Thái Thanh", "Lăng Tiêu", "Olympus Thánh Quang", "Asgard Phù Văn", "Minh Đế", "Bất Hủ Kim Tiên", "Cửu Thiên", "Thiên Quy", "Vĩnh Sinh", "Chủ Thần"],
        ["Tiên Đế Kinh", "Thần Vương Điển", "Nguyên Thần Chân Kinh", "Thánh Quang Lục"],
        ["Lĩnh Vực", "Thần Phạt Thương", "Pháp Thiên Tượng Địa", "Tam Muội Chân Hỏa"],
        ["Tiên Thuật", "Thần Ngữ Nghi Thức", "Lục Đạo Phù", "Tinh Hệ Trận"],
    ),
    (
        3, "Cổ Thần Giai", 25,
        ["Bàn Cổ", "Thập Nhị Tổ Vu", "Chaos Hỗn Mang", "Yggdrasil", "Ngoại Thần", "Cao Duy 11D", "Thái Cổ", "Thời Gian Sa Lậu", "Nhân Quả", "Thôn Phệ Tinh Không"],
        ["Khai Thiên Kinh", "Tổ Thần Huyết Mạch Pháp", "Cao Duy Tâm Pháp", "Thời Không Lục"],
        ["Giáng Duy Đả Kích", "Thời Gian Ngưng Đọng", "Nhân Quả Mạt Sát", "Tận Thế Viêm Kiếm"],
        ["Cổ Thần Cấm Thuật", "Bẻ Cong Chiều Không Gian", "Nghịch Chuyển Quang Âm", "Hằng Số Giao Thức"],
    ),
    (
        4, "Hỗn Độn / Đạo Tận", 20,
        ["Hỗn Độn Thanh Liên", "Tam Thiên Ma Thần", "Hồng Mông Tử Khí", "Akasha", "Không Gian Đạo Tận", "Thời Gian Đạo Tận", "Hủy Diệt Đạo Tận", "Sinh Mệnh Đạo Tận"],
        ["Đại Đạo Chân Kinh", "Đạo Tận Tâm Pháp", "Đa Nguyên Bất Diệt Công", "Hồng Mông Đạo Điển"],
        ["Xóa Sổ Tọa Độ Vũ Trụ", "Hỗn Độn Khai Tích Ấn", "Vĩnh Hằng Tĩnh Chỉ", "Quy Hư Nhất Kích"],
        ["Akasha Bút Xóa", "Đa Nguyên Xuyên Thoa Thuật", "Đại Đạo Định Luật", "Tái Tạo Vũ Trụ Thuật"],
    ),
    (
        5, "Nguyên Thủy Chân Lý", 15,
        ["Thái Sơ", "Bản Nguyên", "Siêu Thoát", "Vạn Đạo Quy Nguyên", "Đạo Nguyên Tối Hậu", "Khởi Nguyên Tồn Tại"],
        ["Chân Lý Thư", "Nguyên Thủy Quy Tắc Kinh", "Tối Hậu Đạo Chương"],
        ["Vạn Pháp Quy Tịch", "Ngôn Xuất Pháp Tùy", "Phá Toái Vòng Lặp Nhân Quả", "Đạo Nguyên Sáng Thế Kích"],
        ["Chân Lý Định Nghĩa Thuật", "Sửa Đổi Mã Nguồn Thực Tại", "Siêu Thoát Hệ Thống Thuật"],
    ),
]

def build_200(kind):
    items = []
    idx_counter = 1
    for tier, grade, count, prefs, cp_sufs, cf_sufs, th_sufs in TIER_SPECS:
        sufs = cp_sufs if kind == "cp" else cf_sufs if kind == "cf" else th_sufs
        tier_phys = [p for p in physiques if p["tier"] == tier] or physiques
        for i in range(count):
            pre = prefs[i % len(prefs)]
            suf = sufs[(i // len(prefs)) % len(sufs)]
            variant_num = (i // (len(prefs) * len(sufs))) + 1
            name = f"{pre} {suf}" if variant_num == 1 else f"{pre} {suf} (Tầng {variant_num})"
            phy = tier_phys[i % len(tier_phys)]
            if kind == "cp":
                items.append({
                    "id": f"cp_{idx_counter}",
                    "name": name,
                    "tier": tier,
                    "grade": grade,
                    "group": phy["group"],
                    "forgesPhysique": phy["name"],
                    "originEntity": phy["originEntity"],
                    "effect": f"+{12 + tier * 10}% tốc độ tu luyện. Luyện tới Viên Mãn có thể rèn thành [{phy['name']}] (mảnh diễn hóa của {phy['originEntity']}).",
                })
            elif kind == "cf":
                items.append({
                    "id": f"cf_{idx_counter}",
                    "name": name,
                    "tier": tier,
                    "grade": grade,
                    "compatiblePhysique": phy["name"],
                    "originEntity": phy["originEntity"],
                    "daoIntent": f"Ý Cảnh {pre}" if (tier >= 2 or grade == "Thiên Giai") else "Chưa ngộ",
                    "effect": f"Chiến pháp {grade} (Tầng {tier}), hợp với [{phy['name']}] (+25% uy lực).",
                })
            else:
                items.append({
                    "id": f"th_{idx_counter}",
                    "name": name,
                    "tier": tier,
                    "grade": grade,
                    "originEntity": phy["originEntity"],
                    "effect": f"Thuật phẩm {grade} (Tầng {tier}), diễn hóa từ {phy['originEntity']}.",
                })
            idx_counter += 1
    return items

cong_phap = build_200("cp")
chien_phap = build_200("cf")
thuat_list = build_200("th")
assert len(cong_phap) == 200 and len(chien_phap) == 200 and len(thuat_list) == 200

CREATURE_GROUPS = {
    "Thần Thú": [
        (1, "Tỳ Hưu", "Phương Đông"), (1, "Pegasus (Thiên Mã)", "Phương Tây"), (1, "Griffin (Điểu Sư)", "Phương Tây"),
        (1, "Unicorn (Độc Giác Thú)", "Phương Tây"), (1, "Linh Quy Huyền Giáp", "Phương Đông"), (1, "Hạc Tiên Thanh Vân", "Phương Đông"),
        (2, "Thanh Long (Tứ Tượng)", "Phương Đông"), (2, "Bạch Hổ (Tứ Tượng)", "Phương Đông"), (2, "Chu Tước (Tứ Tượng)", "Phương Đông"),
        (2, "Huyền Vũ (Tứ Tượng)", "Phương Đông"), (2, "Kỳ Lân Thụy Thú", "Phương Đông"), (2, "Phoenix (Phượng Hoàng)", "Phương Tây"),
        (2, "Thần Điểu Simurgh", "Ba Tư / Tây"), (2, "Cửu Sắc Lộc", "Phương Đông"), (2, "Kim Sí Đại Bằng", "Phương Đông"),
        (3, "Bạch Trạch (Thông Hiểu Vạn Vật)", "Phương Đông"), (3, "Côn Bằng Thái Cổ", "Phương Đông"), (3, "Chúc Long (Thần Thời Gian)", "Phương Đông"),
        (4, "Hỗn Độn Thần Quy", "Đa Nguyên"), (5, "Nguyên Thủy Thánh Thú", "Chân Lý"),
    ],
    "Hung Thú": [
        (1, "Huyết Lang Bạo Liệt", "Phương Đông"), (1, "Minotaur (Ngưu Đầu Nhân)", "Phương Tây"), (1, "Manticore (Sư Tử Đuôi Bò Cạp)", "Phương Tây"),
        (1, "Thiết Giáp Cự Tượng", "Phương Đông"), (1, "Huyền Băng Cự Hùng", "Phương Đông"), (1, "Basilisk (Xà Vương Hóa Đá)", "Phương Tây"),
        (2, "Hydra (Rắn Chín Đầu)", "Phương Tây"), (2, "Chimera (Quái Thú Tam Hợp)", "Phương Tây"), (2, "Kraken (Thủy Quái Biển Sâu)", "Phương Tây"),
        (2, "Cerberus (Chó Ba Đầu Minh Giới)", "Phương Tây"), (2, "Đào Ngột (Tứ Hung)", "Phương Đông"), (2, "Tam Túc Kim Ô", "Phương Đông"),
        (3, "Thao Thiết (Tứ Hung - Thôn Phệ)", "Phương Đông"), (3, "Cùng Kỳ (Tứ Hung)", "Phương Đông"), (3, "Fenrir (Sói Tận Thế)", "Phương Tây"),
        (3, "Jörmungandr (Rắn Quấn Cửu Giới)", "Phương Tây"), (3, "Nidhogg (Rồng Gặm Rễ Thế Giới)", "Phương Tây"), (3, "Leviathan", "Phương Tây"),
        (4, "Hỗn Độn Hung Thú (Tứ Hung)", "Đa Nguyên"), (5, "Hư Không Phá Diệt Cự Thú", "Chân Lý"),
    ],
    "Ma Thú": [
        (1, "U Ảnh Báo", "Phương Đông"), (1, "Huyết Bức Hút Máu", "Phương Tây"), (1, "Gargoyle (Quỷ Đá)", "Phương Tây"),
        (1, "Thực Thi Quỷ Lang", "Phương Đông"), (1, "Độc Giác Ma Ngưu", "Phương Đông"), (1, "Mị Ảnh Miêu Yêu", "Phương Đông"),
        (2, "Cửu Vĩ Yêu Hồ", "Phương Đông"), (2, "Địa Ngục Ma Khuyển", "Phương Tây"), (2, "Ám Dạ Ma Long", "Phương Tây"),
        (2, "Mộng Yểm Ma Mã", "Phương Tây"), (2, "Thâm Uyên Ma Nhãn", "Cosmic / Tây"), (2, "Huyết Dực Ác Ma", "Phương Tây"),
        (3, "Balrog (Viêm Ma Vực Thẳm)", "Phương Tây"), (3, "Shoggoth (Biến Hình Vũ Trụ)", "Cosmic"), (3, "Ngoại Thần Ấu Trùng", "Cosmic"),
        (3, "Thái Cổ Ma Viên", "Phương Đông"), (3, "Cửu U Ma Phượng", "Phương Đông"), (3, "Tinh Hệ Thực Hồn Trùng", "Khoa Huyễn"),
        (4, "Hư Vô Ma Long (Void Dragon)", "Đa Nguyên"), (5, "Nguyên Thủy Ác Niệm Hóa Thân", "Chân Lý"),
    ],
    "Thực Vật Huyền Bí": [
        (1, "Quỷ Diện Đằng", "Phương Đông"), (1, "Thực Nhân Ma Hoa", "Phương Tây"), (1, "Cửu Diệp Kiếm Thảo", "Phương Đông"),
        (1, "Huyết Lan Thảo", "Phương Đông"), (1, "Mandrake (Nhân Sâm Hét)", "Phương Tây"), (1, "Tinh Linh Dây Leo", "Phương Tây"),
        (2, "Bỉ Ngạn Huyết Liên", "Phương Đông"), (2, "Mạn Đà La Hồn Hoa", "Đông / Tây"), (2, "Thiên Niên Băng Tâm Thảo", "Phương Đông"),
        (2, "Thụ Nhân Cổ Đạo (Treant)", "Phương Tây"), (2, "Lôi Kích Mộc Tinh", "Phương Đông"), (2, "Thánh Quang Sinh Mệnh Hoa", "Phương Tây"),
        (3, "Ngộ Đạo Cổ Thụ", "Phương Đông"), (3, "Bồ Đề Thần Thụ", "Phương Đông"), (3, "Nhân Sâm Quả Thụ", "Phương Đông"),
        (3, "Yggdrasil (Cây Thế Giới Cửu Giới)", "Phương Tây"), (3, "Tinh Không Thực Hồn Đằng", "Khoa Huyễn"), (3, "Bất Tử Thần Thụ", "Phương Đông"),
        (4, "Hỗn Độn Thanh Liên", "Đa Nguyên"), (5, "Vạn Đạo Khởi Nguyên Thụ", "Chân Lý"),
    ],
    "Bất Tử Sinh Vật": [
        (1, "Khô Lâu Binh Sĩ", "Phương Tây"), (1, "Cương Thi Đồng Giáp", "Phương Đông"), (1, "Oán Linh Du Hồn", "Phương Đông"),
        (1, "Bóng Ma Banshee", "Phương Tây"), (1, "Xác Ướp Cổ Ai Cập", "Ai Cập"), (1, "Thực Hồn Quỷ Tốt", "Phương Đông"),
        (2, "Cương Thi Vương Hạn Bạt", "Phương Đông"), (2, "Lich Vương (Tử Linh Pháp Sư)", "Phương Tây"), (2, "Vampire Công Tước", "Phương Tây"),
        (2, "Khô Lâu Kỵ Sĩ Tử Vong", "Phương Tây"), (2, "Vong Xuyên Quỷ Soái", "Phương Đông"), (2, "Valhalla Anh Linh Chiến Sĩ", "Phương Tây"),
        (3, "Vampire Thủy Tổ", "Phương Tây"), (3, "Minh Giới Thẩm Phán Giả", "Đông / Tây"), (3, "Bất Tử Điểu Tro Tàn", "Phương Tây"),
        (3, "Ý Thức Lượng Tử Bất Tử", "Khoa Huyễn"), (3, "Cổ Thần Tàn Hồn Bất Diệt", "Cosmic"), (3, "Hoàng Tuyền Quỷ Đế", "Phương Đông"),
        (4, "Hỗn Độn Bất Tử Nguyên Linh", "Đa Nguyên"), (5, "Vĩnh Hằng Bất Diệt Chân Linh", "Chân Lý"),
    ],
    "Long Tộc & Tinh Linh": [
        (1, "Giao Long Biển Đông", "Phương Đông"), (1, "Hỏa Long Wyvern", "Phương Tây"), (1, "Thủy Tinh Linh (Undine)", "Phương Tây"),
        (1, "Phong Tinh Linh (Sylph)", "Phương Tây"), (1, "Hồ Ly Tinh Bạch Mao", "Phương Đông"), (1, "Tengu (Thiên Cẩu)", "Nhật Bản"),
        (2, "Ứng Long (Cổ Long Có Cánh)", "Phương Đông"), (2, "Naga Xà Thần", "Ấn Độ"), (2, "Garuda (Kim Xí Điểu)", "Ấn Độ"),
        (2, "Quetzalcoatl (Rắn Lông Vũ)", "Maya / Aztec"), (2, "Fafnir (Ác Long Bắc Âu)", "Phương Tây"), (2, "Sleipnir (Tuấn Mã Tám Chân)", "Bắc Âu"),
        (3, "Yamata no Orochi (Bát Kỳ Đại Xà)", "Nhật Bản"), (3, "Bahamut (Bạch Kim Long Vương)", "Phương Tây"), (3, "Tiamat (Long Mẫu Hỗn Mang)", "Lưỡng Hà"),
        (3, "Apep / Apophis (Rắn Hủy Diệt)", "Ai Cập"), (3, "Ouroboros (Rắn Tự Nuốt Đuôi)", "Huyền Học"), (3, "Thái Cổ Tổ Long", "Phương Đông"),
        (4, "Hỗn Độn Thời Không Long", "Đa Nguyên"), (5, "Nguyên Thủy Vạn Long Chi Tổ", "Chân Lý"),
    ],
    "Thiên Sứ, Ác Ma & Cơ Giới": [
        (1, "Golem Đất Sét", "Phương Tây"), (1, "Cơ Giáp Lang Tự Hành", "Khoa Huyễn"), (1, "Tiểu Quỷ Imp", "Phương Tây"),
        (1, "Dạ Xoa Tu La", "Phương Đông"), (1, "Cương Thiết Khôi Lỗi", "Phương Đông"), (1, "Drone Lượng Tử", "Khoa Huyễn"),
        (2, "Seraphim (Thiên Sứ Sáu Cánh)", "Phương Tây"), (2, "Thiên Binh Thiên Tướng", "Phương Đông"), (2, "Asura (A Tu La Chiến Thần)", "Ấn Độ / Đông"),
        (2, "Valkyrie (Nữ Thần Chiến Tranh)", "Bắc Âu"), (2, "Succubus / Incubus Thượng Đẳng", "Phương Tây"), (2, "Siêu Chiến Giáp Tinh Hệ", "Khoa Huyễn"),
        (3, "Lucifer (Sa Đọa Thiên Sứ)", "Phương Tây"), (3, "Behemoth (Cự Thú Đất Liền)", "Do Thái / Tây"), (3, "Ammit (Quái Thú Nuốt Tim)", "Ai Cập"),
        (3, "Nyarlathotep Hóa Thân", "Cosmic"), (3, "Thiên Cơ Khôi Lỗi Chí Tôn", "Phương Đông"), (3, "Thực Thể AI Cấp Thiên Hà", "Khoa Huyễn"),
        (4, "Hỗn Độn Cơ Giới Thần Linh", "Đa Nguyên"), (5, "Chân Lý Khởi Nguyên Thủ Hộ Giả", "Chân Lý"),
    ],
    "Dị Giới & Thủy Quái": [
        (1, "Nhân Ngư Ca Hát (Siren)", "Phương Tây"), (1, "Thủy Quái Kappa", "Nhật Bản"), (1, "Hải Xà Độc", "Phương Đông"),
        (1, "Wendigo (Quái Vật Băng Giá)", "Bắc Mỹ"), (1, "Bạch Cốt Tinh", "Phương Đông"), (1, "Lửa Ma Trơi Tinh Linh", "Đông / Tây"),
        (2, "Scylla (Quái Vật Eo Biển)", "Hy Lạp"), (2, "Charybdis (Xoáy Nước Khổng Lồ)", "Hy Lạp"), (2, "Côn Luân Thần Thú Lục Ngô", "Phương Đông"),
        (2, "Khai Minh Thú (Chín Đầu)", "Phương Đông"), (2, "Bán Nhân Mã Chiron", "Hy Lạp"), (2, "Thiên Hầu Lục Nhĩ", "Phương Đông"),
        (3, "Cthulhu (Kẻ Ngủ Dưới R'lyeh)", "Cosmic"), (3, "Bắc Minh Côn Ngư", "Phương Đông"), (3, "Thái Cổ Tinh Không Cự Kình", "Khoa Huyễn"),
        (3, "Vô Diện Thần Ma", "Huyền Huyễn"), (3, "Thần Thú Đế Giang", "Phương Đông"), (3, "Thú Tổ Hỗn Mang", "Phương Đông"),
        (4, "Đa Nguyên Hải Thần Long", "Đa Nguyên"), (5, "Bản Nguyên Hư Hải Chi Chủ", "Chân Lý"),
    ],
    "Bán Thần & Thần Thoại Cổ": [
        (1, "Hậu Duệ Long Tộc", "Đông / Tây"), (1, "Chiến Binh Spartacus Linh Hồn", "Phương Tây"), (1, "Kiếm Linh Vô Chủ", "Phương Đông"),
        (1, "Ám Ảnh Sát Thủ Hư Không", "Huyền Huyễn"), (1, "Phù Văn Thạch Tượng", "Bắc Âu"), (1, "Tạo Vật Giả Kim Homunculus", "Phương Tây"),
        (2, "Heracles (Bán Thần Sức Mạnh)", "Hy Lạp"), (2, "Achilles (Bán Thần Bất Hoại)", "Hy Lạp"), (2, "Gilgamesh (Anh Hùng Cổ Đại)", "Lưỡng Hà"),
        (2, "Na Tra (Tam Đầu Lục Tý)", "Phương Đông"), (2, "Dương Tiễn (Nhị Lang Chân Quân)", "Phương Đông"), (2, "Tôn Ngộ Không (Tề Thiên)", "Phương Đông"),
        (3, "Thần Nông Hóa Thân", "Phương Đông"), (3, "Kronos (Titan Thời Gian)", "Hy Lạp"), (3, "Nyx (Nữ Thần Màn Đêm)", "Hy Lạp"),
        (3, "Surtur (Cự Nhân Lửa Tận Thế)", "Bắc Âu"), (3, "Ymir (Băng Cự Nhân Nguyên Thủy)", "Bắc Âu"), (3, "Tiamat Nguyên Thủy", "Lưỡng Hà"),
        (4, "Tam Thiên Hỗn Độn Ma Thần", "Đa Nguyên"), (5, "Tồn Tại Tối Hậu Vô Danh", "Chân Lý"),
    ],
    "Linh Vật & Dị Chủng": [
        (1, "Kim Tàm Cổ Độc", "Phương Đông"), (1, "Huyết Văn Độc Phong", "Phương Đông"), (1, "Thạch Sùng Biến Sắc Lượng Tử", "Khoa Huyễn"),
        (1, "Chuột Tầm Bảo", "Phương Đông"), (1, "Cú Mèo Tri Thức", "Phương Tây"), (1, "Rùa Đá Ngàn Năm", "Phương Đông"),
        (2, "Thất Thải Thôn Thiên Mãng", "Phương Đông"), (2, "Hư Không Bướm (Butterfly)", "Đông / Tây"), (2, "Bọ Hung Mặt Trời Khepri", "Ai Cập"),
        (2, "Phệ Kim Trùng Vương", "Phương Đông"), (2, "Lôi Ưng Vương", "Phương Đông"), (2, "Băng Phượng Sơ Sinh", "Phương Đông"),
        (3, "Thái Cổ Phệ Thiên Trùng", "Phương Đông"), (3, "Thời Gian Điệp (Bướm Thời Gian)", "Cao Duy"), (3, "Hư Không Tằm", "Cao Duy"),
        (3, "Tinh Thần Cự Giải", "Khoa Huyễn"), (3, "Nguyên Thần Chi Điệp", "Huyền Huyễn"), (3, "Mộng Cảnh Cự Kình", "Cosmic"),
        (4, "Nhân Quả Chi Trùng", "Đa Nguyên"), (5, "Khởi Nguyên Chi Điệp", "Chân Lý"),
    ],
}

creatures = []
c_idx = 1
for category, entries in CREATURE_GROUPS.items():
    for tier, name, culture in entries:
        creatures.append({
            "id": f"cr_{c_idx}",
            "name": name,
            "category": category,
            "culture": culture,
            "tier": tier,
            "desc": f"[{category} • {culture}] Sinh vật Tầng {tier}, có thể gặp làm Boss, Thủ hộ di tích hoặc thu phục làm Ngự Thú.",
        })
        c_idx += 1
assert len(creatures) == 200, f"Expected 200 creatures, got {len(creatures)}"

js_content = (
    "// Auto-generated Lore Catalog: 100 Physiques, 200 Cong Phap, 200 Chien Phap, 200 Thuat, 100 Mythic Creatures\n"
    f"export const ORIGIN_ENTITIES = {json.dumps(ORIGIN_ENTITIES, ensure_ascii=False)};\n"
    f"export const CATALOG_PHYSIQUES = {json.dumps(physiques, ensure_ascii=False)};\n"
    f"export const CATALOG_CONG_PHAP = {json.dumps(cong_phap, ensure_ascii=False)};\n"
    f"export const CATALOG_CHIEN_PHAP = {json.dumps(chien_phap, ensure_ascii=False)};\n"
    f"export const CATALOG_THUAT = {json.dumps(thuat_list, ensure_ascii=False)};\n"
    f"export const MYTHIC_CREATURES = {json.dumps(creatures, ensure_ascii=False)};\n"
)
OUT_JS.write_text(js_content, encoding="utf-8")

md = ["# Danh Sách Đã Chuẩn Hóa: 100 Thể Chất, 200 Công Pháp, 200 Chiến Pháp, 200 Thuật & 100 Sinh Vật Huyền Bí\n"]
md.append("## 0. Bí Mật Tối Cao: 12 Tồn Tại Khởi Nguyên (Diễn Hóa Từ Trên Xuống Dưới)\n*Mọi công pháp, chiến pháp, thuật và thể chất ở tầng thấp đều là mảnh phân hóa suy giảm từ một Tồn Tại ở tầng cao hơn. Càng tu lên cao, người chơi càng tiến gần tới việc trở thành một phần của Tồn Tại đó — hoặc phải tự sáng tạo/siêu thoát để phản sát.*\n")
for grp, ents in ORIGIN_ENTITIES.items():
    for e in ents:
        md.append(f"- **[{grp}] {e['name']}:** {e['secret']}")
md.append("\n## 1. 100 Thể Chất, Bonus Chỉ Số & Thần Thông 5 Tầng (Tầng 4+ Hóa Đạo)\n| STT | Tên Thể Chất | Nhóm | Tầng / Phẩm | Bonus (Tốc Độ + Chỉ Số) | Thần Thông T1–T3 & Đạo T4–T5 | Tiến Hóa Tiếp | Tồn Tại Gốc |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |")
for i, p in enumerate(physiques, 1):
    b_str = f"+{p['speedBonus']}% tốc độ, " + ", ".join(f"+{v} {k}" for k, v in p["bonus"].items())
    t_str = "<br/>".join(f"T{a['unlockTier']}: {a['name']}" for a in p["tierAbilities"])
    md.append(f"| {i} | **{p['name']}** | {p['group']} | Tầng {p['tier']} ({p['grade']}) | {b_str} | {t_str} | {p['nextPhysiqueName'] or '*(Đỉnh Cao Nhóm)*'} | {p['originEntity']} |")

md.append("\n## 2. 200 Sinh Vật Huyền Bí (Thần Thú • Hung Thú • Ma Thú • Thực Vật • Bất Tử • Long Tộc • Bán Thần...)\n| STT | Tên Sinh Vật | Phân Loại | Văn Hóa | Tầng |\n| :--- | :--- | :--- | :--- | :--- |")
for i, c in enumerate(creatures, 1):
    md.append(f"| {i} | **{c['name']}** | {c['category']} | {c['culture']} | Tầng {c['tier']} |")

md.append("\n## 3. 200 Công Pháp (Rèn Thể Chất)\n| STT | Tên Công Pháp | Tầng / Phẩm | Rèn Thành Thể Chất |\n| :--- | :--- | :--- | :--- |")
for i, x in enumerate(cong_phap, 1):
    md.append(f"| {i} | **{x['name']}** | Tầng {x['tier']} ({x['grade']}) | {x['forgesPhysique']} |")

md.append("\n## 4. 200 Chiến Pháp\n| STT | Tên Chiến Pháp | Tầng / Phẩm | Tương Thích Thể Chất | Đạo Ý Cảnh |\n| :--- | :--- | :--- | :--- | :--- |")
for i, x in enumerate(chien_phap, 1):
    md.append(f"| {i} | **{x['name']}** | Tầng {x['tier']} ({x['grade']}) | {x['compatiblePhysique']} | {x['daoIntent']} |")

md.append("\n## 5. 200 Thuật\n| STT | Tên Thuật | Tầng / Phẩm |\n| :--- | :--- | :--- |")
for i, x in enumerate(thuat_list, 1):
    md.append(f"| {i} | **{x['name']}** | Tầng {x['tier']} ({x['grade']}) |")

OUT_MD.write_text("\n".join(md), encoding="utf-8")
print(f"OK: {len(physiques)} physiques, {len(cong_phap)} cp, {len(chien_phap)} cf, {len(thuat_list)} th, {len(creatures)} creatures.")
