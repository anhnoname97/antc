# Đánh cắp phiên đăng nhập (cookie) để chiếm tài khoản đang mở: nhận diện và phòng tránh

Chuyên mục: Kiến thức phòng tránh | Cập nhật: 11/2026

> **Ghi nhớ:** Kẻ gian có thể vào tài khoản của bạn mà không cần mật khẩu hay mã OTP, nếu lấy được "phiên đăng nhập" đang lưu trong trình duyệt. **Khuyến nghị của website:** không cài phần mềm bẻ khóa, tiện ích trình duyệt lạ; khi nghi bị lộ, đăng xuất khỏi mọi thiết bị từ một thiết bị an toàn rồi đổi mật khẩu.

---

## Thủ đoạn này là gì?

Khi bạn đăng nhập một trang web hay dịch vụ trực tuyến, trình duyệt lưu lại một đoạn dữ liệu nhỏ gọi là **cookie phiên đăng nhập**, để lần sau không phải nhập lại mật khẩu. Theo cơ quan Công an, nếu kẻ gian lấy được cookie này, chúng có thể truy cập tài khoản **mà không cần mật khẩu hay mã OTP**, rồi mạo danh chủ tài khoản, nhắn tin vay tiền người quen, lừa đảo, đánh cắp dữ liệu.

Theo cơ quan Công an, cookie thường bị lấy cắp qua các con đường: đường dẫn đăng nhập giả mạo; tệp, ứng dụng, tiện ích trình duyệt không rõ nguồn gốc; phần mềm bẻ khóa, công cụ tạo mã kích hoạt. Các phần mềm này chứa **mã độc đánh cắp thông tin** (infostealer), lấy cookie, mật khẩu đã lưu và dữ liệu tự điền trong trình duyệt.

Theo cơ quan quản lý an toàn thông tin, đã ghi nhận một dòng mã độc đánh cắp thông tin nhắm vào người dùng trong nước, lây qua thư điện tử giả mạo hóa đơn kèm tệp nén, rồi gửi dữ liệu đánh cắp ra ngoài qua một ứng dụng nhắn tin. Theo một số nghiên cứu ở nước ngoài, kẻ gian còn dùng trí tuệ nhân tạo để phân tích dữ liệu đánh cắp, lập hồ sơ nạn nhân phục vụ lừa đảo tiếp theo (cảnh báo ở nước ngoài).

## Vì sao cookie bị đánh cắp lại nguy hiểm?

Bảng dưới đây là cách website giải thích sự khác biệt giữa các loại thông tin bị lộ.

| Thông tin bị lộ | Kẻ gian cần thêm gì | Lớp bảo vệ còn tác dụng |
|---|---|---|
| Chỉ mật khẩu | Mã OTP hoặc xác thực hai lớp | Xác thực hai lớp chặn được |
| Mật khẩu và mã OTP | Thường không cần thêm | Cảnh báo đăng nhập mới, nếu chủ tài khoản để ý |
| Cookie phiên đăng nhập còn hiệu lực | Không cần mật khẩu, không cần OTP | Chỉ còn việc đăng xuất phiên, hết hạn phiên |

**Theo nhận định của website:** đây là lý do một người đã bật xác thực hai lớp vẫn có thể mất tài khoản. Xác thực hai lớp bảo vệ **lúc đăng nhập**; cookie bị đánh cắp là thứ có được **sau khi** đã đăng nhập.

## Mã độc đánh cắp thông tin đến từ đâu?

Theo cơ quan Công an và cơ quan quản lý an toàn thông tin, những nguồn thường gặp gồm:

- **Phần mềm bẻ khóa, công cụ tạo mã kích hoạt**, bản cài đặt trò chơi, phần mềm đồ họa "miễn phí" trôi nổi.
- **Tiện ích mở rộng trình duyệt** không rõ nguồn gốc, quảng cáo "tải video", "đổi giao diện", "chặn quảng cáo".
- **Tệp đính kèm** giả hóa đơn, hợp đồng, hồ sơ, thường nằm trong tệp nén.
- **Trang đăng nhập giả**, đường dẫn "xác minh tài khoản", "kháng nghị vi phạm".

## Sáu dấu hiệu nhận biết

Đây là phần kiểm tra do website tổng hợp từ cảnh báo của cơ quan Công an. Một dấu hiệu đã đủ để kiểm tra các phiên đăng nhập.

- **Có phiên đăng nhập lạ** trong mục quản lý thiết bị, vị trí đăng nhập, dù bạn không nhận mã OTP nào.
- **Tài khoản tự đăng bài, nhắn tin** cho bạn bè, nhất là tin vay tiền, gửi đường dẫn.
- **Mật khẩu, thư điện tử, số điện thoại khôi phục bị thay đổi** mà bạn không làm.
- **Trang quản lý quảng cáo, thanh toán** xuất hiện chi tiêu lạ.
- **Trình duyệt có tiện ích lạ**, trang chủ bị đổi, quảng cáo bật lên liên tục.
- **Vừa cài phần mềm bẻ khóa** hoặc mở tệp nén lạ trước khi xảy ra sự việc.

## Tình huống minh họa

Đây là tình huống giả định do website xây dựng, không mô tả một vụ việc hay một người có thật.

Một sinh viên thiết kế tải bản bẻ khóa của một phần mềm đồ họa để làm đồ án. Vài ngày sau, bạn bè báo tài khoản mạng xã hội của em đang nhắn tin hỏi vay tiền. Em bật xác thực hai lớp từ lâu và không nhận mã OTP lạ nào, nên rất ngạc nhiên.

Em dùng điện thoại, vào mục quản lý thiết bị, thấy một phiên đăng nhập lạ và chọn đăng xuất khỏi tất cả thiết bị, rồi đổi mật khẩu, kiểm tra thư điện tử khôi phục. Em đăng thông báo cho bạn bè và nhờ người có chuyên môn gỡ phần mềm bẻ khóa, quét lại máy tính. Từ đó em chỉ dùng phần mềm có bản quyền hoặc phần mềm miễn phí chính thống.

> **Bài học do website rút ra:** Phần mềm "miễn phí" trôi nổi có thể phải trả bằng toàn bộ tài khoản trực tuyến. Xác thực hai lớp rất cần, nhưng không thay được việc giữ cho máy tính sạch.

## Phòng ngừa và cách xử lý

### Với từng người

Theo cơ quan Công an, chỉ tải phần mềm, ứng dụng, tiện ích từ nguồn chính thức; cập nhật trình duyệt, hệ điều hành; dùng mật khẩu riêng cho từng tài khoản và bật xác thực hai lớp; không bấm đường dẫn, không mở tệp lạ.

**Khuyến nghị của website:**

- Định kỳ xem lại danh sách tiện ích trình duyệt, gỡ những tiện ích không dùng hoặc không rõ nguồn.
- Đăng xuất khi dùng máy tính công cộng, máy dùng chung; không chọn "ghi nhớ đăng nhập" trên các máy đó.
- Kiểm tra mục quản lý thiết bị, phiên đăng nhập của các tài khoản quan trọng mỗi tháng một lần.

### Với gia đình

**Khuyến nghị của website:** nhắc con em không tải trò chơi, phần mềm bẻ khóa trên máy tính gia đình, nhất là máy có đăng nhập ngân hàng, thư điện tử của bố mẹ.

### Với cơ quan, doanh nghiệp

**Khuyến nghị của website:** cấm cài phần mềm bẻ khóa trên máy công việc, quản lý danh sách tiện ích trình duyệt được phép, rút ngắn thời hạn phiên đăng nhập của hệ thống nội bộ; tài khoản quản trị trang, quảng cáo của doanh nghiệp cần dùng máy riêng, sạch.

### Nếu nghi tài khoản bị chiếm phiên

Theo cơ quan Công an, kết hợp **khuyến nghị của website**:

1. **Dùng một thiết bị an toàn** để đăng xuất khỏi tất cả các phiên, tất cả thiết bị.
2. **Đổi mật khẩu**, kiểm tra và khôi phục thư điện tử, số điện thoại khôi phục, bật lại xác thực hai lớp.
3. **Chụp lại bằng chứng rồi mới gỡ phần mềm, tiện ích lạ** trên thiết bị nghi nhiễm; nhờ người có chuyên môn kiểm tra, cài lại hệ điều hành nếu cần.
4. **Thông báo cho bạn bè, người thân** không làm theo tin nhắn từ tài khoản của bạn trong thời gian này.
5. **Liên hệ ngân hàng** nếu có giao dịch lạ; **lưu bằng chứng và trình báo cơ quan Công an** khi có thiệt hại.

## Quy định pháp luật liên quan

- **Điều 289 Bộ luật Hình sự (tội xâm nhập trái phép vào mạng máy tính, mạng viễn thông hoặc phương tiện điện tử của người khác):** áp dụng với hành vi xâm nhập trái phép, sử dụng quyền quản trị của người khác, lấy cắp dữ liệu hoặc sử dụng trái phép các dịch vụ.
- **Điều 290 Bộ luật Hình sự (tội sử dụng mạng máy tính, mạng viễn thông, phương tiện điện tử thực hiện hành vi chiếm đoạt tài sản):** áp dụng khi tài khoản bị chiếm được dùng để chiếm đoạt tài sản, nếu đủ yếu tố cấu thành tội phạm.
- **Điều 286 Bộ luật Hình sự (tội phát tán chương trình tin học gây hại cho hoạt động của mạng máy tính, mạng viễn thông, phương tiện điện tử):** có thể liên quan đến hành vi phát tán mã độc đánh cắp thông tin.
- **Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 (hiệu lực từ ngày 01/01/2026):** theo nội dung đăng trên Cổng thông tin điện tử Bộ Công an, luật nghiêm cấm xử lý dữ liệu cá nhân trái quy định, sử dụng dữ liệu cá nhân của người khác để thực hiện hành vi trái pháp luật, mua bán dữ liệu cá nhân trừ trường hợp luật có quy định khác.

Phần này chỉ nhằm phổ biến kiến thức pháp luật; việc định tội danh và hình phạt trong từng vụ việc do cơ quan tiến hành tố tụng có thẩm quyền quyết định.

## Tóm tắt để ghi nhớ

Khuyến nghị của website:

> **3 KHÔNG – 2 PHẢI**
> - **KHÔNG** cài phần mềm bẻ khóa, công cụ tạo mã kích hoạt.
> - **KHÔNG** cài tiện ích trình duyệt không rõ nguồn gốc.
> - **KHÔNG** đăng nhập qua đường dẫn nhận được trong tin nhắn, thư điện tử.
> - **PHẢI** định kỳ kiểm tra và đăng xuất các phiên đăng nhập lạ.
> - **PHẢI** đăng xuất mọi thiết bị, đổi mật khẩu từ thiết bị an toàn khi nghi bị lộ.

---

**Ghi chú biên tập**

Bài viết do website tự biên soạn nhằm mục đích tuyên truyền, phòng ngừa, dựa trên các cảnh báo công khai của cơ quan chức năng và quy định pháp luật được đối chiếu tại thời điểm biên tập. Tình huống minh họa là tình huống giả định, không phản ánh một vụ việc hay cá nhân cụ thể. Website không phải cơ quan nhà nước và không tiếp nhận tố giác tội phạm; người dân cần trình báo trực tiếp với cơ quan Công an. Nếu phát hiện thông tin chưa chính xác, vui lòng liên hệ qua địa chỉ ghi tại chân trang để được xem xét, đính chính.
