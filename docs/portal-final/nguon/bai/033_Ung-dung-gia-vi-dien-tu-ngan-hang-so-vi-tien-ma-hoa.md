# Ứng dụng giả ví điện tử, ngân hàng số, ví tiền mã hóa chứa mã độc: nhận diện và phòng tránh

Chuyên mục: Kiến thức phòng tránh | Cập nhật: 11/2026

> **Ghi nhớ:** Ứng dụng tài chính thật chỉ được tải từ kho ứng dụng chính thức của điện thoại, không qua đường dẫn, tệp cài đặt hay mã QR người khác gửi. **Khuyến nghị của website:** ứng dụng nào đòi quyền trợ năng, quyền đọc tin nhắn, hoặc đòi bạn nhập cụm từ khôi phục ví, hãy dừng lại ngay.

---

## Thủ đoạn này là gì?

Theo cơ quan Công an, các đối tượng tạo ứng dụng giả mạo có tên, biểu tượng gần giống ứng dụng ngân hàng, ví điện tử, ứng dụng dịch vụ công, thuế, bảo hiểm, rồi dụ người dân tải về qua đường dẫn, tệp cài đặt hoặc mã QR. Sau khi được cài và cấp quyền, ứng dụng có thể kiểm soát điện thoại, lấy thông tin đăng nhập, đọc mã OTP, chiếm tài khoản ngân hàng, chứng khoán và chuyển tiền đi.

Theo cơ quan Công an, ứng dụng giả thường được giới thiệu trong các cuộc gọi giả danh cán bộ nhà nước, nhân viên ngân hàng, với lý do "cập nhật thông tin", "đồng bộ dữ liệu", "nhận hỗ trợ". Ngành ngân hàng cũng cảnh báo trường hợp dụ người dân quét khuôn mặt hoặc cài ứng dụng giả để vượt qua lớp xác thực sinh trắc học khi giao dịch.

Với **ví tiền mã hóa**, ứng dụng hoặc tiện ích trình duyệt giả thường đòi người dùng nhập **cụm từ khôi phục** (dãy từ bí mật dùng để khôi phục ví). Theo nhận định của website, ai có cụm từ này có thể chuyển toàn bộ tài sản trong ví đi, và giao dịch tiền mã hóa gần như không thể đảo ngược.

Bài này tập trung vào **ứng dụng giả**. Tệp cài đặt độc hại gửi qua thư, tin nhắn được trình bày ở bài "Tệp đính kèm độc hại, macro, tệp cài đặt giả"; việc dùng phần mềm điều khiển từ xa ở bài "Phần mềm điều khiển từ xa, chia sẻ màn hình để chiếm tài khoản".

## Các dạng ứng dụng giả thường gặp

Bảng dưới đây là cách website hệ thống hóa cảnh báo của cơ quan Công an và ngành ngân hàng.

| Ứng dụng giả | Lý do được đưa ra để cài | Hậu quả |
|---|---|---|
| Ngân hàng số, ví điện tử | "Cập nhật phiên bản mới", "xác thực sinh trắc học", "nhận hoàn tiền" | Lộ mật khẩu, mã OTP; bị chuyển tiền đi |
| Dịch vụ công, thuế, bảo hiểm | "Đồng bộ dữ liệu", "quyết toán thuế", "hoàn tiền bảo hiểm" | Bị chiếm quyền điện thoại, lấy dữ liệu cá nhân, chiếm tài khoản ngân hàng |
| Ví tiền mã hóa, tiện ích trình duyệt ví | Quảng cáo, kết quả tìm kiếm, "nhận quà tặng token" | Lộ cụm từ khôi phục, mất toàn bộ tài sản trong ví |
| Ứng dụng đầu tư, vay tiền | Lời mời lợi nhuận cao, giải ngân nhanh | Mất tiền nạp, lộ danh bạ, bị đòi nợ, bôi nhọ |
| Ứng dụng "giả nhân viên ngân hàng dùng để quét mặt" | Mời quét khuôn mặt nhận quà ở nơi công cộng | Dữ liệu khuôn mặt bị dùng để giao dịch trên thiết bị khác |

## Ứng dụng giả hoạt động thế nào?

Theo cơ quan Công an, sau khi cài, ứng dụng giả thường yêu cầu bật **quyền trợ năng** (một quyền vốn dành cho người khuyết tật, cho phép ứng dụng đọc và thao tác trên màn hình). Khi quyền này được bật, mã độc có thể chạy ngầm, theo dõi thao tác, ghi lại mật khẩu ngân hàng số, tự đọc và vô hiệu hóa tin nhắn chứa mã OTP, rồi thực hiện giao dịch mà chủ máy không hay biết.

**Theo nhận định của website:** dấu hiệu chung của ứng dụng giả là chúng **xin nhiều quyền hơn chức năng cần**. Một ứng dụng ngân hàng thật không cần quyền điều khiển toàn bộ màn hình; một ứng dụng ví thật không bao giờ đòi bạn gửi cụm từ khôi phục cho "bộ phận hỗ trợ".

## Sáu dấu hiệu nhận biết

Đây là phần kiểm tra do website tổng hợp từ cảnh báo của cơ quan Công an và ngành ngân hàng. Một dấu hiệu đã đủ để không cài.

- **Ứng dụng được gửi qua đường dẫn, tệp cài đặt, mã QR**, không có trên kho ứng dụng chính thức.
- **Điện thoại cảnh báo** "ứng dụng từ nguồn không xác định" và bạn được hướng dẫn tắt cảnh báo.
- **Ứng dụng đòi quyền trợ năng, quyền đọc tin nhắn, quyền hiển thị trên ứng dụng khác.**
- **Tên, biểu tượng gần giống** ứng dụng thật, nhà phát triển lạ, ít lượt tải, đánh giá bất thường.
- **Ứng dụng ví đòi nhập cụm từ khôi phục** ngay khi mở, hoặc "bộ phận hỗ trợ" đòi bạn gửi cụm từ này.
- **Người gọi hướng dẫn cài ứng dụng** trong khi vẫn giữ máy, thúc giục làm nhanh.

## Tình huống minh họa

Đây là tình huống giả định do website xây dựng, không mô tả một vụ việc hay một người có thật.

Một nữ kế toán nhận cuộc gọi từ người tự xưng nhân viên ngân hàng, báo ứng dụng ngân hàng của chị "đã hết hạn hỗ trợ" và gửi qua tin nhắn một tệp cài đặt "phiên bản mới". Cài xong, ứng dụng hiện màn hình giống hệt ứng dụng ngân hàng và yêu cầu bật quyền trợ năng "để xác thực khuôn mặt".

Chị thấy lạ vì ứng dụng cũ vẫn dùng bình thường, và ứng dụng thật chưa bao giờ xin quyền này. Chị không bật quyền, tắt mạng, dùng máy khác gọi tổng đài in trên thẻ, rồi chụp lại tên ứng dụng làm bằng chứng trước khi gỡ. Tổng đài viên xác nhận ngân hàng không gửi tệp cài đặt cho khách và hướng dẫn chị đổi mật khẩu từ ứng dụng chính thức.

> **Bài học do website rút ra:** Ứng dụng ngân hàng cập nhật qua kho ứng dụng, không qua tin nhắn. Quyền trợ năng là "chìa khóa vạn năng" của điện thoại, đừng trao nó cho ứng dụng tài chính lạ.

## Phòng ngừa và cách xử lý

### Với từng người

Theo cơ quan Công an và ngành ngân hàng, chỉ tải ứng dụng từ kho ứng dụng chính thức; không cài ứng dụng qua đường dẫn, tệp lạ; không cấp quyền trợ năng, không cung cấp mã OTP, mật khẩu, dữ liệu khuôn mặt hoặc chuyển tiền theo yêu cầu chưa xác minh; không quét khuôn mặt "nhận quà" cho người lạ; chủ động gọi số tổng đài hoặc đến cơ quan, quầy giao dịch để kiểm chứng.

**Khuyến nghị của website:**

- Giữ cài đặt chặn cài ứng dụng từ nguồn không xác định trên điện thoại.
- Với ví tiền mã hóa: chỉ tải từ trang hoặc kho chính thức của nhà phát triển; viết cụm từ khôi phục ra giấy, cất nơi an toàn, không chụp ảnh, không lưu trên mạng, không gửi cho ai.
- Định kỳ xem lại danh sách ứng dụng được cấp quyền trợ năng và gỡ quyền của ứng dụng lạ.

### Với gia đình

**Khuyến nghị của website:** người lớn tuổi thường được nhắm tới bằng lý do "cập nhật ứng dụng ngân hàng", "đồng bộ bảo hiểm". Hãy cài sẵn ứng dụng chính thức cho họ, khóa cài đặt từ nguồn lạ, và dặn: ai bảo cài ứng dụng qua tin nhắn thì gọi con cháu trước.

### Với cơ quan, doanh nghiệp

**Khuyến nghị của website:** doanh nghiệp quản lý điện thoại công việc nên áp dụng chính sách chỉ cho phép cài ứng dụng từ kho chính thức, và nhắc nhân viên kế toán, thủ quỹ về thủ đoạn "cập nhật ứng dụng ngân hàng".

### Nếu đã cài ứng dụng giả

Các bước dưới đây là **khuyến nghị của website**, kết hợp khuyến cáo của cơ quan Công an và ngành ngân hàng.

1. **Ngắt kết nối mạng** (tắt dữ liệu di động, wifi) ngay.
2. **Dùng thiết bị khác gọi tổng đài chính thức của ngân hàng** để khóa tài khoản, ngân hàng điện tử, thẻ.
3. **Chụp lại bằng chứng rồi mới gỡ ứng dụng giả**, thu hồi các quyền đã cấp; nếu không gỡ được, nhờ nơi sửa chữa do bạn tự chọn, hoặc khôi phục cài đặt gốc sau khi đã lưu bằng chứng và sao lưu dữ liệu cần thiết.
4. **Với ví tiền mã hóa đã lộ cụm từ khôi phục:** coi ví đó là không còn an toàn; tạo ví mới trên thiết bị sạch và chuyển tài sản còn lại (nếu còn) sang ví mới càng sớm càng tốt.
5. **Đổi mật khẩu** các tài khoản quan trọng từ thiết bị an toàn; **lưu bằng chứng và trình báo cơ quan Công an.**

## Quy định pháp luật liên quan

- **Điều 286 Bộ luật Hình sự (tội phát tán chương trình tin học gây hại cho hoạt động của mạng máy tính, mạng viễn thông, phương tiện điện tử):** áp dụng với người cố ý phát tán chương trình tin học gây hại thuộc các trường hợp luật quy định.
- **Điều 289 Bộ luật Hình sự (tội xâm nhập trái phép vào mạng máy tính, mạng viễn thông hoặc phương tiện điện tử của người khác):** luật quy định hành vi xâm nhập trái phép vào phương tiện điện tử của người khác chiếm quyền điều khiển; can thiệp vào chức năng hoạt động của phương tiện điện tử; lấy cắp, thay đổi, hủy hoại, làm giả dữ liệu.
- **Điều 290 Bộ luật Hình sự (tội sử dụng mạng máy tính, mạng viễn thông, phương tiện điện tử thực hiện hành vi chiếm đoạt tài sản)** và **Điều 174 Bộ luật Hình sự (tội lừa đảo chiếm đoạt tài sản):** áp dụng khi ứng dụng giả được dùng để chiếm đoạt tài sản, tùy hành vi cụ thể và nếu đủ yếu tố cấu thành tội phạm.

Phần này chỉ nhằm phổ biến kiến thức pháp luật; việc định tội danh và hình phạt trong từng vụ việc do cơ quan tiến hành tố tụng có thẩm quyền quyết định.

## Tóm tắt để ghi nhớ

Khuyến nghị của website:

> **3 KHÔNG – 2 PHẢI**
> - **KHÔNG** cài ứng dụng tài chính qua đường dẫn, tệp cài đặt, mã QR người khác gửi.
> - **KHÔNG** cấp quyền trợ năng, quyền đọc tin nhắn cho ứng dụng lạ.
> - **KHÔNG** nhập hay gửi cụm từ khôi phục ví cho bất kỳ ai, bất kỳ trang nào.
> - **PHẢI** tải ứng dụng từ kho chính thức và kiểm tra nhà phát triển.
> - **PHẢI** ngắt mạng, báo ngân hàng ngay nếu đã lỡ cài.

---

**Ghi chú biên tập**

Bài viết do website tự biên soạn nhằm mục đích tuyên truyền, phòng ngừa, dựa trên các cảnh báo công khai của cơ quan chức năng và quy định pháp luật được đối chiếu tại thời điểm biên tập. Tình huống minh họa là tình huống giả định, không phản ánh một vụ việc hay cá nhân cụ thể. Website không phải cơ quan nhà nước và không tiếp nhận tố giác tội phạm; người dân cần trình báo trực tiếp với cơ quan Công an. Nếu phát hiện thông tin chưa chính xác, vui lòng liên hệ qua địa chỉ ghi tại chân trang để được xem xét, đính chính.
