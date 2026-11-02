#!/usr/bin/env python3
"""Ghép shell + CSS + dữ liệu + JS thành hai bản: index.html (tự chạy trên host) và artifact.html."""
import json, re, pathlib

B = pathlib.Path(__file__).resolve().parent
OUT = B.parent / "out"
OUT.mkdir(exist_ok=True)

css = (B / "app.css").read_text(encoding="utf-8")
js = (B / "app.js").read_text(encoding="utf-8")
shell = (B / "shell.html").read_text(encoding="utf-8")
data = json.loads((B / "data.json").read_text(encoding="utf-8"))

# Hình vẽ cho shell lấy đúng từ bảng ICON trong app.js để hai nơi không lệch nhau
icons = dict(re.findall(r"^ (\w+):'(.*?)',?$", js.split("var ICON={", 1)[1].split("};", 1)[0], re.M))
def ic(m):
    return ('<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
            + icons[m.group(1)] + "</svg>")
shell = re.sub(r"\{\{ic:(\w+)\}\}", ic, shell)
assert "{{" not in shell

blob = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
blob = blob.replace("</", "<\\/").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
assert "</script" not in js.lower()

FONT = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap">')

ICO = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='13' fill='%2313457F'/%3E"
       "%3Cpath d='M32 12l16 6v13c0 11-7 19-16 21-9-2-16-10-16-21V18z' fill='none' stroke='%23fff' stroke-width='4'/%3E"
       "%3Cpath d='M24 32l6 6 11-12' fill='none' stroke='%23fff' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")

HEAD = f"""<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>An Toàn Tài Chính — Nhận diện lừa đảo và rủi ro tài chính</title>
<meta name="description" content="Nhận diện lừa đảo và rủi ro tài chính · Biết cách tự bảo vệ. Khẩn cấp: trả lời 3 câu hỏi ngắn để biết việc cần làm ngay. Công cụ tự kiểm tra trước khi chuyển tiền, đầu tư, vay. Các rủi ro và cảnh báo mới. Bản dựng thử, chưa phải website đang hoạt động.">
<meta name="robots" content="noindex, nofollow">
<meta name="googlebot" content="noindex, nofollow">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#13457F" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0C1117" media="(prefers-color-scheme: dark)">
<meta name="format-detection" content="telephone=no">
<link rel="icon" href="{ICO}">
<link rel="apple-touch-icon" href="{ICO}">
<meta property="og:type" content="website">
<meta property="og:locale" content="vi_VN">
<meta property="og:title" content="An Toàn Tài Chính — bản dựng thử">
<meta property="og:description" content="Nhận diện lừa đảo và rủi ro tài chính · Biết cách tự bảo vệ. Bản dựng thử, chưa phải website đang hoạt động.">
<!--
  BẢN DỰNG THỬ — antoantaichinh.vn · cấu trúc ba mục theo Bản đặc tả đóng gói
  Dựng lại ngày 27/10/2026. Menu chính đúng ba mục: Khẩn cấp · Công cụ & checklist · Các rủi ro.
  Trang chủ năm khối: Khẩn cấp · Công cụ & checklist · Các rủi ro · Cảnh báo mới (tối đa 3) · chân trang.
  Nội dung chuyên môn (bài đọc, ngân hàng câu hỏi, các bước xử lý, chính sách) giữ nguyên văn; các trang mới
  chỉ ghép lại từ nội dung đã thẩm định. Các điểm đặc tả được điều chỉnh để giữ đúng đề cương 1.3 ghi trong README.

  Toàn bộ trang nằm trong một tệp duy nhất: không cần máy chủ ứng dụng, không cần cơ sở dữ liệu,
  không gọi ra ngoài trừ phông chữ Google Fonts (có phông dự phòng của máy nếu không tải được).
  Chép tệp này vào thư mục gốc của host là chạy được. Đường dẫn dạng #khan-cap, #cac-rui-ro.canh-bao-moi
  tương ứng /khan-cap, /cac-rui-ro/canh-bao-moi của đặc tả; khi dựng trên hệ quản trị nội dung thì đổi sang đường dẫn thật.

  VIỆC PHẢI LÀM TRƯỚC KHI CHO CÔNG KHAI (bảng đầy đủ: README.md, mục "Rà soát trước khi công khai"):
  1. Gỡ hai thẻ meta robots ở trên khi nội dung đã được duyệt. Đang để noindex để công cụ
     tìm kiếm chưa lập chỉ mục bản thử — tránh việc người dân tìm thấy bản chưa duyệt.
  2. Thay mọi chỗ trong ngoặc vuông [...] bằng thông tin thật của pháp nhân chủ quản, kể cả
     ngày rà soát và nguồn kiểm chứng (biến REVIEW trong mã). Kiểm chứng lại 113, 156,
     5656 và cú pháp nhắn tin theo văn bản còn hiệu lực ngay trước ngày công khai.
  3. Năm chính sách ở chân trang (Chính sách bảo mật, Điều khoản sử dụng, ba văn bản của Nguyên tắc
     nội dung) đang là BẢN DỰ THẢO, phải được luật sư độc lập rà soát và chủ quản ban hành trước khi
     website hoạt động. Câu nào trên trang hứa điều máy chủ chưa bảo đảm được thì sửa đồng thời cả
     chính sách lẫn trang, không sửa một bên.
  4. Ba biểu mẫu (câu hỏi, góp ý, đăng ký thi), việc đếm 02 lượt thi và việc khóa Chuyên đề 1
     hiện chỉ chạy trên máy người xem, CHƯA GỬI ĐI ĐÂU. Khi có máy chủ: đặt
     window.ATTC_API = "https://…/api" trong một thẻ script đứng trước mã chính; máy chủ phải
     tự đếm lượt thi (trả mã 409 khi hết lượt), chống gửi rác, phân quyền người duyệt.
     Không để máy tự đăng công khai câu hỏi hoặc câu trả lời: người biên tập duyệt từng câu.
  5. Dải trên cùng đang ghi "BẢN DỰNG THỬ". Khi công khai, đổi thành
     "Địa chỉ duy nhất: antoantaichinh.vn" và giữ nút "Chữ lớn".
  6. Mười cảnh báo (biến ALERTS) và bảy câu hỏi – đáp (biến QA) là MẪU TRÌNH BÀY. Các phân loại biên
     tập — kênh (TCH), nhóm người (GROUPS), mức độ cần thận trọng của từng thủ đoạn (TLV), bảng ánh xạ
     tình huống của trình hỏi (WZRULES), nhóm rủi ro của từng bài — phải được Ban biên tập xác nhận.
-->
{FONT}
<style>
{css}
</style>
</head>
<body>
"""

standalone = (HEAD + shell + "\n<script>window.__STANDALONE__=true;window.__DATA__=" + blob + ";</script>\n<script>\n"
              + js + "\n</script>\n</body>\n</html>\n")
(OUT / "index.html").write_text(standalone, encoding="utf-8")

artifact = ("<title>An Toàn Tài Chính</title>\n" + FONT + "\n<style>\n" + css + "\n</style>\n" + shell
            + "\n<script>window.__DATA__=" + blob + ";</script>\n<script>\n" + js + "\n</script>\n")
(OUT / "artifact.html").write_text(artifact, encoding="utf-8")

for f in ("index.html", "artifact.html"):
    print(f, (OUT / f).stat().st_size)
