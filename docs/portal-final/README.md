# antoantaichinh.vn: bản chính thức ngày 10/11/2026

Đây là bản để đưa lên máy chủ và chạy chính thức. Mọi dấu vết của bản dựng thử, bản dự thảo đã được gỡ. Phần "Bản chính thức: những gì đã đổi" ở dưới ghi từng việc; phần "Ba việc người quản trị cần làm" ghi những chỗ chỉ người quản trị mới điền được.

## Ba việc người quản trị cần làm

1. **Nơi nhận góp ý và câu hỏi.** Mở `index.html`, tìm dòng `window.ATTC_MAIL='';` ở gần cuối tệp và điền hộp thư nhận, ví dụ `window.ATTC_MAIL='gopy@antoantaichinh.vn';`. Khi đó trang Góp ý và phần gửi câu hỏi ở Hỏi – Đáp hiện biểu mẫu; người gửi bấm Gửi trong ứng dụng thư của họ. Nếu có máy chủ nhận biểu mẫu thì điền `window.ATTC_API` (ba điểm nhận POST, JSON: `/questions`, `/feedback`, `/registrations`). **Để trống cả hai thì hai trang đó ghi "nơi nhận sẽ được công bố tại trang này"**; website không bao giờ báo "đã gửi" khi chưa gửi được.
2. **Cuộc thi.** Cuộc thi đang ở trạng thái "chưa mở đăng ký"; người dân vẫn tự luyện được toàn bộ câu hỏi. Khi mở: trong `src/app.js`, sửa dòng `var ACTIVITY={on:true,open:false,time:'',prize:'',rules:'',…}` thành `open:true` và điền thời gian, giải thưởng, thể lệ, rồi dựng lại. Đăng ký dự thi cần máy chủ (`ATTC_API`); bài làm hiện chỉ chấm và lưu trên máy người thi, nên muốn xét giải thì máy chủ phải nhận thêm kết quả.
3. **Ngày rà soát.** Các trang việc cần làm ghi "Rà soát gần nhất: 10/11/2026 · Rà soát lại trước: 08/02/2027"; các đầu số 113, 156, 5656 ghi "Kiểm tra gần nhất: 10/11/2026". Quá 90 ngày trang tự hiện nhãn nhắc, cảnh báo tự chuyển xuống phần lưu trữ. Mỗi lần rà soát lại, sửa ba ngày trong `var REVIEW` và ngày `d` của từng cảnh báo trong `var ALERTS` (`src/app.js`), rồi dựng lại.

## Bản chính thức: những gì đã đổi (10/11/2026)

- Bỏ dải "BẢN DỰNG THỬ" ở đầu trang; dải này chỉ còn nút Chữ lớn. Bỏ hai thẻ chặn máy tìm kiếm (`noindex`) trong `index.html`.
- Dùng "kiểm tra" thay cho "checklist" và "bảng kiểm" ở mọi chỗ hiển thị, trong tám bài đọc ("KIỂM TRA BỎ TÚI") và 135 bài thủ đoạn ("phần kiểm tra"). Đường dẫn đổi theo: `#cong-cu-kiem-tra`, `#cong-cu-kiem-tra.kiem-tra-4`; đường dẫn cũ vẫn mở được.
- Tên mục viết hoa: KHẨN CẤP, CÔNG CỤ KIỂM TRA, RỦI RO, KIẾN THỨC NỀN TẢNG, CẢNH BÁO (thay "Cảnh báo mới"; đường dẫn `#cac-rui-ro.canh-bao`, đường dẫn cũ vẫn mở được).
- Cảnh báo: bỏ nhãn "Dựa trên cảnh báo của [Tên cơ quan]", "Cần kiểm chứng · Chưa có kết luận", dòng "Mẫu trình bày…" và khối "Nguồn cảnh báo". Mười cảnh báo nay là nội dung do website biên soạn, ngày đăng 10/11/2026.
- Bỏ Chính sách tài trợ và khối "Đơn vị tài trợ" ở trang Về website.
- "Nguyên tắc dẫn nguồn" viết lại thành **"Nguyên tắc biên soạn nội dung"**: website tự biên soạn, không đưa tin, không tổng hợp, không đăng lại bài của báo chí hay trang khác; không nêu tên tổ chức, cá nhân. Trang Liên hệ bỏ dòng "Đường dẫn: […]" và bỏ khối đường dây nóng của tổ chức tín dụng (khối này dựa trên việc chép số từ văn bản của cơ quan nhà nước).
- Chính sách bảo vệ dữ liệu cá nhân viết lại: website không lưu giữ lâu dài; chỉ giữ trong thời gian ngắn để liên hệ, trả lời theo yêu cầu của chính người gửi, hoặc để xét, trao giải cuộc thi.
- Bỏ mọi thông tin về UBND xã Thiên Lộc, Công an xã Thiên Lộc, đơn vị vận hành và thẩm định. Chỗ "Pháp nhân chủ quản" ghi "antoantaichinh.vn".
- Bỏ khung "Bản dự thảo, chưa có hiệu lực…"; bốn văn bản ghi "Cập nhật ngày 10/11/2026". Không còn chỗ chờ điền trong ngoặc vuông.
- Thêm **Ngân hàng câu hỏi dành cho nhân viên doanh nghiệp** vào phần thi: 78 câu, ba phần (`#thidn1`, `#thidn2`, `#thidn3`; danh sách ở `#thidn`). Sinh từ tài liệu v1.8 bằng `tools/build_dn.py` → `src/dn_bank.js`.
- Biểu mẫu không còn chế độ "xem thử"; bỏ ghi chú nội bộ "Ghi chú cho chủ quản" ở trang đăng ký dự thi.

Các lượt sửa này nằm trong `tools/ct1_nhan.py`, `ct2_noidung.py`, `ct3_chinhsach.py` (chạy một lần, đã chạy; giữ lại để đối chiếu).

## Nền của bản này

Bản này dựng tiếp từ bản ngày 31/10/2026 và bản bổ sung ngày 09/11/2026, có hai phần lớn:

1. **Công cụ chọn tình huống** (`#khan-cap.chon-tinh-huong`). Đây là lối vào chính của nút "Chuyện gì đây???" ở trang chủ và trang KHẨN CẤP.
2. **KIẾN THỨC NỀN TẢNG** (`#thu-vien`). Trang gom ba ngăn bài viết:
   - Lừa đảo: Từ cổ chí kim.
   - Phân tích theo chuyên đề.
   - Các thủ đoạn thường gặp: 157 bài, có tìm và lọc theo nhóm.

Trình hỏi 3 bước cũ vẫn giữ ở `#khan-cap.kiem-tra`, có lối vào bằng dòng chữ nhỏ dưới nút Bắt đầu của trang Khẩn cấp. Menu vẫn đúng ba mục.

## Đưa lên máy chủ

Chép `index.html` và `bai-viet.js` vào thư mục gốc của website, thay `index.html` cũ, giữ nguyên thư mục `img/`. Toàn văn 157 bài nằm trong `bai-viet.js` và chỉ được tải khi người đọc mở bài đầu tiên, nhờ vậy trang chính vẫn nhẹ. Hai tệp phải nằm cùng thư mục.

## Công cụ chọn tình huống chạy thế nào

| Bước | Người dân làm gì | Dữ liệu |
|---|---|---|
| 1. Chọn chuyện giống mình | Gõ vài chữ, có dấu hoặc không dấu, gõ sai nhẹ hay viết tắt (ko, dc, ck, stk…) cũng được. Hoặc mở một trong 12 nhóm và chọn trong 82 tình huống. Không thấy chuyện giống mình thì có bốn lối ra: bốn việc không làm, trình hỏi 3 câu, cách tự kiểm chứng, Hỏi – Đáp | `SGRP`, `SITS` trong `src/st_data.js` |
| 2. Đến lúc này, chuyện gì đã xảy ra? | Chọn nhiều dòng, gồm: không có việc nào trong danh sách; 10 việc đã xảy ra (đe dọa, cài ứng dụng, lộ mã ngân hàng, mất SIM, đăng nhập lạ vào ngân hàng hoặc ví, đã chuyển tiền, đã giao hàng, cho mượn tài khoản, gửi giấy tờ, tiền lạ vào); "Tôi không nhớ". Chưa chọn dòng nào thì trang nhắc, không cho xem kết quả | `SCONS` |
| 3. Việc nên làm | Thấy theo thứ tự: **Việc 1, nên làm trước tiên** (kèm đủ giải thích, hộp tìm số ngân hàng, câu nói mẫu nếu có), khuyến nghị (DỪNG, HOÃN VÀ KIỂM CHỨNG hoặc CHƯA PHÁT HIỆN ĐIỂM DỪNG) kèm lý do, các việc tiếp theo, Đừng làm, Tự kiểm chứng thế nào, Đọc thêm. Kèm nút In, Gửi cho người thân, Sửa lựa chọn, Chọn chuyện khác | Hàm `stCompute()` trong `src/tinhhuong.js` |

Quy tắc xếp việc:

- Đã lỡ làm bất kỳ việc nào ở bước 2 thì khuyến nghị là **DỪNG**.
- Việc 1 lấy theo thứ tự ưu tiên của trang "Trả lời vài câu hỏi ngắn": đe dọa → quyền vào tài khoản, thiết bị → tiền → giấy tờ → tiền lạ.
- Các bước xử lý khi đã lỡ làm theo được **lấy nguyên văn** từ 10 trang việc cần làm đã thẩm định, theo chỉ số bước, và hiện đủ mọi câu giải thích.
- Đã chọn "cài ứng dụng" thì bỏ bước "chỉ mới đọc mã, không cần tắt mạng".
- Xếp theo **từng hành động** (bảng `STACT` trong `tinhhuong.js`): gọi 113 → cắt quyền điều khiển máy → liên hệ ngân hàng, ví, nhà mạng → không đưa thêm tiền, giấy tờ → việc riêng của tình huống → báo người nhà → đổi mật khẩu, rà soát → giữ bằng chứng → **một** bước trình báo (luôn hiện) → mang máy đi sửa, phản ánh 156. Cùng một hành động chỉ giữ một bước. Không cắt bớt bước nào.
- Việc riêng của tình huống luôn được giữ khi chọn thêm (bảng `STSF`). Bị đe dọa thì gọi 113 luôn là việc 1.
- Bản "Gửi cho người thân" có đủ mọi bước; đường dẫn kèm theo (ví dụ `#khan-cap.chon-tinh-huong.link-la.app-sim-money`) mở lại đúng các lựa chọn.
- Chưa làm gì thì dùng câu "Việc nên làm trước tiên" của chính tình huống đó.

Nhãn "Việc nên làm trước tiên" thay cho "phương án an toàn nhất", vì Điều 3 của Đề cương 1.3 cấm nhãn "an toàn". Mỗi kết quả đều có câu "Đây là ví dụ để bạn đối chiếu, không phải kết luận về việc bạn đang gặp".

Bản chính thức hiện đủ 82 tình huống và 157 bài thủ đoạn. Nếu muốn tạm ẩn 19 tình huống do website bổ sung (danh sách `STUV`) cùng kho 157 bài, đặt `AN_CHUA_THAM_DINH=true` ở đầu `src/tinhhuong.js` rồi dựng lại.

Mỗi tình huống có một đường dẫn riêng, ví dụ `#khan-cap.chon-tinh-huong.cong-an-goi`, để gửi cho người thân hoặc in ra. Website không lưu lựa chọn của người dùng và không gửi lựa chọn đi đâu.

## Sửa đợt trước trong ngày 10/11/2026

- Bỏ hai đoạn ở chân trang: câu về đơn vị vận hành ("Website do Công ty ABC vận hành…") và khung "Đơn vị tài trợ".
- Đổi tên công cụ "Tôi đang gặp chuyện gì?" thành "Chuyện gì đây???" (nút ở trang chủ, trang Khẩn cấp, tiêu đề công cụ và trình hỏi 3 câu).
- Thay từ tiếng Anh bằng tiếng Việt trong chữ hiển thị và 157 bài, bằng `tools/viet_hoa.py` (chạy lại không thay trùng). Ví dụ: đường link → đường dẫn, online → trên mạng, email → thư điện tử, visa → thị thực, voucher → phiếu mua hàng, logo → biểu tượng; 45 tên bài thủ đoạn được đặt lại với từ tiếng Việt đứng đầu. Danh sách đủ và các từ giữ nguyên: `nhat-ky-viet-hoa.md`. Từ khóa tìm kiếm không dấu giữ nguyên, nên gõ "link", "online", "email" vẫn tìm ra.

## Đường dẫn mới

- `#khan-cap.chon-tinh-huong`: mở công cụ. `#khan-cap.chon-tinh-huong.<mã>` mở thẳng bước 2 của một tình huống. Viết tắt: `#chontinhhuong`.
- `#thu-vien` mở trang Kiến thức nền tảng. Ba ngăn có đường dẫn riêng: `#thu-vien.co-chi-kim`, `#thu-vien.chuyen-de`, `#thu-vien.thu-doan`. Viết tắt: `#thuvien`.
- `#thu-vien.<tên-bài>` mở một bài thủ đoạn. Có thể mở theo số thứ tự, ví dụ `#bai5`, `#bai157`.

## Sửa và dựng lại

Mã nguồn nằm trong thư mục `nguon/`. Chạy các lệnh từ thư mục đó:

```
python3 tools/fix_articles.py bai nhat-ky-sua-bai.md                # sửa bài tại chỗ theo quy tắc đã chốt, ghi nhật ký; chạy lại không sửa trùng
python3 tools/build_articles.py bai out/bai-viet.js src/art_index.js # bai/*.md → toàn văn bài + chỉ mục bài
python3 tools/build_dn.py nguon-tai-lieu/ngan-hang-doanh-nghiep-v1_8.txt src/dn_bank.js  # ngân hàng câu hỏi doanh nghiệp
python3 tools/build.py .                                             # ghép src/ → out/index.html (chạy độc lập) và out/artifact.html
node tools/chk_sits.js src/st_data.js                                # kiểm tra dữ liệu tình huống
```

- Sửa câu chữ tình huống: `src/st_data.js`. Ý nghĩa từng trường ghi ở đầu tệp.
- Sửa giao diện: `src/tinhhuong.css`.
- Sửa cách tính, giao diện công cụ và kho bài: `src/tinhhuong.js`.
- `src/app.js`, `src/app.css`, `src/shell.html`, `src/data.js` gốc là bản ngày 31/10, đã sửa theo các đợt ngày 10/11/2026 (xem trên); trong đó có một câu bỏ ở trang "Có người đang đe dọa", bước 4: "Chặn rồi thì phần lớn bằng chứng không lấy lại được…" (chưa có căn cứ). `tools/build.py` vá các chỗ nối, mỗi chỗ có kiểm tra khớp đúng một lần.

## Đã kiểm thử

Đã chạy tự động các phần sau:

- Toàn bộ 82 tình huống, mỗi tình huống với từng lựa chọn ở bước 2, tổng cộng 984 ca; và 83.886 tổ hợp nhiều lựa chọn bằng `node tools/chk_combos.js src`. Bộ kiểm tra xem cả phần giải thích và bản gửi người thân: luôn có đúng một bước trình báo; không mất việc riêng của tình huống; bị đe dọa thì 113 đứng đầu; liên hệ ngân hàng, nhà mạng đứng trước đổi mật khẩu; không chỉ dẫn làm sạch máy nào trước trình báo; không trùng hành động; bản gửi có đủ mọi bước. Lần nào cũng ra "Việc nên làm trước tiên". Không ca nào có chữ "undefined" hay nhãn "an toàn".
- Mở đủ 157 bài, có kiểm tra không còn ký hiệu Markdown thô.
- 15 cách gõ tìm thường gặp, có dấu và không dấu.
- Lọc và tìm trong kho bài.
- Không có thanh cuộn ngang ở bề rộng 320, 390, 768, 1024 và 1400px, cả giao diện sáng lẫn tối. Không có lỗi trong bảng điều khiển trình duyệt.
- Bản chính thức 10/11/2026: mở 57 đường dẫn ở bề rộng 320, 390 và 1280px, không còn chữ của bản dựng thử, không tràn ngang, không lỗi; làm trọn 78 câu của phần doanh nghiệp; thử ba chế độ nơi nhận (chưa có, hộp thư, máy chủ).

Kết quả thử với người thật chưa có.

## Việc nên làm tiếp sau khi chạy chính thức

Xem bảng rà soát trong Project, mục "Bản chính thức ngày 10/11/2026": điền nơi nhận góp ý; thử với người thật trên điện thoại 360×640; rà dần 19 tình huống và 157 bài do website bổ sung theo góp ý của cộng đồng.
