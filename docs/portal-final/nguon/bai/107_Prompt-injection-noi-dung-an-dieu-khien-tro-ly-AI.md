# Cài lệnh ẩn vào nội dung bên ngoài để dẫn lệch trợ lý AI: nhận diện và phòng tránh

Chuyên mục: Kiến thức phòng tránh | Cập nhật: 11/2026

> **Ghi nhớ:** Trang web, quảng cáo, thư điện tử hoặc tài liệu được AI đọc là dữ liệu bên ngoài, không phải người có quyền giao việc. **Khuyến nghị của website:** giới hạn quyền công cụ và tự kiểm tra hành động quan trọng trước khi xác nhận.

---

## Thủ đoạn này là gì?

Theo phân tích ở nước ngoài của cơ quan an ninh mạng quốc gia, ứng dụng AI có thể gặp rủi ro khi ghép hướng dẫn với nội dung không đáng tin vào cùng quá trình xử lý. Mô hình có thể không giữ được ranh giới giữa điều người dùng yêu cầu và những chỉ dẫn nằm trong tài liệu được đưa vào.

Prompt injection là cách gọi nguy cơ nội dung bên ngoài dẫn mô hình làm lệch nhiệm vụ. Trong phạm vi bài này, nội dung có thể xuất hiện trên trang web, phần quảng cáo, thư điện tử hoặc PDF, nhưng chỉ tạo rủi ro theo cơ chế đó khi thực sự được đưa vào phần dữ liệu trợ lý xử lý.

**Theo nhận định của website:** cần phân biệt đầu ra sai với hành động được thực hiện. Trợ lý chỉ có thể gây tác động qua công cụ, dữ liệu và quyền thực tế được cấp; việc mở hoặc đọc một PDF không tự động làm phát sinh chuyển tiền.

Phần dẫn lệch có thể nằm ở đoạn ít được người đọc chú ý hoặc không xuất hiện trong bản xem mà họ thường nhìn. Vì vậy, phần kiểm tra của website tập trung cả vào hành vi đầu ra và quyền công cụ, không giả định người dùng luôn tìm thấy mọi chỉ dẫn ẩn trong nội dung trợ lý tiếp nhận.

## Nhìn toàn chuỗi từ nội dung đến hành động

Bảng dưới đây do website diễn giải để phòng ngừa. Không đưa mẫu chỉ dẫn độc hại, mã lệnh, địa chỉ nhận dữ liệu hoặc cách vượt kiểm soát.

| Lớp trong quá trình | Điều có thể xảy ra | Điểm kiểm soát cần đặt |
|---|---|---|
| Nội dung đầu vào | Tài liệu chứa yêu cầu ngoài nhiệm vụ | Coi nội dung bên ngoài là dữ liệu |
| Xử lý của mô hình | Nhầm yêu cầu trong tài liệu với chỉ dẫn | Thiết kế giảm rủi ro, không chỉ lời nhắc |
| Đầu ra | Tóm tắt, dự thảo hoặc đề xuất bị lệch | Kiểm tra với yêu cầu và hồ sơ gốc |
| Công cụ được kết nối | Có thể đọc, gửi hoặc sửa trong phạm vi quyền | Giới hạn công cụ, dữ liệu và phạm vi thao tác |
| Hành động quan trọng | Gửi dữ liệu, đổi người nhận, thanh toán | Cơ chế phê duyệt ngoài nội dung không tin cậy |

## Vì sao “đã dặn AI bỏ qua lệnh lạ” vẫn chưa đủ?

**Theo nhận định của website:** người dùng có thể tưởng lời dặn ban đầu tạo ra một hàng rào chắc chắn. Tuy nhiên, chính việc mô hình xử lý cả hướng dẫn lẫn nội dung khiến câu trả lời không nên được xem như quyết định đáng tin tuyệt đối.

Cảnh báo ở nước ngoài nhấn mạnh không chỉ dựa vào danh sách chặn và cần quản lý phần rủi ro còn lại. Vì vậy, một quy tắc viết trong lời nhắc không thay thế được kiểm soát quyền ở hệ thống, giới hạn hành động và giám sát của người có trách nhiệm.

Không phải mọi câu trả lời không đúng ý đều chứng minh có prompt injection. Có thể còn lỗi dữ liệu, hiểu sai yêu cầu hoặc hạn chế của mô hình; việc xử lý cần giữ lại bối cảnh để phân tích, không vội gán ý đồ cho tác giả tài liệu.

## Sáu dấu hiệu nhận biết

Đây là dấu hiệu hành vi cần kiểm tra do website tổng hợp. Người dùng không nhất thiết nhìn thấy nội dung được chèn, nên không được xem danh sách này là công cụ phát hiện đầy đủ.

- **Đổi mục tiêu không được yêu cầu:** trợ lý chuyển từ đọc, tóm tắt sang đề nghị gửi dữ liệu hoặc thực hiện việc khác.
- **Tài liệu tự nhận quyền chỉ đạo:** nội dung bên ngoài được viện dẫn như nguồn có thể thay đổi yêu cầu hoặc chính sách của người dùng.
- **Xuất hiện nơi nhận mới:** dự thảo thêm tài khoản, địa chỉ hoặc người nhận không có trong yêu cầu đã xác nhận.
- **Xin quyền vượt nhiệm vụ:** tác vụ đọc tài liệu dẫn sang yêu cầu mở rộng quyền truy cập, gửi hoặc sửa dữ liệu.
- **Đòi bỏ qua kiểm tra:** đầu ra thuyết phục người dùng không xem lại, giữ bí mật hoặc xác nhận gấp một hành động quan trọng.
- **Hoạt động công cụ bất thường:** xuất hiện lần gọi, truy cập hoặc lỗi công cụ không phù hợp với công việc được giao.

## Tình huống minh họa

Đây là tình huống giả định do website xây dựng, không mô tả một vụ việc hay một người có thật.

Một nhân viên nhờ trợ lý AI đọc bộ hồ sơ và chuẩn bị dự thảo đề nghị thanh toán, chưa cho phép thực hiện giao dịch. Sau khi xử lý một PDF nhận từ bên ngoài, trợ lý đưa vào dự thảo nơi nhận tiền khác với hồ sơ đã xác nhận.

Nhân viên không chấp thuận dự thảo, đối chiếu tài liệu gốc và báo bộ phận phụ trách kiểm tra dữ liệu đầu vào, lịch sử công cụ. Quy trình thanh toán giữ nguyên bước xác nhận riêng nên nội dung sai chưa trở thành lệnh chuyển tiền.

> **Bài học do website rút ra:** Nội dung không đáng tin có thể dẫn lệch đầu ra, nhưng hậu quả còn phụ thuộc quyền và cơ chế phê duyệt. Kiểm soát cần nằm ngoài lời thuyết phục trong chính câu trả lời của AI.

## Phòng ngừa và cách xử lý

### Với từng người

Phân tích ở nước ngoài khuyến nghị giới hạn hành động, quyền truy cập và ghi nhận hoạt động để xử lý rủi ro. Không có một câu nhắc hoặc bộ lọc được nêu như giải pháp bảo đảm loại bỏ hoàn toàn prompt injection.

Khuyến nghị của website:

- Giao nhiệm vụ cụ thể, phân biệt việc đọc với việc gửi, sửa hoặc thực hiện giao dịch.
- Không cấp quyền tài khoản và dữ liệu không cần thiết chỉ để trợ lý làm thuận tiện hơn.
- Tự kiểm tra người nhận, nội dung, tệp đính kèm và phạm vi hành động trước khi xác nhận.
- Đối chiếu đầu ra quan trọng với nguồn đã xác minh, không chỉ yêu cầu chính trợ lý giải thích vì sao nó đúng.
- Không đưa bí mật công việc vào trợ lý ngoài phạm vi được phép; một nội dung đã đọc không trở thành nguồn có thẩm quyền.

### Với gia đình

**Khuyến nghị của website:** khi giúp người thân dùng AI, giải thích rõ trợ lý được đọc gì và có quyền làm gì. Không nên kết nối nhiều tài khoản riêng tư ngay từ đầu chỉ để thử tính năng tự động.

Nếu trợ lý yêu cầu gửi hồ sơ, thanh toán hoặc thêm người nhận, cần dừng để kiểm tra như với mọi yêu cầu tài chính khác. Không coi lời khẳng định “đã kiểm tra an toàn” trong câu trả lời là sự chấp thuận của gia đình.

### Với cơ quan, doanh nghiệp

**Khuyến nghị của website:** thiết kế quyền tối thiểu, tách dữ liệu bên ngoài khỏi quyền ra quyết định và yêu cầu phê duyệt cho tác động lớn. Cơ chế phê duyệt phải ràng buộc đúng hành động được xem xét, không chỉ là một câu đồng ý chung từ trước.

Cần lưu nhật ký phù hợp về đầu vào, đầu ra và hoạt động công cụ để phân tích khi bất thường, đồng thời bảo vệ dữ liệu trong nhật ký. Việc kiểm thử nên dùng dữ liệu được phép, có quy trình dừng và không biến bài tuyên truyền thành nơi chia sẻ mẫu tấn công.

### Nếu trợ lý có biểu hiện làm lệch nhiệm vụ

Theo phân tích công khai, kết hợp **khuyến nghị của website**:

1. **Dừng hành động đang chờ:** không duyệt gửi, sửa, thanh toán hoặc cấp thêm quyền chỉ vì đầu ra thúc giục.
2. **Giới hạn phiên và quyền:** ngắt khả năng thực hiện hành động có rủi ro theo quy trình, kiểm tra kết nối từ hệ thống quản lý đã xác minh.
3. **Giữ bối cảnh cần thiết:** lưu yêu cầu gốc, nguồn đã đọc, đầu ra và hoạt động công cụ; không công khai lại nội dung nhạy cảm hoặc chỉ dẫn độc hại.
4. **Kiểm tra tác động thực tế:** phối hợp đầu mối an toàn thông tin rà soát dữ liệu đã gửi, quyền đã thay đổi hoặc giao dịch đã thực hiện; báo ngân hàng, cơ quan Công an khi phù hợp.
5. **Khôi phục có điều kiện:** sửa kiểm soát, rà soát bí mật có nguy cơ lộ và thử lại trong phạm vi an toàn; không chỉ thêm một lời nhắc rồi coi sự cố đã hết.

## Quy định pháp luật liên quan

- **Điều 289 Bộ luật Hình sự:** có thể được xem xét nếu có hành vi xâm nhập trái phép vào mạng hoặc phương tiện điện tử để chiếm quyền, can thiệp hoặc xử lý dữ liệu trái phép thuộc phạm vi điều luật, khi đủ yếu tố cấu thành.
- **Điều 174 Bộ luật Hình sự:** có thể liên quan khi thủ đoạn dẫn lệch được dùng để gian dối nhằm chiếm đoạt tài sản. Không phải mọi đầu ra sai hoặc thử nghiệm AI đều tự động là hành vi phạm tội.
- **Điều 38 Bộ luật Dân sự:** bảo vệ thông tin riêng tư, bí mật cá nhân và gia đình theo luật; quyền đọc tài liệu không tự tạo quyền gửi dữ liệu trong đó cho chủ thể khác.

Phần này chỉ nhằm phổ biến kiến thức pháp luật; việc định tội danh và hình phạt trong từng vụ việc do cơ quan tiến hành tố tụng có thẩm quyền quyết định.

Bài liên quan trên website: “Agentic AI bị lợi dụng để tự động hóa lừa đảo, tống tiền”; “Giả mạo tài liệu bằng AI, từ hóa đơn, hợp đồng đến giấy tờ định danh”.

## Tóm tắt để ghi nhớ

Khuyến nghị của website:

> **3 KHÔNG – 2 PHẢI**
> - **KHÔNG** coi nội dung bên ngoài là người có quyền giao việc cho trợ lý.
> - **KHÔNG** cấp quyền gửi, sửa hoặc giao dịch rộng hơn nhu cầu.
> - **KHÔNG** duyệt hành động quan trọng chỉ theo lời khẳng định của AI.
> - **PHẢI** kiểm tra yêu cầu gốc, nơi nhận và phạm vi trước khi xác nhận.
> - **PHẢI** dừng, giữ dấu vết và rà soát tác động thực tế khi có bất thường.

---

## Ghi chú biên tập

Bài viết do website tự biên soạn nhằm mục đích tuyên truyền, phòng ngừa, dựa trên các cảnh báo công khai của cơ quan chức năng và quy định pháp luật được đối chiếu tại thời điểm biên tập. Tình huống minh họa là tình huống giả định, không phản ánh một vụ việc hay cá nhân cụ thể. Website không phải cơ quan nhà nước và không tiếp nhận tố giác tội phạm; người dân cần trình báo trực tiếp với cơ quan Công an. Nếu phát hiện thông tin chưa chính xác, vui lòng liên hệ qua địa chỉ ghi tại chân trang để được xem xét, đính chính.
