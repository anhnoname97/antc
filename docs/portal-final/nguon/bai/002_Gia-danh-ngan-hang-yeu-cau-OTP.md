# Giả danh ngân hàng cảnh báo "giao dịch bất thường", yêu cầu cung cấp mã OTP: nhận diện và phòng tránh

Chuyên mục: Kiến thức phòng tránh – Cập nhật: 11/2026

> **Ghi nhớ:** Mã OTP là "chìa khóa" cuối cùng của tài khoản. **Không đưa OTP, mật khẩu cho bất kỳ ai**, kể cả người tự xưng nhân viên ngân hàng. Theo quy định của Ngân hàng Nhà nước, ngân hàng không gửi tin nhắn SMS, thư điện tử có đường dẫn cho khách hàng, trừ khi khách hàng yêu cầu. Tin nhắn "ngân hàng" có kèm đường dẫn cần được coi là đáng ngờ.

---

## 1. Thủ đoạn này là gì?

Kẻ gian gọi điện hoặc gửi tin nhắn, tự xưng là nhân viên, tổng đài của ngân hàng. Chúng báo tài khoản của bạn "có giao dịch bất thường", "bị lộ thông tin", "sắp bị khóa" hoặc "đang bị trừ tiền". Để "bảo vệ tài khoản", chúng yêu cầu bạn đọc mã OTP, nhập thông tin vào một trang web, cài ứng dụng hoặc chuyển tiền sang một "tài khoản an toàn".

Thực chất, mã OTP bạn đọc ra chính là mã xác nhận để kẻ gian đăng nhập hoặc chuyển tiền khỏi tài khoản của bạn. Tiền đã chuyển đi rất khó lấy lại.

---

## 2. Kịch bản thường gặp

| Bước | Kẻ gian làm gì | Mục đích |
|---|---|---|
| 1. Gây hoảng | Gọi điện hoặc nhắn tin báo "tài khoản có giao dịch bất thường", "sắp bị khóa", "bị trừ phí" | Khiến người nghe sợ mất tiền |
| 2. Tạo uy tín | Đọc đúng họ tên, số tài khoản, vài số cuối của thẻ; tin nhắn hiện tên giống tên ngân hàng | Khiến người nghe tin là ngân hàng thật |
| 3. Thúc ép | "Phải xử lý ngay trong vài phút, nếu không tài khoản sẽ bị khóa vĩnh viễn" | Không cho thời gian suy nghĩ, kiểm tra |
| 4. Lấy chìa khóa | Yêu cầu đọc mã OTP vừa nhận, hoặc gửi đường dẫn tới trang web giống trang ngân hàng để nhập tên đăng nhập, mật khẩu, OTP | Chiếm quyền tài khoản |
| 5. Chiếm quyền thiết bị | Hướng dẫn cài ứng dụng "bảo mật", "ngân hàng phiên bản mới", hoặc quét mã QR | Điều khiển điện thoại từ xa |
| 6. Rút tiền | Chuyển tiền khỏi tài khoản, hoặc yêu cầu nạn nhân tự chuyển sang "tài khoản an toàn" | Chiếm đoạt tài sản |

**Các biến thể cần lưu ý:**

- **Tin nhắn mang tên ngân hàng có đường dẫn:** tin nhắn hiển thị tên giống tên ngân hàng, có thể nằm chung luồng với tin nhắn thật, thường gửi vào ban đêm, cuối tuần, dịp lễ Tết. Nội dung là "nâng cấp hệ thống", "xác thực tài khoản", "nhận hoàn tiền, điểm thưởng", kèm đường dẫn tới trang web giả. Một số tin nhắn loại này được phát tán bằng thiết bị phát sóng giả, nên vẫn hiện tên thương hiệu.
- **Cố ý làm khóa tài khoản rồi gọi "hỗ trợ":** kẻ gian cố tình nhập sai mật khẩu nhiều lần để tài khoản ngân hàng của bạn bị khóa, rồi giả nhân viên ngân hàng gọi đến "hỗ trợ mở khóa", yêu cầu tải ứng dụng hoặc quét mã.
- **"Hỗ trợ cập nhật sinh trắc học", "đồng bộ thông tin":** lợi dụng việc ngân hàng yêu cầu xác thực sinh trắc học, kẻ gian gửi đường dẫn cài ứng dụng giả chứa mã độc, hoặc đề nghị gọi video để "quét khuôn mặt".
- **Lợi dụng tin tức về sự cố dữ liệu:** khi có thông tin về sự cố an ninh mạng ở một tổ chức tài chính, kẻ gian nhắn "tài khoản của bạn đã bị lộ, hãy bấm vào đây để đổi mật khẩu".
- **"Hoàn tiền", "nâng hạn mức thẻ tín dụng":** gọi mời nâng hạn mức, hủy phí thường niên, hoàn tiền giao dịch lỗi, rồi xin số thẻ, mã CVV ở mặt sau thẻ và OTP.

---

## 3. Tình huống minh họa

Tình huống dưới đây được xây dựng từ những đặc điểm chung của nhiều vụ việc đã được cơ quan chức năng cảnh báo. Đây không phải mô tả một vụ việc hay một người cụ thể nào.

Khoảng 10 giờ tối, một chị nhân viên văn phòng nhận tin nhắn mang tên ngân hàng: "Tài khoản của quý khách phát sinh giao dịch bất thường 18.500.000 VND. Nếu không phải quý khách thực hiện, vui lòng xác minh tại đường dẫn dưới đây để hủy giao dịch."

Chưa kịp kiểm tra thì có cuộc gọi đến. Người gọi xưng là "bộ phận chống gian lận" của ngân hàng, đọc đúng họ tên và bốn số cuối của tài khoản. Anh ta nói nếu không hủy trong 5 phút, tiền sẽ bị chuyển đi. Anh ta đề nghị chị đọc "mã hủy giao dịch" vừa gửi về điện thoại.

Chị mở tin nhắn và thấy dòng chữ: "Mã OTP của quý khách là ... Không chia sẻ mã này cho bất kỳ ai." Chị dừng lại, nói sẽ tự gọi lại ngân hàng rồi cúp máy. Chị gọi tổng đài in ở mặt sau thẻ. Tổng đài viên cho biết tài khoản không có giao dịch nào như vậy, đồng thời nhắc chị không cung cấp mã OTP cho bất kỳ ai.

> **Bài học:** Không có "mã hủy giao dịch" nào cần đọc cho người khác. Mã OTP luôn là mã cho phép một giao dịch hoặc một lần đăng nhập xảy ra. Cúp máy và tự gọi tổng đài chính thức là cách xử lý đúng.

---

## 4. Vì sao nhiều người vẫn tin?

- **Kẻ gian biết một phần thông tin thật** như họ tên, số tài khoản, số cuối của thẻ, do dữ liệu cá nhân bị lộ, mua bán.
- **Tin nhắn hiển thị tên giống ngân hàng**, thậm chí xếp chung luồng với tin nhắn thật.
- **Đánh vào nỗi sợ mất tiền:** người nghe muốn "chặn giao dịch" càng nhanh càng tốt.
- **Áp lực thời gian:** "5 phút", "ngay bây giờ", "nếu không sẽ khóa vĩnh viễn".
- **Trang web giả rất giống thật:** giao diện, biểu tượng, màu sắc như trang ngân hàng, địa chỉ chỉ khác vài ký tự.
- **Hiểu nhầm về OTP:** nhiều người nghĩ OTP là "mã xác minh danh tính" để chứng minh mình là chủ tài khoản, chứ không phải mã cho phép giao dịch.

---

## 5. Sáu dấu hiệu nhận biết

Một dấu hiệu chưa đủ để kết luận, nhưng đủ để hoãn lại và tự kiểm chứng. Riêng các điểm dừng sau thì dừng ngay, không chờ dấu hiệu thứ hai: bị đòi đọc hoặc gửi mã OTP, mật khẩu; bị bảo cài ứng dụng, cho xem hay điều khiển màn hình; bị đòi nộp phí để lấy tiền hoặc hàng đang bị giữ; bị bảo quét khuôn mặt, gửi ảnh giấy tờ; bị bắt giữ bí mật; bị cản tự gọi lại số chính thức.

1. Người lạ tự xưng ngân hàng **chủ động gọi điện, nhắn Zalo, Facebook** báo tài khoản có vấn đề.
2. Tin nhắn "ngân hàng" có **đường dẫn** hoặc mã QR.
3. Yêu cầu **đọc mã OTP**, mật khẩu, mã CVV, hoặc nhập các thông tin này vào một trang web.
4. Yêu cầu **cài ứng dụng** qua đường dẫn, quét mã QR, hoặc chia sẻ màn hình.
5. Yêu cầu **chuyển tiền sang "tài khoản an toàn"**, "tài khoản tạm giữ" để bảo vệ tiền.
6. **Thúc ép** phải làm ngay, dọa khóa tài khoản, không cho thời gian kiểm tra.

**Cần biết:** Theo quy định của Ngân hàng Nhà nước, ngân hàng không gửi tin nhắn SMS, thư điện tử có đường dẫn cho khách hàng, trừ trường hợp khách hàng yêu cầu. Ngân hàng không có "tài khoản an toàn" nào để khách hàng chuyển tiền vào. Mã OTP chỉ dùng cho giao dịch do chính bạn thực hiện; nếu bạn không đang giao dịch mà vẫn nhận được OTP, nghĩa là có người đang cố đăng nhập hoặc giao dịch bằng tài khoản của bạn.

---

## 6. Cần làm gì?

### Khi nhận cuộc gọi, tin nhắn "từ ngân hàng"

- **Không bấm đường dẫn** trong tin nhắn, kể cả tin nhắn mang tên ngân hàng.
- **Không đọc OTP**, mật khẩu, mã CVV cho bất kỳ ai, dưới bất kỳ lý do nào.
- **Cúp máy và tự liên hệ ngân hàng** qua số tổng đài in trên thẻ, trên ứng dụng chính thức, hoặc đến quầy giao dịch. Không gọi lại số vừa gọi đến.
- **Tự mở ứng dụng ngân hàng** (không mở qua đường dẫn) để kiểm tra lịch sử giao dịch.
- Chỉ cài ứng dụng ngân hàng từ kho ứng dụng chính thức (App Store, Google Play).

### Nếu lỡ cung cấp OTP, mật khẩu hoặc đã cài ứng dụng lạ

1. **Gọi ngay tổng đài ngân hàng** để khóa tài khoản, khóa thẻ, khóa dịch vụ ngân hàng điện tử, đề nghị tra soát giao dịch.
2. Nếu đã cài ứng dụng lạ: **ngắt kết nối mạng** (bật chế độ máy bay) và ngừng dùng máy đó; từ một thiết bị khác, đổi mật khẩu ngân hàng và thư điện tử; chụp lại bằng chứng rồi mới gỡ ứng dụng.
3. **Lưu lại bằng chứng:** số điện thoại, nội dung tin nhắn, ảnh chụp trang web giả, lịch sử giao dịch.
4. **Trình báo** cơ quan Công an nơi gần nhất.
5. **Cảnh giác bị lừa lần hai:** không tin các "dịch vụ lấy lại tiền" tự tìm đến bạn.

### Thói quen bảo vệ tài khoản

- Đặt hạn mức chuyển tiền trong ngày phù hợp với nhu cầu thực tế.
- Bật thông báo biến động số dư để phát hiện sớm giao dịch lạ.
- Không dùng chung mật khẩu ngân hàng với các tài khoản khác.
- Hướng dẫn ông bà, cha mẹ một câu dễ nhớ: **"Ai xin mã OTP cũng không đưa, dù người đó xưng là ai."**

---

## 7. Quy định pháp luật liên quan

- **Tội sử dụng mạng máy tính, mạng viễn thông, phương tiện điện tử thực hiện hành vi chiếm đoạt tài sản (Điều 290 Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2017):** bao gồm hành vi sử dụng thông tin tài khoản, thẻ ngân hàng của người khác để chiếm đoạt tài sản, truy cập bất hợp pháp vào tài khoản nhằm chiếm đoạt. Mức cao nhất là phạt tù từ 12 năm đến 20 năm khi chiếm đoạt tài sản trị giá từ 500 triệu đồng trở lên; người phạm tội còn có thể bị phạt tiền, tịch thu tài sản.
- **Tội lừa đảo chiếm đoạt tài sản (Điều 174 Bộ luật Hình sự):** áp dụng khi kẻ gian dùng thủ đoạn gian dối khiến nạn nhân tự chuyển tiền. Mức cao nhất là phạt tù từ 12 năm đến 20 năm hoặc tù chung thân khi chiếm đoạt tài sản trị giá từ 500 triệu đồng trở lên.

Phần này chỉ nhằm phổ biến kiến thức pháp luật; việc định tội danh và hình phạt trong từng vụ việc do cơ quan tiến hành tố tụng có thẩm quyền quyết định.

---

## 8. Tóm tắt để ghi nhớ

> **3 KHÔNG – 2 PHẢI**
> - **KHÔNG** đọc mã OTP, mật khẩu, mã CVV cho bất kỳ ai.
> - **KHÔNG** bấm đường dẫn trong tin nhắn "ngân hàng".
> - **KHÔNG** cài ứng dụng, chuyển tiền theo hướng dẫn qua điện thoại.
> - **PHẢI** cúp máy và tự gọi tổng đài in trên thẻ.
> - **PHẢI** khóa tài khoản ngay khi nghi ngờ bị lộ thông tin.

---

**Ghi chú biên tập**

Bài viết do website tự biên soạn nhằm mục đích tuyên truyền, phòng ngừa, dựa trên các khuyến cáo công khai của Ngân hàng Nhà nước, cơ quan Công an và quy định của Bộ luật Hình sự. Tình huống minh họa là tình huống giả định, không phản ánh một vụ việc, cá nhân hay ngân hàng cụ thể; số tiền và nội dung tin nhắn trong tình huống là ví dụ. Website không phải cơ quan nhà nước hay tổ chức tín dụng và không tiếp nhận tố giác tội phạm; người dân cần liên hệ trực tiếp ngân hàng và cơ quan Công an. Nếu phát hiện thông tin chưa chính xác, vui lòng liên hệ qua địa chỉ ghi tại chân trang để được xem xét, đính chính.
