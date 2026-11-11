"""Lượt 1: tên mục viết hoa, bỏ chữ "bảng kiểm / checklist", đổi đường dẫn, bỏ dải "bản dựng thử"."""
import sys, glob, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ct_lib import Files, R
F = Files()
A, T, B, SH, D = 'src/app.js', 'src/tinhhuong.js', 'tools/build.py', 'src/shell.html', 'src/data.js'

# ---- đường dẫn ----
F.rep(A, 'cong-cu-checklist', 'cong-cu-kiem-tra', 'all')
F.rep(A, "return 'cong-cu-kiem-tra.checklist-'+m[1];", "return 'cong-cu-kiem-tra.kiem-tra-'+m[1];")
F.rep(A, "if((m=p[1].match(/^checklist-(\\d)$/)))return vBk(m[1]);", "if((m=p[1].match(/^kiem-tra-(\\d)$/)))return vBk(m[1]);")
F.rep(A, 'canh-bao-moi', 'canh-bao', 'all')
F.rep(A, "'img-18-nhom-canh-bao'", "'img-18-nhom-canh-bao-moi'")  # tên tệp ảnh giữ nguyên
F.rep(B, 'canh-bao-moi', 'canh-bao', 'all')
# tên cũ vẫn mở được
F.rep(A, "  tok=String(tok||'').replace(/^#/,'');var m;",
      "  tok=String(tok||'').replace(/^#/,'').replace(/^cong-cu-checklist/,'cong-cu-kiem-tra').replace(/\\.checklist-(\\d)$/,'.kiem-tra-$1').replace(/^cac-rui-ro\\.canh-bao-m[o]i/,'cac-rui-ro.canh-bao');var m;")

# ---- tên mục viết hoa ----
for f in (A, T):
    F.rep(f, 'Khẩn cấp', 'KHẨN CẤP', 'all')
F.rep(A, 'Công cụ & bảng kiểm', 'CÔNG CỤ KIỂM TRA', 'all')
F.rep(A, 'Công cụ &amp; bảng kiểm', 'CÔNG CỤ KIỂM TRA')
F.rep(A, "sh:'Công cụ'", "sh:'CÔNG CỤ'")
F.rep(A, 'Các rủi ro', 'RỦI RO', 'all')
F.rep(T, 'Kiến thức nền tảng', 'KIẾN THỨC NỀN TẢNG', 'all')
F.rep(B, '<b>Kiến thức nền tảng</b>', '<b>KIẾN THỨC NỀN TẢNG</b>')
F.rep(B, '<h2 id=\\"h-lib\\">Kiến thức nền tảng</h2>', '<h2 id=\\"h-lib\\">KIẾN THỨC NỀN TẢNG</h2>')
F.rep(B, '<button data-go="thu-vien">Kiến thức nền tảng</button>', '<button data-go="thu-vien">KIẾN THỨC NỀN TẢNG</button>')
F.rep(B, "sau khối Các rủi ro", "sau khối RỦI RO")
# Cảnh báo mới -> CẢNH BÁO
F.rep(A, "{k:'canh-bao',t:'Cảnh báo mới',i:'mega',s:'Dựa trên văn bản của cơ quan nhà nước',lead:'Mỗi cảnh báo dựa trên văn bản của cơ quan nhà nước, ghi rõ nguồn và ngày cập nhật. Website không tổng hợp tin báo chí.'}",
      "{k:'canh-bao',t:'CẢNH BÁO',i:'mega',s:'Thủ đoạn đang cần chú ý',lead:'Những thủ đoạn đang cần chú ý, do website biên soạn để bà con nhận ra sớm. Mỗi cảnh báo ghi ngày cập nhật. Website không đưa tin, không tổng hợp tin báo chí và không nêu tên cá nhân, tổ chức nào.'}")
F.rep(A, "</span>Cảnh báo mới</h2>", "</span>CẢNH BÁO</h2>")
F.rep(A, "['cac-rui-ro.canh-bao','Cảnh báo mới']", "['cac-rui-ro.canh-bao','CẢNH BÁO']")
F.rep(A, "/* Khối Cảnh báo mới: tối đa 3 mục", "/* Khối CẢNH BÁO: tối đa 3 mục")
F.rep(B, "/* Khối Cảnh báo mới: tối đa 3 mục", "/* Khối CẢNH BÁO: tối đa 3 mục", 2)
F.rep(A, "/* Cảnh báo mới (Điều 20). Mười mục dưới đây là MẪU TRÌNH BÀY, chưa phải cảnh báo thật.\n   st: 'd' có văn bản của cơ quan nhà nước · 'h' cần kiểm chứng. sg:",
      "/* CẢNH BÁO (Điều 20). d: ngày đăng trên website. st: phân loại nội bộ, không hiện ra trang. sg:")

# ---- bảng kiểm, checklist -> kiểm tra ----
F.rep(A, "Tất cả công cụ và checklist", "Tất cả công cụ kiểm tra")
F.rep(A, "['bk4','Bảng kiểm trước khi vay']", "['bk4','Kiểm tra trước khi vay']")
F.rep(A, "<h2>Bảng kiểm bỏ túi</h2>", "<h2>Kiểm tra bỏ túi</h2>")
F.rep(A, "'Tải bảng kiểm PDF</button>'", "'Tải bản kiểm tra PDF</button>'")
F.rep(A, "'Mở bảng kiểm</button>'", "'Mở phần kiểm tra</button>'")
F.rep(A, "Nút “Tải bảng kiểm PDF” mở hộp thoại in.", "Nút “Tải bản kiểm tra PDF” mở hộp thoại in.")
F.rep(A, '<h2 id="h-ck">Bảng kiểm theo việc sắp làm</h2>', '<h2 id="h-ck">Kiểm tra theo việc sắp làm</h2>')
F.rep(A, "Mỗi bảng kiểm có hai phần: năm việc phải chặn ngay và bảng kiểm bỏ túi, lấy nguyên văn từ bài đọc chuyên đề.",
      "Mỗi mục kiểm tra có hai phần: năm việc phải chặn ngay và phần kiểm tra bỏ túi, lấy nguyên văn từ bài đọc chuyên đề.")
F.rep(A, "'Bảng kiểm: '+BK", "'Kiểm tra: '+BK", 'all')
F.rep(A, ",'Bảng kiểm',BK[n].i)", ",'Kiểm tra',BK[n].i)")
F.rep(A, "</span>Bảng kiểm bỏ túi</legend>", "</span>Kiểm tra bỏ túi</legend>")
F.rep(A, "'Tự kiểm tra bằng bảng kiểm</button>", "'Tự kiểm tra</button>")
F.rep(A, "khi nghi ngờ bị lừa; 8 checklist'", "khi nghi ngờ bị lừa; 8 mục kiểm tra theo việc sắp làm'")
F.rep(A, "'Cảnh báo mới, lừa đảo, vay và nợ, đầu tư, bảo hiểm và tiết kiệm, dữ liệu cá nhân'", "'Cảnh báo, lừa đảo, vay và nợ, đầu tư, bảo hiểm và tiết kiệm, dữ liệu cá nhân'")
F.rep(A, "/* ---- Bảng kiểm theo chuyên đề: năm việc phải chặn ngay + bảng kiểm bỏ túi ---- */", "/* ---- Kiểm tra theo chuyên đề: năm việc phải chặn ngay + kiểm tra bỏ túi ---- */")
F.rep(A, "ba công cụ, tám bảng kiểm, mười trang", "ba công cụ, tám mục kiểm tra, mười trang")
F.rep(A, "/* ============ CÔNG CỤ & BẢNG KIỂM ============ */", "/* ============ CÔNG CỤ KIỂM TRA ============ */")
F.rep(D, "BẢNG KIỂM BỎ TÚI — CHỤP LẠI MÀN HÌNH NÀY", "KIỂM TRA BỎ TÚI — CHỤP LẠI MÀN HÌNH NÀY", 8)
# chữ lặp do lượt thay từ tiếng Anh để lại
F.rep(A, "'Không bấm đường dẫn (đường dẫn) lạ'", "'Không bấm đường dẫn lạ'")
F.rep(A, "Đừng tin biểu tượng (biểu tượng), màu sắc", "Đừng tin biểu tượng, màu sắc")
assert not re.search(r'[Bb]ảng kiểm|BẢNG KIỂM|[Cc]hecklist', F.get(A).replace('cong-cu-checklist', '').replace('checklist-(', '')), [m.group(0) for m in re.finditer(r'.{30}(?:[Bb]ảng kiểm|[Cc]hecklist).{30}', F.get(A).replace('cong-cu-checklist', '').replace('checklist-(', ''))]

# ---- dải đầu trang: bỏ "BẢN DỰNG THỬ" ----
F.rep(SH, '<div class="demo"><div class="wrap"><span><b>BẢN DỰNG THỬ</b><span class="dm-x"> · chưa phải website đang hoạt động</span></span>',
      '<div class="demo"><div class="wrap"><span class="dm-t">Website chỉ có một địa chỉ: <b>antoantaichinh.vn</b></span>')
F.save()

# ---- bài viết: "bảng kiểm" -> "phần kiểm tra" ----
n = 0
for f in sorted(glob.glob(os.path.join(R, 'bai', '*.md'))):
    s = open(f, encoding='utf8').read()
    t = s.replace('Bảng dưới đây là bảng kiểm', 'Bảng dưới đây là phần kiểm tra').replace('bảng kiểm', 'phần kiểm tra').replace('Bảng kiểm', 'Phần kiểm tra')
    if t != s:
        open(f, 'w', encoding='utf8').write(t); n += 1
print('bài đã sửa', n)
