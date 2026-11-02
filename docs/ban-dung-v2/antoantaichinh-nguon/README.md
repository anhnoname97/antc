# antoantaichinh.vn: mã nguồn bản dựng thử (27/10/2026)

Website **cung cấp thông tin tham khảo về nhận diện và phòng ngừa rủi ro tài chính, lừa đảo**. Website **không tiếp nhận, xác minh hoặc xử lý tin báo lừa đảo**.

Dựng theo **Bản đặc tả đóng gói**: menu chính đúng ba mục.

| Mục | Đường dẫn theo đặc tả | Đường dẫn trong bản dựng thử | Gồm |
|---|---|---|---|
| Khẩn cấp | `/khan-cap` | `#khan-cap` | Trình hỏi 3 bước "Tôi đang gặp chuyện gì?", bốn việc không làm khi nghi ngờ, việc cần làm ngay (ba cửa vào, 9 tình huống), số cần biết |
| Công cụ & checklist | `/cong-cu-checklist` | `#cong-cu-checklist` | Trước khi chuyển tiền · Trước khi đầu tư, vay · Khi nghi ngờ bị lừa · 8 checklist · thử sức, tự luyện |
| Các rủi ro | `/cac-rui-ro/canh-bao-moi` … | `#cac-rui-ro.canh-bao-moi` … | Sáu nhóm: Cảnh báo mới (mặc định) · Lừa đảo · Vay và nợ · Đầu tư · Bảo hiểm và tiết kiệm · Dữ liệu cá nhân |

Bản dựng thử là một tệp nên dùng dấu chấm thay cho dấu gạch chéo. Ngoài ba mục, chân trang dẫn tới: Về website · Nguyên tắc nội dung · Chính sách bảo mật · Điều khoản sử dụng · Hỏi – Đáp (gửi câu hỏi riêng, không công khai) · Liên hệ đúng nơi · Cách xác minh bạn đang ở đúng trang · Góp ý · Cuộc thi (bật hoặc tắt được).

Đây là **mẫu chuẩn về giao diện và nội dung**, chưa phải hệ thống vận hành. Mọi câu chữ chuyên môn lấy nguyên văn từ bộ 08 chuyên đề, ngân hàng câu hỏi và các quy trình đã thẩm định; các trang mới chỉ **ghép lại** những nội dung đó.

## Cấu trúc tệp

| Tệp | Chứa gì | Ai sửa |
|---|---|---|
| `build/data.json` | Nội dung đã duyệt: 10 trang việc cần làm (`PB`), 8 bài đọc (`DOCS`), 10 bài đọc thêm (`ARTS`), 200 câu hỏi (`QB`), 5 chính sách (`POL`), 31 thủ đoạn (`TACTICS`) | Ban biên tập. Không sửa câu chữ nếu chưa qua thẩm định |
| `build/app.js` | Ba mục, trình hỏi, ba công cụ, checklist, danh sách có tìm và lọc, mẫu bài, mẫu cảnh báo, trắc nghiệm, biểu mẫu | Người lập trình |
| `build/app.css` | Bảng màu đặc tả, cỡ chữ, bố cục (sáng và tối, bản in A4) | Người lập trình |
| `build/shell.html` | Khung trang: dải trên cùng, đầu trang, chân trang, thanh ba mục trên điện thoại | Người lập trình |
| `build/build.py` | Ghép bốn tệp trên thành `out/index.html` (một tệp, chép lên host là chạy) | Chạy: `python3 build/build.py` |

Những bảng dữ liệu nằm trong `app.js`, Ban biên tập cần xem lại:

| Biến | Nội dung |
|---|---|
| `NAV`, `ACTIVITY` | Ba mục chính. Cuộc thi: đặt `on:false` thì lối vào tự ẩn |
| `PRINC` | Bốn việc không làm khi nghi ngờ (khối Khẩn cấp) |
| `WZCH`, `WZRQ`, `WZPR` | Ba bước của trình hỏi: kênh · họ yêu cầu gì · họ hứa hẹn, đe dọa gì. Mỗi lựa chọn gắn với một dấu hiệu phải dừng (`k:'d'`) hoặc phải hoãn (`k:'h'`) |
| `WZRULES` | Bảng ánh xạ tình huống: lựa chọn nào gợi ý thủ đoạn nào |
| `TQ`, `T3` | Câu hỏi của ba công cụ và nhánh việc cần làm của công cụ "Khi nghi ngờ bị lừa" |
| `RTABS` và các bảng `LVTAB`, `DOCTAB`, `ARTTAB`, `TACX`, `ARTX` | Sáu nhóm rủi ro và việc xếp từng bài vào nhóm |
| `CHANNELS`, `TCH` | Bảy kênh tiếp cận (danh mục cố định của Điều 15) và việc gắn kênh cho từng thủ đoạn |
| `GROUPS` | Năm nhóm đối tượng |
| `TLV` | Mức độ cần thận trọng của từng thủ đoạn |
| `BK` | Tám checklist "Trước khi…", mỗi bảng ứng với một bài đọc chuyên đề |
| `ALERTS` | Mười cảnh báo **mẫu trình bày** |
| `QA` | Bảy câu hỏi – đáp **mẫu trình bày** |
| `REVIEW` | Ngày rà soát và nguồn kiểm chứng của nội dung khẩn cấp |

## Từ đặc tả tới bản dựng

| Đặc tả | Đã làm | Điều chỉnh, và vì sao |
|---|---|---|
| Menu đúng 3 mục: Khẩn cấp, Công cụ & checklist, Các rủi ro | Đúng 3 mục trên máy tính và máy tính bảng. Trên điện thoại, cùng 3 mục nằm ở thanh dính đáy; Khẩn cấp tô cam, luôn trong tầm tay | Đề cương 1.3 (Điều 9) cho điện thoại hai nút; theo đặc tả là ba nút. Đã thử ở bề rộng 320px: không có thanh cuộn ngang |
| Trang chủ 5 khối | Khẩn cấp · Công cụ & checklist · Các rủi ro · Cảnh báo mới (tối đa 3) · chân trang | Khối Cảnh báo mới chỉ lấy mục trong 90 ngày, không có thì tự ẩn (Điều 20). Ở màn hình 360×640 thấy trọn tiêu đề và hai nút mà không cần cuộn |
| Khối Khẩn cấp: tiêu đề, mô tả, 2 nút, 4 nguyên tắc dừng | Đúng câu chữ của đặc tả | Mỗi nguyên tắc có một dòng giải thích lấy từ "Năm việc phải chặn ngay" (Bài đọc Chuyên đề 1) và bước 1 của trang "Có người đang thúc bạn làm ngay" |
| Trình hỏi 3 bước, mỗi bước một câu | Bước 1 chọn một kênh (6 kênh như đặc tả, thêm "Kênh khác, hoặc không nhớ"). Bước 2, 3 chọn nhiều dòng, có "Tôi chưa biết". Quay lại vẫn giữ lựa chọn. Không đăng nhập, không lưu | Các lựa chọn ở bước 2, 3 được viết theo sáu dấu hiệu phải dừng của Điều 14 và quy tắc từ chối cho mượn tài khoản, để kết quả tính đúng theo cây quyết định. Câu chữ các lựa chọn nằm gọn trong `WZRQ`, `WZPR`; muốn dùng đúng câu của đặc tả thì chỉ sửa hai bảng này |
| Kết quả 4 khối | Mức độ cần thận trọng · Tình huống gần giống (tối đa 3) · Dấu hiệu cần chú ý (tối đa 3) · Việc cần làm ngay (tối đa 4), thêm lối sang trang việc cần làm khi đã lỡ làm theo | Xem mục **Điều chỉnh để giữ đúng đề cương 1.3** bên dưới |
| Nút: bài chi tiết, Tải checklist PDF, Gửi cho người thân, Kiểm tra lại | Đủ bốn nút; thêm "Sửa câu trả lời" | Bản `index.html`: "Tải checklist PDF" mở hộp thoại in, chọn "Lưu thành PDF"; bản in kèm checklist bỏ túi và bốn nguyên tắc. Bản xem trên Claude không in được nên nút đổi thành "Mở checklist" |
| Câu bắt buộc "Kết quả chỉ mang tính tham khảo…" | Hiện dưới mọi kết quả: trình hỏi, ba công cụ, checklist | Kèm câu cố định của Điều 17 khoản 8 |
| Không khớp → "Cần thận trọng" + 4 nguyên tắc | Đúng như vậy | Kèm câu "không có nghĩa là an toàn" (Điều 3) |
| Công cụ 1: Trước khi chuyển tiền, 5 câu | 5 câu, mỗi lần một câu, có "Tôi chưa biết". Nhãn kết quả: Cần dừng lại · Cần kiểm tra thêm · Chưa phát hiện điểm dừng | Không có "An toàn tương đối"; không đếm số dấu hiệu (xem bên dưới) |
| Công cụ 2: Trước khi đầu tư, vay, 5 câu | 5 câu. Nhãn kết quả: Không nên tham gia · Rủi ro cao · Cần thẩm định kỹ | Trang có câu miễn trừ tư vấn và hai điều bắt buộc của Điều 18 |
| Công cụ 3: Khi nghi ngờ bị lừa, 4 câu có nhánh | 4 câu theo thứ tự của trang "Trả lời vài câu hỏi ngắn": đe dọa → quyền vào tài khoản → tiền → giấy tờ. Mỗi câu "Có" mở một nhóm việc cần làm, đánh số theo thứ tự | Bỏ "gỡ ứng dụng lạ, quét thiết bị" và "bật xác thực hai lớp" (xem bên dưới) |
| Các rủi ro: 6 nhóm, mặc định Cảnh báo mới | Đúng | — |
| Danh sách: tìm, lọc kênh, đối tượng, mức độ, ngày; thẻ có biểu tượng, tiêu đề, mô tả 1 dòng, thời gian đọc, nhãn mức độ | Đủ. Tìm chịu lỗi gõ nhẹ và từ đồng nghĩa; không có kết quả thì gợi ý nhóm khác đang có | Bộ lọc **ngày** chỉ có ở nhóm Cảnh báo mới, vì bài hướng dẫn chưa có ngày đăng thật. Khi lên hệ quản trị nội dung, bật trường ngày đăng cho mọi nhóm. Không tra theo số điện thoại, số tài khoản (Điều 4 khoản 2) |
| Mẫu trang bài viết | Đường dẫn, ngày, thời gian đọc; Nghe bài viết · Chữ lớn · In · Gửi; Tóm tắt · Dấu hiệu · Kịch bản · Việc cần làm ngay · Không nên làm · Bài liên quan · Nguồn | Mỗi phần lấy nguyên văn từ bài đọc chuyên đề tương ứng. Bấm một thủ đoạn ở danh sách thì bài mở ra và tô sáng thủ đoạn đó |
| Mẫu trang cảnh báo | Nhãn nguồn, ngày, đối tượng, kênh, kịch bản 3–5 bước, dấu hiệu, việc cần làm, bài liên quan | Thay "Mức độ phổ biến" bằng "Nguồn cảnh báo" (xem bên dưới) |
| Bảng màu, phông, cỡ chữ | Navy #123B63, Blue #0B6BCB, Yellow #FFC94D, Orange #D9531E, nền #F5F7FA; Be Vietnam Pro; chữ thân 17px trên điện thoại, 18px trên máy tính; H1 28–36px; Chữ lớn +25% | Nút cam có chữ trắng dùng sắc đậm #B8431A để đạt tương phản 4,5:1 (#D9531E chỉ đạt 4,03:1); cam gốc dùng cho viền, biểu tượng, thanh nhấn. Xanh lá không dùng cho kết quả tự kiểm tra (xem bên dưới). Có giao diện tối |
| Điểm gãy ≤767 / 768–1024 / ≥1025, khung 1200px | Đúng | — |
| Nút ≥48px, không cửa sổ bật lên, không quảng cáo tài chính, WCAG 2.1 AA | Mọi nút ≥48px, trừ liên kết nằm trong câu chữ và đường dẫn breadcrumb (44px). Không cửa sổ bật lên. Không có quảng cáo | Tiêu điểm bàn phím chuyển vào câu hỏi hoặc kết quả sau mỗi bước |
| Chia sẻ Zalo, Facebook, chép đường dẫn | Chép đường dẫn (mọi nơi). Bản `index.html` có thêm nút chia sẻ của máy (trên điện thoại hiện Zalo, Messenger…) và Facebook | Nút Zalo riêng cần bộ phát triển và mã ứng dụng của Zalo: việc của đơn vị kỹ thuật |
| Chân trang: câu cố định, 4 liên kết | Đúng câu và đúng 4 liên kết | Giữ thêm cam kết bốn không và câu về đơn vị vận hành (Điều 6). Chính sách bảo mật mở "Chính sách bảo vệ dữ liệu cá nhân"; Điều khoản sử dụng mở "Tuyên bố miễn trừ trách nhiệm"; Nguyên tắc nội dung gom ba văn bản còn lại |
| 20–30 bài, 10 cảnh báo mẫu | 24 bài (6 bài hướng dẫn theo mẫu chuẩn, 8 bài đọc chuyên đề, 10 bài đọc thêm), 31 thủ đoạn, 10 trang việc cần làm, 10 cảnh báo mẫu | Cảnh báo là mẫu trình bày, ghi rõ trên trang |
| Hệ quản trị nội dung, SEO | Ngoài phạm vi bản dựng thử một tệp | Xem mục **Dành cho đơn vị kỹ thuật** |

## Điều chỉnh để giữ đúng đề cương 1.3

Bảy chỗ trong đặc tả khác đề cương kiến trúc bản 1.3 hoặc các quy trình đã thẩm định. Bản dựng giữ **bố cục và vị trí** của đặc tả, nhưng dùng **logic và câu chữ** đã duyệt:

1. **"Mức độ cần thận trọng: Thường / Cao / Rất cao".** Ba mức gắn một-một với ba khuyến nghị của Điều 8, hiện cả hai: Rất cao = DỪNG, Cao = HOÃN VÀ KIỂM CHỨNG, và mức thấp nhất ghi **"Cần thận trọng"** (chữ của chính đặc tả cho trường hợp không khớp) = CHƯA PHÁT HIỆN ĐIỂM DỪNG. Không dùng chữ "Thường", vì dễ đọc thành "không sao".
2. **"An toàn tương đối" và màu xanh lá "An toàn".** Điều 3 cấm nhãn "an toàn". Công cụ 1 ghi "Chưa phát hiện điểm dừng", kèm câu "Kết quả này không có nghĩa giao dịch an toàn". Xanh lá chỉ dùng cho việc đã làm xong.
3. **Ngưỡng đếm: 0 dấu hiệu / 1 dấu hiệu / từ 2 dấu hiệu.** Điều 17 cấm chấm điểm bằng con số, vì người dùng sẽ coi ngưỡng thấp là an toàn. Công cụ chạy theo cây quyết định: **chỉ cần một** dấu hiệu phải dừng là kết luận ngay, không hỏi tiếp; chọn "Tôi chưa biết" ở câu dấu hiệu phải dừng thì là HOÃN, không phải DỪNG.
4. **"Có thể là [tên tình huống]".** Điều 3 khoản 1: website không kết luận loại lừa đảo thay người dùng. Khối này ghi "Tình huống gần giống", tên tình huống là tên thủ đoạn đã thẩm định, kèm câu "Đây là ví dụ để bạn đối chiếu, không phải kết luận về việc bạn đang gặp".
5. **"Mức độ phổ biến" trên trang cảnh báo.** Điều 10 cấm khẳng định "đang phổ biến" khi không có số liệu nguồn. Vị trí đó thành "Nguồn cảnh báo": cơ quan, văn bản số, ngày.
6. **"Gỡ ứng dụng lạ, quét thiết bị".** Ngược với quy trình đã thẩm định: "Đừng vội gỡ ứng dụng hoặc xóa dữ liệu trong máy. Những thứ đó có thể cần để ngân hàng và cơ quan Công an kiểm tra." Công cụ 3 dùng nguyên văn các bước của trang "Người khác đang có quyền vào tài khoản hoặc điện thoại của bạn".
7. **"Bật xác thực hai lớp".** Chưa có trong tài liệu đã thẩm định nên chưa đưa lên. Vị trí đó dùng bước "đổi mật khẩu, xem lại lịch sử giao dịch từ thiết bị tin cậy" của cùng quy trình.

Ngoài ra, câu miễn trừ tư vấn của Điều 25 nhắc "mục Rủi ro tài chính". Cấu trúc mới không còn mục mang đúng tên đó; ba nhóm Vay và nợ, Đầu tư, Bảo hiểm và tiết kiệm đang giữ vai trò ấy. Câu vẫn giữ nguyên văn; đề nghị Ban biên tập sửa đồng thời đề cương, Tuyên bố miễn trừ và trang.

**Lời khuyên chưa đưa lên**, vì chưa có trong tài liệu đã thẩm định:
- "chờ 24 giờ với các đề nghị đầu tư";
- "chỉ tải từ App Store/Google Play, kiểm tra nhà phát hành";
- "bật xác thực hai lớp";
- "gỡ ứng dụng lạ, quét thiết bị";
- các ví dụ về thuế, điện lực, Wi-Fi công cộng.

Muốn đưa lên thì phải qua vòng biên soạn và thẩm định, rồi mới thêm vào bộ chuyên đề hoặc bài viết.

## Dành cho đơn vị kỹ thuật

Bản dựng thử là **mẫu giao diện và nội dung**. Khi dựng hệ thống thật:

- **Hệ quản trị nội dung**: mỗi bài, cảnh báo, câu hỏi – đáp là một bản ghi có các trường như trong `app.js` (nhóm, kênh, đối tượng, mức độ, ngày đăng, ngày rà soát, nguồn). Chặn xuất bản khi thiếu trường bắt buộc (Điều 33).
- **Đường dẫn thật** theo đặc tả (`/khan-cap`, `/cong-cu-checklist`, `/cac-rui-ro/canh-bao-moi`…), trang dựng sẵn phía máy chủ để công cụ tìm kiếm đọc được; sơ đồ trang, thẻ mô tả, ảnh chia sẻ. Đường dẫn cũ dạng `#pb2`, `#lv7` của bản thử vẫn mở được nhờ bảng `ALIAS`.
- **PDF checklist**: sinh tệp PDF phía máy chủ từ cùng nội dung (bản thử dùng chức năng in của trình duyệt).
- **Chia sẻ Zalo**: tích hợp bộ phát triển của Zalo.
- **Nghe bài viết**: bản thử dùng giọng đọc có sẵn của máy; máy không có giọng tiếng Việt sẽ báo cho người dùng. Có thể thay bằng tệp âm thanh dựng sẵn.
- Ba biểu mẫu: xem mục dưới.

## Nối máy chủ cho ba biểu mẫu

Mặc định, cả ba biểu mẫu đều chạy ở **chế độ xem thử**: không gửi gì đi đâu. Khi đã có máy chủ, thêm dòng sau vào `out/index.html`, đặt trước thẻ script chứa mã chính:

```html
<script>window.ATTC_API = "https://ten-mien-may-chu/api";</script>
```

| Điểm nhận (POST, JSON) | Trường gửi lên | Máy chủ trả về |
|---|---|---|
| `/questions` | `text`, `wantReply`, `contact` (chỉ có khi `wantReply` đúng), `consent` (bắt buộc), `publish` (đồng ý đăng công khai, không bắt buộc) | 2xx: đã nhận |
| `/feedback` | `text`, `consent`, `prize` (`{name, phone}` hoặc `null`) | 2xx: đã nhận |
| `/registrations` | `name`, `phone` (chỉ chữ số), `org`, `consent` | 2xx: cho vào thi · **409: số đã hết 02 lượt** |

Phía giao diện đã có sẵn:
- ô bẫy chống máy tự điền;
- báo lỗi bằng lời thường khi mất mạng hoặc máy chủ lỗi, nội dung đã gõ vẫn còn nguyên;
- thông báo hết lượt thi khi máy chủ trả mã 409.

Máy chủ phải tự làm phần còn lại: đếm lượt thi, giới hạn tần suất gửi, che thông tin nhận dạng, phân quyền người duyệt.

Trình hỏi, ba công cụ và checklist **không gửi gì đi đâu** và không lưu câu trả lời. Chỉ các ô đã tích ở checklist và trang việc cần làm được lưu, và lưu trên máy người xem.

## Dấu rà soát nội dung khẩn cấp

Biến `REVIEW` giữ ngày rà soát và nguồn kiểm chứng của nội dung khẩn cấp (quy trình, các đầu số, bài hướng dẫn). Ngày ghi theo dạng `dd/mm/yyyy`. Quá 90 ngày kể từ lần rà soát gần nhất thì trang tự hiện cảnh báo. Cảnh báo mới dùng cùng quy tắc 90 ngày, tính theo ngày cập nhật của từng mục; mục quá 90 ngày chuyển xuống "Lưu trữ".

## Rà soát trước khi công khai

Năm cách phân loại: **Giữ nguyên** · **Chỉnh giao diện** · **Sửa nội dung** · **Lập trình bổ sung** · **Bắt buộc trước khi công khai**.

| # | Chức năng | Hiện trạng bản thử | Phân loại | Việc cần làm |
|---|---|---|---|---|
| 1 | Khẩn cấp: ba cửa vào, 9 tình huống, quy trình từng bước | Chạy đủ; từ trang Khẩn cấp tới dòng hành động đầu tiên tối đa hai lần bấm | Giữ nguyên · **Bắt buộc** | Thẩm định lại từng bước theo quy định còn hiệu lực; điền ngày rà soát |
| 2 | Số do Nhà nước vận hành: 113, 156, 5656 | Đã đối chiếu với báo chí 2022–2024: 156 gọi và nhắn tin miễn phí, 5656 chỉ nhắn tin, cú pháp LD / V / S | Sửa nội dung · **Bắt buộc** | Kiểm chứng theo văn bản còn hiệu lực ngay trước ngày công khai; điền nguồn và ngày |
| 3 | Trình hỏi "Tôi đang gặp chuyện gì?" | 3 bước, 4 khối kết quả; đã chạy ca DỪNG, HOÃN, CHƯA PHÁT HIỆN, "Tôi chưa biết", không khớp | Sửa nội dung · **Bắt buộc** | Ban biên tập duyệt câu chữ các lựa chọn và bảng `WZRULES`; kiểm thử với người thật |
| 4 | Ba công cụ | Đủ ba kết quả theo nhãn đặc tả; đã chạy các ca của PL7 | Giữ nguyên · **Bắt buộc** | Ban biên tập duyệt từng câu hỏi (`TQ`, `T3`) |
| 5 | 8 checklist | Nguyên văn từ 8 bài đọc; in hoặc lưu PDF được ở bản `index.html` | Giữ nguyên | Rà lại mỗi khi bài đọc đổi phiên bản |
| 6 | 6 bài hướng dẫn theo mẫu chuẩn | Ghép nguyên văn từ bài đọc theo bảy phần của đặc tả | Giữ nguyên | 15 bài thủ đoạn riêng lẻ theo Điều 16 vẫn chưa có. Thẻ thủ đoạn đang dẫn về bài theo lĩnh vực và tô sáng đúng dòng |
| 7 | Phân loại biên tập | Kênh, đối tượng, mức độ cần thận trọng của 31 thủ đoạn; nhóm rủi ro của từng bài | Sửa nội dung · **Bắt buộc** | Ban biên tập xác nhận `TCH`, `GROUPS`, `TLV`, `LVTAB`, `DOCTAB`, `ARTTAB`, `TACX`, `ARTX` |
| 8 | Cảnh báo mới | 10 mục mẫu (8 trong 90 ngày, 2 lưu trữ) | Sửa nội dung · Lập trình bổ sung · **Bắt buộc** | Thay bằng cảnh báo thật dựa trên văn bản của cơ quan nhà nước, hoặc để khối tự ẩn; quản trị đăng cảnh báo; tự gỡ khi mất nguồn hoặc quá 180 ngày |
| 9 | Hỏi – đáp nhanh | 7 câu mẫu ghép từ nội dung đã thẩm định | Sửa nội dung · **Bắt buộc** | Ban biên tập duyệt từng câu; sau đó thay dần bằng câu hỏi thật đã gộp |
| 10 | Hỏi – Đáp gửi kín | Biểu mẫu có hai ô đồng ý tách riêng; chưa gửi đi đâu | Lập trình bổ sung (**làm trước tiên**) | Cơ sở dữ liệu; bảng quản trị để phân loại, gộp, duyệt; giới hạn tần suất. Không để máy tự đăng |
| 11 | Đường dây nóng của tổ chức tín dụng | Khung trống chờ | Sửa nội dung | Chỉ đăng số chép từ nguồn Nhà nước, kèm ngày kiểm chứng |
| 12 | Nguồn kiểm chứng chính thống | 5 nhóm nguồn, chưa có đường dẫn | **Bắt buộc** | Chốt địa chỉ .gov.vn và ngày kiểm tra của từng nguồn |
| 13 | Tìm và lọc trong Các rủi ro | Chịu lỗi gõ, từ đồng nghĩa; chặn tra theo số; lọc ngày chỉ ở Cảnh báo mới | Lập trình bổ sung | Bật trường ngày đăng cho mọi bài; về sau tìm phía máy chủ |
| 14 | Tự luyện 200 câu, thử sức 8 câu | Chạy trên trình duyệt | Giữ nguyên | — |
| 15 | Cuộc thi | Đang bật để xem thử; đăng ký và đếm lượt mô phỏng trên máy | Lập trình bổ sung · **Bắt buộc** | Chốt Thể lệ, thời gian, giải, dữ liệu số điện thoại, người dưới 16 tuổi; máy chủ đếm lượt. Đề cương: giai đoạn MVP cài sẵn nhưng chưa bật |
| 16 | Góp ý có xét thưởng | Biểu mẫu, chưa gửi | Lập trình bổ sung · **Bắt buộc** | Chốt tiêu chí xét thưởng, người duyệt, khiếu nại |
| 17 | Về website, cam kết bốn không, địa chỉ duy nhất | Đủ khung; còn chỗ trong ngoặc vuông | **Bắt buộc** | Điền pháp nhân chủ quản, đầu mối liên hệ, đầu mối dữ liệu, kênh mạng xã hội chính thức |
| 18 | Chính sách bảo mật, Điều khoản sử dụng, Nguyên tắc nội dung | Bản dự thảo (năm văn bản) | **Bắt buộc** | Luật sư rà soát, chủ quản ban hành; đồng bộ với các câu hứa trên trang; cân nhắc đổi tên văn bản cho khớp tên liên kết ở chân trang |
| 19 | Câu miễn trừ tư vấn nhắc "mục Rủi ro tài chính" | Giữ nguyên văn Điều 25 | Sửa nội dung · **Bắt buộc** | Sửa đồng thời đề cương, Tuyên bố miễn trừ và trang cho khớp cấu trúc ba mục |
| 20 | Đơn vị tài trợ | Chỉ ở trang Về website và chân trang đầy đủ; chân trang rút gọn ở Khẩn cấp, công cụ, Hỏi – Đáp, Hoạt động | **Bắt buộc** | Chỉ hiện khi Chính sách tài trợ đã ban hành |
| 21 | Bảo mật, dữ liệu phía máy chủ | Chưa có | Lập trình bổ sung · **Bắt buộc** | HTTPS; phân quyền; bảo vệ dữ liệu; sao lưu; xóa theo thời hạn; nhật ký quản trị |
| 22 | Kiểm thử | Đã thử tự động mọi trang ở bề rộng 320–1440px, sáng và tối, chữ lớn, 97 ca tương tác trên cả hai bản | **Bắt buộc** | Thử với người cao tuổi, công nhân, tiểu thương trên máy 360×640; kiểm thử trình đọc màn hình; kiểm thử bảo mật độc lập |
| 23 | Thẻ noindex; dải "BẢN DỰNG THỬ" | Đang bật | **Bắt buộc** | Gỡ khi nội dung đã duyệt; đổi dải thành "Địa chỉ duy nhất: antoantaichinh.vn", giữ nút Chữ lớn |
| 24 | Nhận tiền ủng hộ | Không có | Không làm | Website không thu bất kỳ khoản tiền nào (cam kết bốn không) |

**Thứ tự đề nghị:**
1. Nội dung khẩn cấp và công cụ: mục 1, 2, 3, 4, 7.
2. Cảnh báo thật và hỏi – đáp đã duyệt: mục 8, 9, 12.
3. Danh tính và chính sách: mục 17, 18, 19, 20.
4. Máy chủ cho Hỏi – Đáp: mục 10, 21.
5. Hoạt động: mục 15, 16.
6. Kiểm thử, rồi mới gỡ noindex và quảng bá: mục 22, 23.
