# Bàn giao luồng CUOC-THI-v2-chinh

Người viết: Worker. Nhánh `lane/CUOC-THI-v2-chinh`, worktree `C:\GTSC\DMST\wt\CUOC-THI-v2-chinh`, cổng 11004.

## M1b · 2026-10-18 · Trang làm bài riêng

Kết quả: **xong**. Căn cứ: QĐ-024 (F), `1-thiet-ke.md` task M1b. Không có `3-review-CUOC-THI-v2-chinh.md` nên không có mục review cần sửa kèm.

### Đã làm
- Document type `cuocThiLamBaiPage` (composition `seoBase`, không có thuộc tính nghiệp vụ), template cùng tên, nội dung "Làm bài" là con của "Cuộc thi trực tuyến" (`thiPage`). `thiPage` cho phép trang con này. Viết tay các file uSync (không bấm backoffice): `ContentTypes/cuocthilambaipage.config`, `Templates/cuocthilambaipage.config`, `Content/làm-bài.config`, sửa `ContentTypes/thipage.config` (`<Structure>`).
- Định tuyến: `AntcPublicPaths` thêm `cuocThiLamBaiPage` → `/cuoc-thi/lam-bai/`; `AntcPublicContentFinder` tìm trang này dưới `thiPage` (không dưới `home` như các trang cố định khác); `PageTreeRules` coi là trang duy nhất, bắt buộc nằm dưới `thiPage`. Thêm 2 ca vào `AntcPublicPathsTests`.
- `Views/cuocThiLamBaiPage.cshtml` mới: layout, CSS `contest-quiz.css` + `contest.css`, script `contest/exam.js`, gọi partial `_LuongThi.cshtml`. Partial bỏ `Layout`/`@section`, nhận `IPublishedContent`; cài đặt cuộc thi (`periodText`, `rulesText`, `rulesLink`, `dataRetentionDays`, `ContestSvc.Read`) vẫn đọc từ `thiPage` cha cho tới khi B5+ chuyển sang bảng `contest`.
- `_SiteLayout.cshtml`: kiểu `contest-site` và `_ContestHeader` áp dụng cho cả trang làm bài.
- Nội dung `thiPage`: nút `entryLink` của khối tổng quan trỏ `/cuoc-thi/lam-bai/` (trước là `/thu-suc/`).

### Lệnh đã chạy và kết quả
| Lệnh | Kết quả |
|---|---|
| `.\run-local.ps1 -NoRun` | 0 lỗi, 70 cảnh báo (NU1902/NU1903 có sẵn) |
| `dotnet test ANTC.Portal.App.slnx --no-build` | 54 đạt, 0 hỏng |
| `dotnet run --no-build --urls http://localhost:11004` | lên được; uSync tự nhập trang mới trên CSDL cũ của worktree |
| `GET /`, `/cuoc-thi/`, `/cuoc-thi/lam-bai/`, `/cuoc-thi/lam-bai/?c=1`, `/thu-suc/` | cả 5 đều 200 |
| HTML `/cuoc-thi/lam-bai/` | có `#regview`, "Đăng ký dự thi", `contest-quiz.css`, `exam.js`, `contest-site` |
| Playwright: tạo cuộc thi qua `POST /api/v1/admin/contest/campaigns` (bearer từ backoffice) → 201; `GET /cuoc-thi/` | nút thẻ dự thi `href="/cuoc-thi/lam-bai/"` |
| Playwright 1440 và 390 | `scrollWidth` = 1440 / 390 (không tràn ngang), không có lỗi console/pageerror |
| `Stop-Process -Id 74648` (PID qua cổng 11004) | đã dừng, chỉ tiến trình của tôi |

Hồ sơ ở `C:\GTSC\DMST\agent-artifacts\CUOC-THI-v2-chinh\`: `m1b-lam-bai-1440.png`, `m1b-lam-bai-390.png`, `m1b-web.log`, `m1b-tree.json`.

### Điều chưa kiểm được, giả định, sai khác
- Chưa xem ảnh chụp bằng mắt (không có quyền mở file ảnh trong phiên này); chỉ kiểm DOM, độ rộng và lỗi console.
- Vì `thiPage` chưa có ngày nên trạng thái thi là "đóng": form đăng ký ẩn, hiện khung "Chưa đăng ký được". Đúng với yêu cầu "API-01 còn đóng là đúng ở bước này"; luồng đăng ký/làm bài chưa chạy được đầu–cuối ở bước này.
- Chưa bấm nút thẻ dự thi bằng chuột (phần tử ẩn do hiệu ứng chờ); chỉ kiểm `href`.
- `?c=<id>` chưa có tác dụng (thuộc F7).
- Chưa thử nhập uSync trên CSDL trống (`-Reset`); mới thử trên CSDL cũ.
- Sai khác: thiết kế nói "tạo trong backoffice"; tôi viết tay file uSync theo mẫu các document type có sẵn (uSync nhập được). Trang nằm dưới `thiPage` nên finder cần nhánh riêng.
- Khi chạy web uSync ghi lại 5 template view (`home`, `thamGiaPage`, `thiPage`, `thiThuPage`, `ungPhoPage`: khác BOM/xuống dòng); đã `git checkout` về bản gốc, không đưa vào commit.
- Mục `_SiteLayout`: `thiPage` vẫn dùng cùng bộ tải CSS/JS như cũ.
