"""Chup cac man Khan cap cua ban dung o 1440 px va tinh vi tri so (top %, left %) cho mockup ban giao.

python chup_khan_cap.py ../mockup/antoantaichinh_v2.html anh-portal-khan-cap
Can playwright (python -m pip install --user playwright) va Chromium cua playwright. In ra vi tri so de dan vao dung_bo_khan_cap.py.
"""
import io, os, sys, glob
from PIL import Image
from playwright.sync_api import sync_playwright

src, outdir = sys.argv[1:3]
os.makedirs(outdir, exist_ok=True)
EXE = (glob.glob(os.path.expanduser(r'~\AppData\Local\ms-playwright\chromium-*\chrome-win64\chrome.exe')) or [None])[-1]

# (ten anh, duong dan trong ban dung, cac buoc bam, [(so, chu cua khoi)])
SHOTS = [
 ('khan-cap', 'khan-cap', [], [(1, 'Nhận được cuộc gọi, tin nhắn'), (2, 'Trả lời 3 câu hỏi ngắn để nhận'), (3, 'Bốn việc không làm khi nghi ngờ'), (4, 'Rút từ “Năm việc'),
   (5, 'Chọn ô gần đúng nhất. Việc cần làm'), (6, 'Có người đang đe dọa, ép buộc tôi'), (7, 'Không ô nào giống trường hợp của tôi'), (8, 'Đang giúp người thân'),
   (9, 'tình huống điển hình'), (10, 'Cách tự tìm số ngân hàng của bạn'), (11, 'Số do Nhà nước vận hành'), (12, 'Kiểm chứng gần nhất'), (13, 'Liên hệ đúng nơi'), (14, 'Website không trực 24/7')]),
 ('khan-cap-cua-2', 'khan-cap', ['[data-door="2"]'], [(1, 'Chọn dòng gần đúng nhất với điều bạn nhìn thấy'), (2, 'Tôi đã chuyển tiền, đã đưa tiền')]),
 ('trinh-hoi', 'khan-cap.kiem-tra', [], [(1, 'Trả lời 3 câu hỏi ngắn để nhận dấu hiệu cảnh báo và việc cần làm ngay.'), (2, 'Không cần đăng nhập. Câu trả lời'), (3, 'Họ liên hệ với bạn qua đâu?'),
   (4, 'Facebook, TikTok, YouTube'), (5, 'Kênh khác, hoặc không nhớ')]),
 ('trinh-hoi-cau-2', 'khan-cap.kiem-tra', ['[data-wz="ch"][data-v="dt"]'], [(1, 'Họ yêu cầu bạn làm gì?'), (2, 'Đọc hoặc gửi mã OTP'), (3, 'Chưa yêu cầu gì cụ thể'), (4, 'Tôi chưa biết, không nhớ rõ')]),
 ('trinh-hoi-ket-qua', 'khan-cap.kiem-tra', ['[data-wz="ch"][data-v="dt"]', '[data-wz="rq"][data-v="otp"]', '[data-wz="next"]', '[data-wz="pr"][data-v="threat"]', '[data-wz="next"]'],
  [(1, 'Mức độ cần thận trọng:'), (2, 'Tình huống gần giống'), (3, 'Đây là ví dụ để bạn đối chiếu'), (4, 'Dấu hiệu cần chú ý'), (5, 'Việc cần làm ngay'), (6, 'Nếu bạn đã lỡ làm theo'), (7, 'Đọc bài chi tiết'), (8, 'Kết quả chỉ mang tính tham khảo')]),
 ('viec-can-lam', 'pb2', [], [(1, 'Bạn vừa chuyển tiền, hoặc vừa giao hàng đi'), (2, 'NẾU BẠN ĐÃ CHUYỂN TIỀN'), (3, 'Tìm đúng số tổng đài ngân hàng'), (4, 'NÓI VỚI TỔNG ĐÀI'),
   (5, 'Việc này làm trước, vì hàng còn'), (6, 'Bạn cũng đã đưa mã OTP'), (7, 'Đừng trả phí cho người hứa lấy lại tiền'), (8, 'Chỉ làm các bước dưới đây nếu'), (9, 'Gọi 156'), (10, 'Rà soát gần nhất'), (11, 'Các bước trên là việc nên làm ngay')]),
 ('tra-loi-nhanh', 'pb0', [], [(1, 'Trả lời vài câu hỏi ngắn'), (2, 'Có ai đang đe dọa bạn'), (3, 'Câu này để đầu tiên'), (4, 'Chưa câu nào ở trên đúng với bạn?')]),
]
FIND = """(t) => { const H = document.documentElement.scrollHeight, W = document.documentElement.scrollWidth;
  let best = null; for (const el of document.querySelectorAll('main *, body *')) { if (!el.offsetParent && el.tagName !== 'BODY') continue;
    const tx = (el.innerText || '').trim(); if (!tx.includes(t)) continue; const r = el.getBoundingClientRect();
    if (!best || (r.width * r.height) < best.a) best = { a: r.width * r.height, top: r.top + scrollY, left: r.left }; }
  return best ? [Math.round(1000 * best.top / H) / 10, Math.max(4, Math.round(1000 * best.left / W) / 10 - 2)] : null }"""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE)
    pg = b.new_page(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce')
    url = 'file:///' + os.path.abspath(src).replace('\\', '/')
    for name, route, clicks, marks in SHOTS:
        pg.goto(url + '#' + route); pg.wait_for_timeout(900)
        for c in clicks:
            loc = pg.locator(c).first
            if loc.count():
                loc.click(); pg.wait_for_timeout(500)
            else:
                print('  khong thay', c)
        pg.evaluate('() => window.scrollTo(0, 0)'); pg.wait_for_timeout(300)
        png = pg.screenshot(full_page=True)
        Image.open(io.BytesIO(png)).convert('RGB').save(os.path.join(outdir, name + '.jpg'), 'JPEG', quality=70)
        pins = []
        for n, t in marks:
            r = pg.evaluate(FIND, t)
            pins.append((n,) + tuple(r) if r else (n, None, None))
        print(name, pins)
    b.close()
