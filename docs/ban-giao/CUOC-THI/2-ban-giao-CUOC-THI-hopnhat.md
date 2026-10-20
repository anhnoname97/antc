# Bàn giao luồng CUOC-THI-hopnhat

Người viết: Worker. Nhánh `lane/CUOC-THI-hopnhat`, worktree `C:\GTSC\DMST\wt\CUOC-THI-hopnhat`, cổng 11002.

## M1a · 2026-10-18 · Hợp nhất `origin/main` vào `dev`

Kết quả: **xong, có 1 test đỏ chưa phải do việc merge (xem "Điều chưa đạt")**. Merge commit `e5451987` (cha 1 = `988f3147` dev, cha 2 = `1de97372` origin/main). Không push, không merge vào `dev`. Worktree sạch.

### Lệnh đã chạy và kết quả

| Lệnh | Kết quả |
|---|---|
| `git fetch` | Không có gì mới; `origin/main` = `1de97372`, gốc chung `3c035da2` |
| `git merge origin/main --no-ff --no-commit` | 8 file xung đột: `CLAUDE.md`, bản dựng (modify/delete), `ContestController.cs`, `CustomCoreComposer.cs`, `ContestEntryService.cs`, `thiPage.cshtml`, uSync `cuộc-thi-trực-tuyến.config`, `quiz.css`. `tokens.css` tự gộp |
| `dotnet build src/ANTC.Portal.App/ANTC.Portal.App.slnx` | 0 lỗi, 70 cảnh báo (toàn NU1902/NU1903 về ImageSharp, Pkcs, MessagePack; đã có từ trước) |
| `dotnet test src/ANTC.Portal.App/ANTC.Portal.App.slnx` | **51 đạt, 1 hỏng, tổng 52** (xem dưới) |
| `.\run-local.ps1 -Reset -NoRun` | Build đạt |
| `dotnet run --no-build --urls http://localhost:11002` | Lên tới `uSync: Startup Complete`; vài dòng `unable to open database file` ở lần đầu (bình thường theo CLAUDE.md) |
| `GET /`, `/cuoc-thi/`, `/thu-suc/`, `/api/v1/quiz/sample` | 200, 200, 200, 200 |
| `POST /api/v1/contest/entries` `{"mode":"anon"}` | **403** `{"error":{"code":"CONTEST_CLOSED",...}}` đúng dự kiến (`thiPage` của origin/main không còn ngày) |
| Đăng nhập backoffice (Playwright, `admin@antc.local`), lấy bearer từ request của backoffice, `POST /api/v1/admin/contest/campaigns` | Lần đầu 400 (thiếu chuyên đề, rồi thiếu câu hỏi); lần có `topics:[{topicId:1, questionCodes:[3 mã]}]` → **201**, `GET .../campaigns` trả `totalItems:1` |
| `Stop-Process -Id 57724` (PID lấy qua `Get-NetTCPConnection -LocalPort 11002`) | Đã dừng web, chỉ tiến trình của tôi |

Ghi chú: cuộc thi được tạo qua API quản trị bằng token của phiên backoffice, không bấm qua giao diện form của `ContestManagement`. Cookie không đủ cho API này (401), cần bearer.

### Giải xung đột theo quy tắc M1a

- `ContestController.cs`, `ContestEntryService.cs`: bản `dev`.
- Xóa `UmbracoContestSettingsProvider.cs`, `Api/Validation/ContestEntryRequestValidator.cs`. Trong `ContestModels.cs` xóa mọi kiểu API-01 (`ContestSettings` bản `DateTimeOffset`, `ContestEntryRegistration`, `ContestEntryCreationResult`, `IContestSettingsProvider`, `IContestEntryService`, hai exception), **giữ `ContestSecurityOptions`** vì `QuestionSubmissionService` (origin/main) dùng.
- `Api/Models/ContestEntryModels.cs`: xóa `CreateContestEntryRequest/Response`; **`ApiErrorResponse` và `ApiError` vẫn được `CustomApiComposer`, `ContestAdminController`, `QuestionsController`… dùng**, nên chuyển sang file mới `Api/Models/ApiErrorModels.cs` (giữ nguyên nội dung).
- `CustomCoreComposer.cs`: hợp hai bên (using, đăng ký dịch vụ, handler quyền backoffice, `IContestSettings`, `IContestAttemptService`, `ContestConfigCheck`). Bỏ `.Validate(...).ValidateOnStart()` muối IP; **giữ** `AddOptions<ContestSecurityOptions>().Bind(...)` cho `QuestionSubmissionService`; bỏ đăng ký `IContestSettingsProvider`; còn một đăng ký `IContestEntryService`; bỏ using trùng `Questions`.
- `thiPage.cshtml` → bản origin/main. Bản dev chép **nguyên văn** vào `Views/Partials/contest/_LuongThi.cshtml` (chưa gắn trang), chỉ đổi tham chiếu CSS sang `contest-quiz.css`.
- `quiz.css` → bản origin/main (`thiThuPage` dùng); `quiz.css` của dev → `contest-quiz.css` (nội dung nguyên văn), chỗ nạp duy nhất là `_LuongThi.cshtml`.
- `tokens.css`: tự gộp, đã kiểm: `--font` là Roboto của origin/main, 5 biến `--c-disabled/track/lock-*` của dev còn nguyên. Không cần thêm biến nào.
- uSync `cuộc-thi-trực-tuyến.config` → bản origin/main.
- Bản dựng: SHA-256 hai file **giống nhau** (`6a4d49e0…2f41`) → nhận tên `docs/ban-dung/an-toan-tai-chinh-website.html`, xóa tên cũ. Git ghi nhận là rename (R100).
- Test: `ContestEntryServiceTests.cs` viết lại trên API-01 của `dev`; `ContestEntryRequestValidatorTests.cs` xóa và gộp vào đó. Danh sách ca:
  - giữ nguyên ý: cuộc thi thiếu ngày thì đóng; 10 yêu cầu đồng thời cùng số điện thoại chỉ tạo đúng 2 lượt (`ATTEMPT_LIMIT` cho 8 lượt còn lại); token chỉ trả một lần và CSDL chỉ lưu băm; chuẩn hóa số điện thoại 3 dạng; ẩn danh không dữ liệu cá nhân là hợp lệ.
  - thêm: cuộc thi đóng → `CONTEST_CLOSED`; thiếu muối IP vẫn đăng ký, `ip_hash` rỗng (QĐ-009); có tên mà thiếu đồng ý → `VALIDATION` có trường `consent`.
  - **đổi hành vi**: ca "ẩn danh gửi trường cá nhân thì bị từ chối" của origin/main không còn đúng, vì API-01 của dev bỏ qua các trường đó thay vì từ chối. Chuyển thành `AnonymousEntry_IgnoresEveryPersonalField_EvenWhenSent` (không lưu họ tên, số, đơn vị, thời điểm đồng ý). Không còn ca kiểm tra "từ chối"; nếu muốn giữ hành vi từ chối thì cần quyết định contract API-01.
- `CLAUDE.md`: giữ bản dev, chèn đoạn mới của origin/main (danh sách dưới).

### Điều chưa đạt hoặc chưa kiểm được

1. **`dotnet test` chưa sạch**: `AntcPublicPathsTests.Manual_faq_documents_do_not_have_a_public_route` hỏng (`AntcPublicPaths.GetPath("qaItem","cau-hoi")` trả `/hoi-dap/cau-hoi/`, test mong `null`). `Content/AntcPublicPaths.cs` và file test giống hệt `origin/main` (`git diff origin/main` rỗng cho hai file), nên lỗi nằm sẵn ở origin/main, không do merge. Tôi **chưa** chạy test trực tiếp trên `origin/main` để chứng minh. Không sửa vì là code của nhóm, ngoài phạm vi M1a. Cần Orchestrator/anhnn quyết: sửa code hay sửa test.
2. Chưa chạy trang trên 390px; ảnh chụp chỉ 1440px (`m1a-cuoc-thi-1440.png`). Chưa xem ảnh bằng mắt (không có quyền mở file ảnh trong phiên này).
3. `_LuongThi.cshtml` chép nguyên văn có `Layout = ...` và `@section Head` — không render được như partial. M1b phải chỉnh khi gắn vào trang làm bài. Hiện không ai gọi nó; build đạt.
4. Chạy lại web trên CSDL cũ (không `-Reset`) chưa làm; chỉ chạy `-Reset`. Migration `AddContestCampaigns` áp dụng được trên CSDL mới.
5. Khi chạy web, uSync ghi lại 5 template (`home`, `thamGiaPage`, `thiPage`, `thiThuPage`, `ungPhoPage`: khác BOM/xuống dòng). Đã `git checkout` về bản đã merge, không đưa vào commit.

### Sai khác so với thiết kế

- Thêm `ApiErrorModels.cs` (thiết kế chỉ nói xóa `ContestEntryModels.cs`, nhưng hai kiểu lỗi còn dùng ở nơi khác).
- Giữ `ContestSecurityOptions` + `Bind` (thiết kế nói "bỏ ValidateOnStart", không nói bỏ cả options).
- `CustomCoreComposer.cs` xóa dòng `IContestSettingsProvider` (kéo theo xóa provider).
- Test "ẩn danh" đổi hành vi như trên.

### Đoạn `CLAUDE.md` của origin/main đã chèn, cần anhnn duyệt

Chèn trước mục "Việc còn để lại (theo README)", văn bản nguyên văn từ origin/main:

1. `## Sơ đồ và graph code` (3 gạch đầu dòng: `SO-DO.md` tự sinh bằng `gen_so_do.py`; graph `code-review-graph` và `.mcp.json` không commit, `.code-review-graphignore`; graph không đọc uSync).
2. `## Quy ước làm việc của nhóm (từ origin/main)` (tôi đổi tiêu đề từ "Quy ước làm việc"; 5 gạch: uSync đồng bộ, file `Change="Delete"` không xóa, `.db` và `media` không commit, không đưa salt/mật khẩu vào git, **kế hoạch chuẩn là Google Sheet "Kế hoạch công việc ATTC", xlsx có thể cũ**).
3. `## Lưu ý đã biết` (2 gạch). **Gạch đầu đã sai sau merge**: nói `UmbracoContestSettingsProvider` đọc `thiPage`, nhưng provider đã bị xóa; nay `ContestSettingsService` (bản dev) đọc `thiPage` và API-01 vẫn trả 403. Gạch hai: cảnh báo lỗ hổng `ImageSharp`/`Pkcs`.

Không chèn: mục "Cấu trúc" của origin/main (trùng "Kiến trúc 3 tầng" của dev) và dòng tiêu đề/mô tả đầu file. Ghi chú: gạch 2.5 mâu thuẫn với `CLAUDE.md` của dev (xlsx là tài liệu thiết kế); cần anhnn quyết nguồn chuẩn.

### Chỗ còn trỏ tên bản dựng cũ `antoantaichinh-ban-dung-thu.html` (không sửa, theo quy tắc)

`CLAUDE.md:34`; `docs/ke-hoach/anh/README.md:5`; `docs/ke-hoach/anh-v2/README.md:3,24,34`; `docs/ke-hoach/anh-v2/cong-cu/README_dau.md:3,24,34`; `src/.../Core/Quiz/QuestionBank.cs:10` (comment); `src/.../Views/Partials/_PageStub.cshtml:14`; và các hồ sơ `docs/ban-giao/*`. Lưu ý `anh-v2/README.md:34` đã ghi sẵn việc tên khác nhau. Lệnh `extract_v2.py ../../../ban-dung/antoantaichinh-ban-dung-thu.html` trong README sẽ không chạy nữa.

### Điều khác nên biết

- `git diff --cached --stat dev` (trước commit): 341 file, +24645 −2158; lưu ở `C:\GTSC\DMST\agent-artifacts\CUOC-THI-hopnhat\m1a-diff-stat-vs-dev.txt`.
- Hồ sơ kiểm chứng ở `C:\GTSC\DMST\agent-artifacts\CUOC-THI-hopnhat\`: `m1a-web.log`, `m1a-post-result.json` (kết quả 201), `m1a-backoffice.png`, `m1a-cuoc-thi-1440.png`, `m1a-login-debug.png`.
- Giả định: tên cột và quy tắc "dev thắng cho API-01" áp dụng cả `ContestSettings` (kiểu `DateTime` của dev); kiểu `DateTimeOffset` của origin/main bỏ.
- Việc kế tiếp theo thiết kế: B5 (cột `entry.contest_id`) và các task đọc cuộc thi từ bảng `contest` thay `thiPage`; hiện API-01 đóng cho tới khi làm.

TRANG-THAI: XONG (còn 1 test đỏ có sẵn ở origin/main, cần quyết định)

## Sửa theo review M1a · 2026-10-18

Làm (commit riêng trên `lane/CUOC-THI-hopnhat`):
1. `CLAUDE.md` "Lưu ý đã biết": sửa thành `ContestSettingsService` đọc `thiPage`; API-01 trả 403 tới khi làm B5+.
2. `CLAUDE.md`: bỏ gạch "Google Sheet là bản chuẩn" (QĐ-023).
3. Đổi tên bản dựng thành `an-toan-tai-chinh-website.html` trong `CLAUDE.md`, `QuestionBank.cs`, `_PageStub.cshtml`.
4. `AntcPublicPathsTests`: test đổi thành `Faq_documents_are_routed_under_hoi_dap`, kỳ vọng `/hoi-dap/cau-hoi/` (không sửa `AntcPublicPaths.cs`).
5. Ca test thi ẩn danh: không đổi, giữ hành vi bỏ qua.

**BỊ CHẶN, chưa làm (cần người dùng)**: sửa tên bản dựng trong `docs/ke-hoach/anh/README.md`, `docs/ke-hoach/anh-v2/README.md`, `docs/ke-hoach/anh-v2/cong-cu/README_dau.md`. Công cụ Edit từ chối: thư mục `docs/ke-hoach` bị `permissions.deny`; tôi không đi vòng bằng sed. Cần sửa: thay `antoantaichinh-ban-dung-thu.html` bằng `an-toan-tai-chinh-website.html` (3 file, 2 chỗ mỗi file ở 2 README v2, 1 chỗ ở `anh/README.md`), và dòng "Kế hoạch trỏ tới bản dựng v2 ..." ở mục "Lưu ý về bản dựng" thành "Kế hoạch và repo cùng dùng tên `an-toan-tai-chinh-website.html` cho bản dựng v2."

Lệnh và kết quả (trong `src/ANTC.Portal.App`):
- `dotnet build ANTC.Portal.App.slnx`: 0 lỗi, 70 cảnh báo.
- `dotnet test ANTC.Portal.App.slnx --no-build`: Passed 52, Failed 0.
- Không chạy web nên không có tiến trình cần dừng. Không có ảnh chụp.
