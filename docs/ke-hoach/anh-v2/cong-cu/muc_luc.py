"""Lap trang muc luc README.md cho thu muc anh-v2 tu cac anh da chup.

Chay (tu thu muc cong-cu):  python muc_luc.py
Doc moi file *.png o thu muc cha (anh-v2), ghi ../README.md.
Mo ta va viec lien quan lay tu bang MO_TA ben duoi: them dong moi khi them anh.
"""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
ANH = pathlib.Path(__file__).resolve().parent.parent
WIDTHS = (1440, 744, 390)

TRANG = [
    ("gt", "Giới thiệu", "#gioi-thieu"),
    ("up", "Ứng phó khẩn cấp", "#ung-pho"),
    ("td", "Thủ đoạn", "#thu-doan"),
    ("ct", "Cuộc thi", "#cuoc-thi"),
    ("hd", "Hỏi – Đáp", "#hoi-dap"),
    ("ctt", "Cuộc thi tháng", "#cuoc-thi-thang"),
]

TIEP = "Dải “Phần tiếp theo” dùng chung cho các trang con"
MO_TA = {
    "gt-01-hero": ("Hero mở màn: thanh thông báo cuộc thi tháng, header, nút 113 nổi, thẻ cuộc thi tháng", "FE-05, FE-02, FE-04, FE-32, BE-10"),
    "gt-02-nam-phan": ("Khối “Năm phần” (dòng thời gian dọc)", "FE-06"),
    "gt-03-cau-chuyen": ("Khối “Câu chuyện” 4 chương (744px và 390px: các chương xếp dọc)", "FE-06, FE-34"),
    "gt-03a-cau-chuyen-chuong-1": ("Câu chuyện, chương 1: một tin nhắn đến (chuyển động bình thường, 1440px)", "FE-06, FE-34"),
    "gt-03b-cau-chuyen-chuong-2": ("Câu chuyện, chương 2: chúng tôi sẽ không bao giờ làm vậy", "FE-06, FE-34"),
    "gt-03c-cau-chuyen-chuong-3": ("Câu chuyện, chương 3: vậy chúng tôi là ai", "FE-06, FE-34"),
    "gt-03d-cau-chuyen-chuong-4": ("Câu chuyện, chương 4: chỉ một địa chỉ duy nhất", "FE-06, FE-34"),
    "gt-04-mot-dia-chi": ("Khối “Một địa chỉ thật giữa muôn vàn bản giả” và câu đố “Trang nào là website thật?”", "FE-07"),
    "gt-04b-mot-dia-chi-diem-1": ("Trạng thái: bấm điểm chú thích số 1", "FE-07"),
    "gt-04c-trang-nao-that-chon-a": ("Trạng thái câu đố: chọn đáp án A (sai)", "FE-07"),
    "gt-04d-trang-nao-that-chon-b": ("Trạng thái câu đố: chọn đáp án B (đúng)", "FE-07"),
    "gt-05-ba-kenh": ("Khối “Ba kênh chính thức” và hộp tố giác", "FE-07, BE-06"),
    "gt-06-dung-lai": ("Phần kết “DỪNG”: ai tự xưng là chúng tôi mà hỏi mã OTP", "FE-07"),
    "gt-07-chan-trang": ("Chân trang (dùng chung mọi trang)", "FE-02, BE-05"),
    "up-01-hero": ("Hero trang Ứng phó (không có thanh thông báo cuộc thi)", "FE-08, FE-09"),
    "up-02-chon-tinh-huong": ("Khối chọn tình huống: 3 ô lớn và 2 lối phụ", "FE-09"),
    "up-03-dau-hieu": ("Khối “Chỉ cần 1 dấu hiệu: dừng lại”, chưa đánh dấu", "FE-10"),
    "up-03b-dau-hieu-da-danh-dau-1": ("Trạng thái: đã đánh dấu 1 dấu hiệu (hộp “Dừng lại ngay”)", "FE-10"),
    "up-03c-dau-hieu-da-danh-dau-2": ("Trạng thái: đã đánh dấu 2 dấu hiệu", "FE-10"),
    "up-04-hai-cau-tu-hoi": ("Khối “Không thấy dấu hiệu nào không có nghĩa là an toàn” (hai câu tự hỏi)", "FE-10"),
    "up-05-so-can-biet": ("Khối “Gọi ai, theo thứ tự nào” (số cần biết)", "FE-10, BE-06"),
    "up-06-tiep-theo": (TIEP, "—"),
    "td-01-hero": ("Hero trang Thủ đoạn có ô tìm kiếm", "FE-08, FE-11, BE-09"),
    "td-02-bon-thu": ("Khối “Họ muốn lấy một trong bốn thứ”", "FE-11"),
    "td-03-cach-ho-lam": ("Khối “Họ thường dùng một hoặc nhiều cách sau” (bảy cách; 1440px thấy 4 thẻ đầu, 744px và 390px xếp dọc đủ bảy)", "FE-11"),
    "td-03b-cach-ho-lam-giua": ("Bảy cách trượt ngang, vị trí giữa (04/07), chuyển động bình thường, 1440px", "FE-11"),
    "td-03c-cach-ho-lam-cuoi": ("Bảy cách trượt ngang, vị trí cuối (07/07), 1440px", "FE-11"),
    "td-04-theo-linh-vuc": ("Khối “Thủ đoạn theo từng lĩnh vực” (có nhãn chuyên đề tháng)", "FE-12, BE-13, FE-32"),
    "td-05-canh-bao-moi": ("Khối “Xu hướng và cảnh báo mới” và “Tìm hiểu sâu”", "FE-12, BE-07, BE-13"),
    "td-06-tiep-theo": (TIEP, "—"),
    "ct-01-hero": ("Hero trang Cuộc thi", "FE-08, FE-20"),
    "ct-02-200-cau-8-chuyen-de": ("Khối “200 câu hỏi, 8 chuyên đề” và thẻ dự thi tháng này", "FE-20, FE-32"),
    "ct-03a-thu-suc-chua-chon": ("Thử sức: câu 1, chưa chọn", "FE-24, FE-23"),
    "ct-03b-thu-suc-chon-dap-an-a": ("Thử sức: chọn đáp án A (chưa đúng, có giải thích)", "FE-24, FE-23"),
    "ct-03c-thu-suc-chon-dap-an-b": ("Thử sức: chọn đáp án B (chính xác)", "FE-24, FE-23"),
    "ct-03d-thu-suc-ket-qua": ("Thử sức: màn kết quả và lời mời thi thật", "FE-24"),
    "ct-04-gop-y-chia-se": ("Khối “Góp ý cho Chương trình” và “Chia sẻ cho người thân”", "FE-20"),
    "ct-05-tiep-theo": (TIEP, "—"),
    "hd-01-hero": ("Hero trang Hỏi – Đáp", "FE-08, FE-21"),
    "hd-02-hoi-rieng-tra-loi-cong-khai": ("Khối “Hỏi riêng, trả lời công khai” (ba bước)", "FE-21"),
    "hd-03-gui-cau-hoi": ("Form “Gửi câu hỏi, kiến nghị” và hộp “Trước khi gõ”", "FE-22, BE-25"),
    "hd-03b-form-canh-bao-so-nhay-cam": ("Trạng thái: cảnh báo khi gõ chuỗi từ 6 chữ số trở lên (nút gửi khóa)", "FE-22"),
    "hd-03c-form-da-nhap": ("Trạng thái: đã nhập đủ, tick nhận trả lời riêng, nút gửi mở", "FE-22"),
    "hd-03d-form-da-gui": ("Trạng thái: đã gửi", "FE-22, BE-25"),
    "hd-04-da-tra-loi": ("Khối “Câu hỏi đã được trả lời”", "FE-21, BE-08"),
    "hd-05-tiep-theo": (TIEP, "—"),
    "ctt-01-hero": ("Hero trang Cuộc thi tháng: chuyên đề, ngày thi, nút “Đăng ký dự thi”", "FE-33, FE-08, FE-32"),
    "ctt-02-cach-nhan-ra-cuoc-thi-that": ("Dải xanh “Cách nhận ra cuộc thi thật”", "FE-33"),
    "ctt-03-tham-gia-4-buoc": ("Khối “Tham gia trong bốn bước” (thể lệ 01–04)", "FE-33"),
    "ctt-04-giai-thuong": ("Khối “Giải thưởng tháng này” và hộp “Nhận giải thế nào?”", "FE-33"),
    "ctt-05-lich-ca-nam": ("Khối “Mỗi tháng một chuyên đề” (lịch 8 tháng)", "FE-33, FE-32"),
    "ctt-06-ket-qua-thang-truoc": ("Khối “Kết quả cuộc thi tháng 9/2026” và bảng đoạt giải", "FE-33"),
    "ctt-07-thac-mac-thuong-gap": ("Khối “Thắc mắc thường gặp” và ô nhắc lịch tháng sau", "FE-33"),
    "ctt-07b-thac-mac-mo-cau-1": ("Trạng thái: mở câu hỏi thường gặp đầu tiên", "FE-33"),
    "ctt-07c-nhac-lich-da-gui": ("Trạng thái: đã đăng ký nhắc lịch bằng thư điện tử", "FE-33"),
    "ctt-08-tiep-theo": (TIEP, "—"),
}

PAT = re.compile(r"^(?P<stem>.+)-(?P<w>1440|744|390)\.png$")


def main():
    files = {}
    for p in ANH.glob("*.png"):
        m = PAT.match(p.name)
        if m:
            files.setdefault(m["stem"], {})[int(m["w"])] = p.name
    total = sum(len(v) for v in files.values())
    lines = [open(pathlib.Path(__file__).with_name("README_dau.md"), encoding="utf-8").read().rstrip(), ""]
    for prefix, ten, hash_ in TRANG:
        stems = sorted(s for s in files if s.split("-")[0] == prefix)
        if not stems:
            continue
        lines += [f"## Trang {ten} (`{hash_}`)", "", "| Khối / trạng thái | Việc liên quan | 1440px | 744px | 390px |", "|---|---|---|---|---|"]
        for s in stems:
            mo_ta, viec = MO_TA.get(s, (s, "—"))
            cells = [f"[ảnh]({files[s][w]})" if w in files[s] else "—" for w in WIDTHS]
            lines.append(f"| `{s}` · {mo_ta} | {viec} | " + " | ".join(cells) + " |")
        lines.append("")
    (ANH / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    thieu = sorted(s for s in files if s not in MO_TA)
    print(f"{len(files)} khoi/trang thai, {total} anh; chua co mo ta: {thieu}")


if __name__ == "__main__":
    main()
