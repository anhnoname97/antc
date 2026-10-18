# Bố cục trang Cuộc thi

Trang `/cuoc-thi/` giữ document `thiPage`, key `88abf9ef-fb93-45c5-9cff-4aa76ca6f250`, trong cây trang hiện tại. Nội dung tham chiếu từ phần `nj-cuoc-thi` của `an-toan-tai-chinh-website.html`.

Tab **Bố cục** sử dụng editor **Bố cục cuộc thi · Block Grid** riêng, không thay đổi các trang khác. Sau khi import uSync, trang có sáu khối theo thứ tự:

| Khối | Nội dung |
| --- | --- |
| Khối cuộc thi — Hero | Nhãn Phần 4, tiêu đề, mô tả, hai nút đến Tổng quan và Thử sức |
| Khối tổng quan cuộc thi | Giới thiệu, ba thống kê, thẻ dự thi, chuyên đề và cam kết |
| Khối làm thử câu hỏi | Giới thiệu, 8 câu qua `/api/v1/quiz/sample`, kết quả và lời mời |
| Khối góp ý cho chương trình | Giới thiệu, form góp ý theo FE-22 và xác nhận sau khi API trả thành công |
| Khối chia sẻ cho người thân | Giới thiệu, địa chỉ hiển thị và nút chia sẻ trang chủ |
| Khối điều hướng phần tiếp theo | Liên kết Hỏi – Đáp và nút Ứng phó |

Hai khối Góp ý/Chia sẻ chiếm 6/12 cột trên máy tính, xuống một cột trên điện thoại. Những khối còn lại chiếm 12 cột. Chọn từng khối để sửa nội dung, kéo thả để sắp xếp, hoặc thêm/xóa khối bằng Block Grid.

Các số 200 câu, 8 chuyên đề, 2 lượt và tháng/chuyên đề trên thẻ là **nội dung hiển thị** từ bản mẫu, không phải cấu hình nghiệp vụ. Khi có màn thi tháng, cập nhật **Liên kết thẻ dự thi** và **Nút mời tham gia**; dữ liệu mẫu hiện dẫn tới `/thu-suc/` để tránh đường dẫn chưa tồn tại.

Khác file tham chiếu: khối Thử sức dùng đủ 8 câu từ API thay cho 3 câu JavaScript minh họa; ghi chú được cập nhật tương ứng. Góp ý gửi `POST /api/v1/questions` với `type: "gop-y"`; chỉ xác nhận sau phản hồi `201 {"ok":true}`. Nút chia sẻ dùng bảng chia sẻ hệ điều hành hoặc clipboard.

uSync Development đã cấu hình `ImportAtStartup: All`. Khởi động lại ứng dụng để nhập schema và dữ liệu, hoặc import qua dashboard uSync. Trang Cuộc thi được xuất ở trạng thái published để URL `/cuoc-thi/` và mục Cuộc thi trong menu hoạt động. Header/footer và SEO dùng chung được giữ nguyên.

## Tương thích cơ sở dữ liệu cũ

Composition `seoBase` dùng alias nhóm `antcSeo` (tên hiển thị vẫn là SEO). Alias này tránh xung đột với nhóm `seo`/`sEO` kiểu Group trong database cũ. Key của composition, key nhóm và alias các trường SEO được giữ nguyên; uSync cập nhật qua quy trình import bình thường, không cần sửa SQL hay reset database.

Nếu schema chưa được đồng bộ, template đọc `layout` dưới dạng `BlockGridModel` trước khi render để tránh lỗi `No property type found with alias layout`. Cần import uSync thành công để tab Bố cục và sáu block hiện đầy đủ.

Bản sửa đã được kiểm tra bằng bản sao mới của database local, không chuẩn hóa SQL trước: import không còn lỗi, `/cuoc-thi/` trả HTTP 200 và làm bài được qua API thật.

## Alias theo danh sách thống nhất

| Tên hiển thị | Alias chính xác |
| --- | --- |
| Cuộc thi — Hero | `competitionHeroBlock` |
| Tổng quan cuộc thi | `competitionOverviewBlock` |
| Làm thử câu hỏi | `practiceQuizBlock` |
| Câu hỏi làm thử | `practiceQuestionBlock` |
| Đáp án làm thử | `practiceAnswerBlock` |
| Góp ý cho chương trình | `competitionFeedbackBlock` |
| Chia sẻ cho người thân | `shareWebsiteBlock` |

Giữ nguyên key của cả bảy Element Type. `practiceQuestionBlock` và `practiceAnswerBlock` đã tồn tại trong schema; luồng Thử sức hiện render câu hỏi/đáp án từ API, không nhập lại ngân hàng câu hỏi vào CMS. `nextSectionBlock` là khối điều hướng bổ sung ở cuối trang, tách khỏi bảy khối trên.

## URL và giao diện trang Cuộc thi

Trang chính là **`/cuoc-thi/`**, template `thiPage`. Mục **Cuộc thi** trong menu đầu trang/chân trang trỏ đến document `88abf9ef-fb93-45c5-9cff-4aa76ca6f250`, không trỏ đến `/tham-gia/`. `/tham-gia/` vẫn là trang Tham gia riêng.

Trang Cuộc thi dùng header trong suốt phủ trên hero xanh đậm, dải thông báo tháng/chuyên đề/thời gian lấy từ block Tổng quan, logo và menu vẫn đọc cấu hình CMS dùng chung. Header chuyển nền sáng khi cuộn, có menu điện thoại và nút chữ to. Các trang khác giữ khung dùng chung hiện tại.

## Hiệu ứng Hero

`competitionHeroBlock` dùng `contest-hero.js` với GSAP/ScrollTrigger tự host, theo phần `cuoc-thi` nhúng trong file HTML tham chiếu. Tiêu đề trượt lên theo dòng, nền và trống đồng phóng/hiện nhẹ, breadcrumb/nhãn/mô tả/nút hiện lần lượt, số 04 dịch chuyển theo cuộn. Trống đồng quay một vòng trong 180 giây trên màn hình từ 760px nếu không bật tiết kiệm dữ liệu.

Hiệu ứng chỉ áp dụng trong Hero. Khi bật giảm chuyển động, chuyển động được bỏ và nội dung vẫn hiện đầy đủ; nếu JavaScript hoặc GSAP không tải được, nội dung vẫn hiển thị. Khi focus bằng bàn phím trong Hero, phần mở đầu hoàn tất ngay để nút luôn thấy được.

## Hiệu ứng Tổng quan

`competitionOverviewBlock` dùng `contest-overview.js`: phần giới thiệu hiện dần từ dưới lên; thống kê đếm theo vị trí cuộn đến giá trị CMS; thẻ dự thi chuyển từ nghiêng 4 độ/dịch xuống 60px về thẳng; các cam kết xuất hiện lần lượt từ bên trái. Họa tiết trống đồng trong thẻ quay chậm trên desktop, tương tự Hero. Các chuyển động đảo theo cuộn như file HTML.

Khi bật giảm chuyển động, các style hiệu ứng được gỡ và số thống kê khôi phục đúng giá trị CMS. Nếu JavaScript hoặc ScrollTrigger không tải, nội dung và số cuối vẫn hiện bình thường.

Thẻ dự thi giữ hai nhịp riêng như HTML gốc: độ mờ/hiện ở `top 94% → top 70%`, độ nghiêng/đi lên ở `top 95% → top 55%`, cùng `scrub: 0.6`. Các ScrollTrigger được sort rồi refresh sau khi tạo và khi font tải xong. Đã đối chiếu trực tiếp độ mờ, góc nghiêng, vị trí và từng dòng cam kết với HTML nhúng gốc tại bảy mốc cuộn tiến/ngược.

## Hiệu ứng Góp ý / Chia sẻ và Hỏi đáp

`contest-community.js` giữ nhịp từ HTML: hai thẻ Góp ý/Chia sẻ đi lên 50px, phóng từ 96% lên 100%, xuất hiện lệch nhau 0,15 giây trong dải cuộn 90% → 50%. Do CMS lưu hai thẻ thành hai grid item riêng, điểm bắt đầu lấy theo mép nội dung của section đầu, tương đương `.duo` ở mẫu. Các vòng tròn gia đình phóng từ 40% với `back.out(2)` và stagger 0,1 giây.

Ở khối Hỏi đáp, nhãn/tiêu đề/mô tả/nút đi lên 30px với stagger 0,1 giây trong dải cuộn 85% → 50%; họa tiết nền xoay chậm trên desktop. Mũi tên được tách thành span để dịch sang phải khi hover như mẫu. Giảm chuyển động hoặc thiếu JavaScript/plugin vẫn hiển thị đầy đủ nội dung.

Mốc cuộn phải được cập nhật sau nội dung bất đồng bộ: `ResizeObserver` theo dõi chiều cao trang, gộp cập nhật vào `requestAnimationFrame` rồi sort/refresh ScrollTrigger. Việc này giữ mốc thẻ đúng sau khi API câu hỏi tải xong, chọn đáp án, chuyển câu, xem kết quả/làm lại và resize textarea; cũng theo dõi lại khi khôi phục trang từ bfcache. Đã kiểm tra trực tiếp điểm bắt đầu so với vị trí thực trong viewport với API chậm, thay vì chỉ so tiến độ chuẩn hóa của animation.

## FE-22 — form góp ý trong trang Cuộc thi

`contest-feedback.js` nối form của `competitionFeedbackBlock` với API-06 `POST /api/v1/questions`. JSON gồm `type: "gop-y"`, `content`, `wantReply`, `contact`, `consent`, `website`. Giữ form gọn gồm textarea và nút gửi, không đưa bộ đếm, checkbox nhận trả lời hay form liên hệ của Hỏi–Đáp vào đây. Nội dung 10–2000 ký tự; gửi ẩn danh với `wantReply: false`, `contact: ""`. Payload hiện gửi `consent: true` theo hợp đồng API; form gọn không hiển thị trường đồng ý. `website` là honeypot không hiện và không nằm trong thứ tự Tab.

Đang gửi: khóa nút, nhãn “Đang gửi…”, ngăn submit lặp. Chỉ `201` kèm `ok: true` mới thay form bằng xác nhận có focus, nút gửi góp ý khác. `400 VALIDATION` hiển thị lỗi trường bằng text, `429` báo “Bạn gửi hơi nhanh. Thử lại sau ít phút.”; các lỗi khác, lỗi mạng và timeout 20 giây giữ bản nháp để thử lại. Nội dung/liên hệ không lưu vào localStorage.

Phạm vi lượt này là frontend của form trên trang Cuộc thi, chưa làm form đầy đủ của trang Hỏi–Đáp. Backend `POST /api/v1/questions` đã bổ sung trong `QuestionsController`, lưu bảng `question_submission` qua `QuestionSubmissionService`. Có validation, honeypot không lưu bản ghi và giới hạn 5 lần/giờ/IP bằng transaction SQLite để đếm và ghi nguyên tử. Chỉ lưu hash IP có salt; không đổi schema dữ liệu. Đã kiểm thử lưu góp ý, giới hạn, honeypot và dữ liệu không hợp lệ bằng SQLite tạm. Chưa triển khai màn quản trị `/quan-tri/hoi-dap`.


## Tổng quan lấy cuộc thi đang diễn ra từ DB

`competitionOverviewBlock.cshtml` inject `ICurrentContestService`, đọc trực tiếp `contest_campaign` cùng danh sách chuyên đề/câu hỏi đã chọn; không gọi HTTP/controller. Điều kiện: `IsActive`, `StartAt <= UTC now <= EndAt`. Khi trùng lịch, ưu tiên StartAt mới nhất rồi Id lớn nhất. Số câu hỏi/chuyên đề đếm theo cấu hình cuộc thi, số lượt lấy MaxAttempts. Thẻ hiển thị tên, mô tả, khoảng ngày theo giờ Việt Nam và các chuyên đề của cùng cuộc thi. Link vào thi tiếp tục dùng entryLink trong CMS. Khi không có cuộc thi phù hợp, hiển thị trạng thái chưa mở, không dùng lại số liệu CMS cũ. Nhãn, lời cam kết và hiệu ứng hiện có vẫn dùng CMS.
