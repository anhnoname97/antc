# Đánh cắp mã OTP ứng dụng nhắn tin để chiếm tài khoản: nhận diện và phòng tránh

Chuyên mục: Kiến thức phòng tránh | Cập nhật: 11/2026

> **Ghi nhớ:** Mã OTP ứng dụng nhắn tin là chìa khóa mở tài khoản của bạn trên một thiết bị khác. **Khuyến nghị của website:** không đọc mã OTP cho bất kỳ ai, không quét mã QR đăng nhập do người khác gửi, bật mật khẩu xác thực hai lớp cho ứng dụng nhắn tin.

---

## Thủ đoạn này là gì?

Các ứng dụng nhắn tin phổ biến thường dùng số điện thoại và mã OTP gửi qua tin nhắn để đăng nhập trên thiết bị mới. Theo cơ quan Công an, kẻ gian tìm mọi cách để có được mã này, hoặc để nạn nhân tự cho chúng đăng nhập, nhằm chiếm tài khoản. Các cách thường gặp:

- **Giả danh nhân viên** ứng dụng, nhà mạng, cơ quan nhà nước, hoặc giả danh người quen "gửi nhầm mã", đề nghị nạn nhân đọc lại mã OTP vừa nhận.
- **Trang đăng nhập giả** mạo giao diện ứng dụng nhắn tin, dụ nạn nhân nhập số điện thoại, mã OTP, mật khẩu.
- **Ứng dụng độc hại** xin các quyền nhạy cảm, đọc tin nhắn chứa mã OTP.
- **Dụ quét mã QR**: kẻ gian gửi mã QR "nhận quà", "xác minh", "tham gia nhóm"; thực chất là mã đăng nhập, khi nạn nhân quét bằng ứng dụng, tài khoản được đăng nhập trên thiết bị của kẻ gian.
- **Dùng lại mật khẩu bị lộ** từ các vụ rò rỉ dữ liệu khác.

Theo cơ quan Công an, sau khi chiếm được tài khoản, kẻ gian có thể theo dõi các cuộc trò chuyện một thời gian, rồi giả danh chủ tài khoản nhắn tin vay tiền, nhờ chuyển khoản, gửi đường dẫn lừa đảo cho danh bạ; chỉnh sửa hoặc xóa tin nhắn để xóa dấu vết. Theo cơ quan Công an, đã có trường hợp tài khoản của người giữ vị trí lãnh đạo bị chiếm, rồi được dùng để nhắn tin cho cấp dưới yêu cầu chuyển tiền tạm ứng.

## Các cách kẻ gian lấy quyền đăng nhập

Bảng dưới đây là cách website hệ thống hóa cảnh báo của cơ quan Công an.

| Cách lấy | Lời dẫn thường gặp | Điều nạn nhân thật sự làm |
|---|---|---|
| Xin mã OTP | "Mình gửi nhầm mã vào số bạn, đọc lại giúp mình" | Trao mã đăng nhập tài khoản của chính mình |
| Trang đăng nhập giả | "Tài khoản sắp bị khóa, xác minh tại đây" | Nhập số điện thoại, mã OTP vào trang của kẻ gian |
| Mã QR "nhận quà", "xác minh" | "Quét mã này bằng ứng dụng để nhận quà" | Cho phép thiết bị lạ đăng nhập tài khoản |
| Ứng dụng độc hại | "Cài ứng dụng này để xem ảnh, nhận thưởng" | Cấp quyền đọc tin nhắn chứa mã OTP |
| Mật khẩu bị lộ | Không cần lời dẫn | Dùng chung một mật khẩu cho nhiều nơi |

## Vì sao người trong danh bạ dễ bị lừa?

**Theo nhận định của website:** tài khoản bị chiếm mang theo toàn bộ lịch sử trò chuyện, nhóm gia đình, nhóm cơ quan. Kẻ gian đọc được cách xưng hô, chuyện riêng, công việc đang làm, nên tin nhắn vay tiền nghe rất thật. Thủ đoạn dùng tài khoản bị chiếm để nhắn tin vay tiền người thân có bài riêng trên website; bài này tập trung vào **bước chiếm tài khoản**.

## Sáu dấu hiệu nhận biết

Đây là phần kiểm tra do website tổng hợp từ cảnh báo của cơ quan Công an. Một dấu hiệu đã đủ để dừng lại.

- **Nhận mã OTP đăng nhập** mà bạn không yêu cầu, ngay sau đó có người nhắn xin mã.
- **Người quen nhắn "gửi nhầm mã"**, nhờ đọc lại; tài khoản người quen có thể đã bị chiếm.
- **Đường dẫn "xác minh tài khoản"**, "tài khoản sắp bị khóa" gửi qua tin nhắn.
- **Mã QR "nhận quà", "tham gia nhóm"** yêu cầu quét bằng chính ứng dụng nhắn tin.
- **Thông báo đăng nhập trên thiết bị lạ**, hoặc ứng dụng tự đăng xuất trên điện thoại của bạn.
- **Bạn bè báo nhận tin nhắn lạ** từ tài khoản của bạn.

## Tình huống minh họa

Đây là tình huống giả định do website xây dựng, không mô tả một vụ việc hay một người có thật.

Một nhân viên văn phòng vừa nhận tin nhắn chứa mã OTP của ứng dụng nhắn tin thì thấy tài khoản của chị đồng nghiệp nhắn: "Chị đăng nhập máy mới, lỡ điền số em, em đọc mã giúp chị với". Tin nhắn rất tự nhiên, xưng hô đúng như mọi ngày.

Anh nhớ mã OTP luôn có dòng dặn không chia sẻ với ai, nên không đọc mã. Anh gọi điện vào số đã lưu của chị đồng nghiệp; chị cho biết không hề nhắn tin, và tài khoản của chị đã bị người lạ đăng nhập từ sáng. Anh báo cho nhóm cơ quan không làm theo tin nhắn từ tài khoản đó.

> **Bài học do website rút ra:** Không có ai "gửi nhầm" mã OTP vào số của bạn. Mã gửi đến số của bạn là mã mở tài khoản của bạn.

## Phòng ngừa và cách xử lý

### Với từng người

Theo cơ quan Công an, tuyệt đối không cung cấp mã OTP cho bất kỳ ai; không bấm đường dẫn lạ, không quét mã QR không rõ nguồn gốc; không cài ứng dụng ngoài kho chính thức; bật xác thực hai lớp; dùng mật khẩu mạnh, riêng biệt.

**Khuyến nghị của website:**

- Bật mật khẩu, mã PIN xác thực hai lớp trong phần cài đặt bảo mật của ứng dụng nhắn tin, để kẻ có mã OTP vẫn không đăng nhập được.
- Định kỳ xem danh sách thiết bị đang đăng nhập, đăng xuất những thiết bị lạ hoặc thiết bị cũ.
- Chỉ quét mã QR đăng nhập khi chính bạn đang đăng nhập trên máy tính của mình.

### Với gia đình

**Khuyến nghị của website:** bật xác thực hai lớp cho ứng dụng nhắn tin của bố mẹ, ông bà; thống nhất một "câu hỏi gia đình" để kiểm tra khi có tin nhắn hỏi tiền.

### Với cơ quan, doanh nghiệp

**Khuyến nghị của website:** quy định không yêu cầu chuyển tiền, tạm ứng chỉ qua tin nhắn ứng dụng; mọi đề nghị chi tiền phải qua quy trình duyệt và gọi điện xác nhận.

### Nếu đã lỡ đưa mã OTP hoặc bị chiếm tài khoản

Theo cơ quan Công an, kết hợp **khuyến nghị của website**:

1. **Đăng nhập lại ngay** bằng số điện thoại của mình để lấy lại tài khoản; đăng xuất các thiết bị lạ, đổi mật khẩu, bật xác thực hai lớp.
2. **Thông báo cho người thân, bạn bè, các nhóm** qua kênh khác rằng tài khoản bị chiếm, không chuyển tiền theo tin nhắn.
3. **Liên hệ bộ phận hỗ trợ của ứng dụng** qua kênh chính thức trong ứng dụng để báo cáo, khôi phục tài khoản.
4. **Kiểm tra các tài khoản dùng chung mật khẩu** và tài khoản ngân hàng.
5. **Lưu bằng chứng và trình báo cơ quan Công an** khi có người bị lừa chuyển tiền.

## Quy định pháp luật liên quan

- **Điều 289 Bộ luật Hình sự (tội xâm nhập trái phép vào mạng máy tính, mạng viễn thông hoặc phương tiện điện tử của người khác):** áp dụng với hành vi xâm nhập trái phép, chiếm quyền sử dụng tài khoản, lấy cắp dữ liệu.
- **Điều 174 Bộ luật Hình sự (tội lừa đảo chiếm đoạt tài sản):** áp dụng khi tài khoản bị chiếm được dùng để lừa người khác chuyển tiền, nếu đủ yếu tố cấu thành tội phạm.
- **Điều 290 Bộ luật Hình sự (tội sử dụng mạng máy tính, mạng viễn thông, phương tiện điện tử thực hiện hành vi chiếm đoạt tài sản):** có thể được áp dụng tùy hành vi cụ thể.

Phần này chỉ nhằm phổ biến kiến thức pháp luật; việc định tội danh và hình phạt trong từng vụ việc do cơ quan tiến hành tố tụng có thẩm quyền quyết định.

## Tóm tắt để ghi nhớ

Khuyến nghị của website:

> **3 KHÔNG – 2 PHẢI**
> - **KHÔNG** đọc mã OTP cho bất kỳ ai, kể cả người quen "gửi nhầm".
> - **KHÔNG** quét mã QR "nhận quà", "xác minh" bằng ứng dụng nhắn tin.
> - **KHÔNG** đăng nhập qua đường dẫn nhận được trong tin nhắn.
> - **PHẢI** bật mật khẩu xác thực hai lớp cho ứng dụng nhắn tin.
> - **PHẢI** gọi điện xác minh qua số đã lưu trước khi làm theo tin nhắn.

---

**Ghi chú biên tập**

Bài viết do website tự biên soạn nhằm mục đích tuyên truyền, phòng ngừa, dựa trên các cảnh báo công khai của cơ quan chức năng và quy định pháp luật được đối chiếu tại thời điểm biên tập. Tình huống minh họa là tình huống giả định, không phản ánh một vụ việc hay cá nhân cụ thể. Website không phải cơ quan nhà nước và không tiếp nhận tố giác tội phạm; người dân cần trình báo trực tiếp với cơ quan Công an. Nếu phát hiện thông tin chưa chính xác, vui lòng liên hệ qua địa chỉ ghi tại chân trang để được xem xét, đính chính.
