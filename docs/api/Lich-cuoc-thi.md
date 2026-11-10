# Quy tắc lịch cuộc thi

## API lịch công khai trên portal

`GET /api/v1/contests` trả HTTP 200 với `serverTime`, `ongoing`, `upcoming`, `ended` và trường boolean `hasOngoingContest`.

- `hasOngoingContest: true`: có ít nhất một cuộc thi đang diễn ra trong `ongoing`.
- `hasOngoingContest: false`: hiện không có cuộc thi đang diễn ra, kể cả khi vẫn có cuộc thi sắp tới hoặc đã kết thúc. Portal có thể hiển thị “Hiện chưa có cuộc thi nào đang diễn ra”.

Trường này được tính từ `ongoing`; các danh sách và quy tắc thời gian giữ nguyên. Cuộc thi đang diễn ra phải được bật sử dụng và thỏa `StartAt <= serverTime < EndAt`; thời gian gia hạn nộp bài không được tính là đang diễn ra. Response được cache công khai tối đa 60 giây.

Ví dụ khi chưa có cuộc thi nào:

```json
{
  "serverTime": "2026-11-10T03:00:00Z",
  "ongoing": [],
  "upcoming": [],
  "ended": [],
  "hasOngoingContest": false
}
```

## Tạo và chỉnh sửa lịch

Áp dụng khi tạo và chỉnh sửa qua `POST /api/v1/admin/contest/campaigns` và `PUT /api/v1/admin/contest/campaigns/{id}`.

- Admin có thể tạo nhiều cuộc thi nhưng các khoảng diễn ra không được giao nhau.
- Hai đầu mốc được tính trong khoảng: trùng nếu `existing.StartAt <= proposed.EndAt && existing.EndAt >= proposed.StartAt`.
- Vì thế cuộc thi kế tiếp phải bắt đầu **sau** thời điểm kết thúc cuộc thi trước; không được bằng chính thời điểm đó.
- Tính cả cuộc thi ngừng sử dụng. Giờ gia hạn nộp bài không chiếm lịch.
- So sánh thời điểm UTC đã chuẩn hóa, không so sánh riêng phần ngày hiển thị.
- Khi sửa, không so sánh cuộc thi với chính nó. Các quy tắc khóa cuộc thi đã bắt đầu, revision và bảo toàn bộ đề có lượt dự thi vẫn giữ nguyên.

Ví dụ A từ 10/9 đến 15/9: B từ 12/9 đến 18/9, từ 8/9 đến 16/9, hoặc nằm hoàn toàn trong A đều bị từ chối. B từ 16/9 đến 20/9 hợp lệ.

## Phản hồi trùng lịch

HTTP 409, giữ chuẩn lỗi hiện có:

```json
{
  "error": {
    "code": "CONTEST_TIME_OVERLAP",
    "message": "Thời gian diễn ra trùng với cuộc thi #12 “Cuộc thi tháng 9”. Vui lòng chọn khoảng thời gian khác; thời điểm bắt đầu phải sau thời điểm kết thúc cuộc thi trước.",
    "fields": {}
  }
}
```

Kiểm tra lịch và ghi dữ liệu trong cùng transaction Serializable của SQLite, lấy khóa ghi trước khi đọc lịch. Hai yêu cầu tạo/sửa đồng thời không thể cùng đặt một khoảng trùng nhau. Khi bị từ chối, không lưu lịch, revision hoặc bộ đề mới.

Không tự động sửa/xóa lịch cũ đã trùng trước khi quy tắc được triển khai. Các lần tạo/sửa tiếp theo phải tuân thủ quy tắc mới; chỉ bật/tắt một cuộc thi đã bắt đầu vẫn giữ hành vi cũ vì không thay đổi khoảng thời gian.
