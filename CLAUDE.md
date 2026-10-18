# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dự án

antoantaichinh.vn là website tuyên truyền an toàn tài chính, dựng trên Umbraco 18.2.1 (.NET 10, phiên bản SDK ghim trong `src/ANTC.Portal.App/global.json`) và SQLite. `README.md` là tài liệu hướng dẫn chính thức cho người mới.

## Quy trình bắt buộc

Mọi việc thay đổi hành vi của hệ thống đi theo thứ tự:

**tìm tài liệu liên quan → hiểu code hiện tại → phân tích/thiết kế → chia task → triển khai → kiểm chứng → báo cáo.**

Việc nhỏ (sửa chữ, đổi một tham số, sửa lỗi rõ ràng) được rút gọn các bước, nhưng vẫn phải kiểm chứng và báo cáo.

| Skill | Dùng khi | Sửa code? |
|---|---|---|
| `/project-map` | Cần bản đồ codebase và danh sách tài liệu liên quan trước khi làm một vùng chưa quen | Không |
| `/feature-design` | Có yêu cầu hoặc mã công việc (FE-xx, BE-xx, API-xx…) cần chuyển thành thiết kế và danh sách task | Không |
| `/implement-task` | Triển khai **một** task đã thống nhất | Có |
| `/quality-check` | Review độc lập một thay đổi so với yêu cầu, tài liệu và quyết định đã chốt | Không |

## Tài liệu thiết kế

### Có gì và nằm ở đâu

| Tài liệu | Nội dung |
|---|---|
| `docs/ke-hoach/Ke-hoach-cong-viec-antoantaichinh-v3.xlsx` | 9 sheet: Tổng quan, Công việc (mã, mô tả, tiêu chí nghiệm thu, phụ thuộc), Lịch, API, CSDL, Nội dung Umbraco, URL, Khác biệt bản dựng, Câu hỏi mở |
| `docs/ke-hoach/Mo-ta-cong-viec-FE-antoantaichinh-v3.docx` | Mô tả từng việc FE (mô tả, hành vi, responsive, dữ liệu động, tiêu chí nghiệm thu, ảnh tham chiếu), biến thiết kế, hợp đồng API, bảng mã lỗi, câu hỏi mở. Có 56 bảng và 63 ảnh nhúng |
| `docs/ke-hoach/anh-v2/*.png` + `README.md` | **Ảnh giao diện hiện hành**: 155 ảnh chụp bản dựng v2 ở 1440/744/390px, kèm trạng thái tương tác; README ghi việc liên quan của từng ảnh. Chụp lại bằng `cong-cu/` khi bản dựng đổi |
| `docs/ke-hoach/anh/*.png` + `README.md` | Ảnh của bản dựng v1 (cũ). **Chỉ còn dùng cho luồng thi** (`th-*`, `mb-06`, `mb-07`; FE-25 đến FE-29) vì v2 chưa có các màn đó; các ảnh khác đã lỗi thời |
| `docs/ban-dung/antoantaichinh-ban-dung-thu.html` | Bản dựng v2: mẫu cho giao diện, câu chữ và cấu trúc dữ liệu. File rất lớn (2,8 MB, phần lớn là ảnh nhúng) và các trang con nằm trong một khối JSON mã hóa base64; xem ảnh trong `anh-v2/` hoặc tách trang bằng `anh-v2/cong-cu/extract_v2.py` thay vì đọc thẳng |
| `docs/quyet-dinh.md` | Nhật ký quyết định đã xác nhận (`QĐ-xxx`). Không phải tài liệu thiết kế; xem mục "Nhật ký quyết định" bên dưới |

Trong `src/ANTC.Portal.Core` có nhiều file `.md` của Umbraco; đó không phải tài liệu của dự án. Tài liệu có thể được bổ sung ở chỗ khác: khi cần, tìm lại theo phần mở rộng (`.docx .doc .pdf .xlsx .png .jpg .jpeg .webp .md .html`) và theo nội dung, bỏ qua `src/ANTC.Portal.Core`, `node_modules`, `bin`, `obj`.

### Cách đọc

| Định dạng | Cách | Đã thử trên repo này |
|---|---|---|
| `.xlsx` | `openpyxl` (`load_workbook(..., read_only=True, data_only=True)`) | Có |
| `.docx` | `python-docx`: đọc `paragraphs` theo heading **và** `tables` (phần lớn đặc tả nằm trong bảng) | Có |
| Ảnh `.png/.jpg` | Công cụ Read (xem ảnh trực tiếp) | Có |
| Ảnh nhúng trong `.docx` | Giải nén `word/media/` từ file `.docx` (là file zip) rồi xem bằng Read | Chưa |
| `.pdf` | `fitz` (PyMuPDF) có sẵn; PDF scan thì render trang ra ảnh rồi xem | Chưa (repo chưa có PDF) |

Viết script đọc vào thư mục scratchpad, chạy bằng `python -I`, truyền đường dẫn tài liệu làm tham số. Chỉ đọc phần liên quan đến task (theo mã công việc, heading, tên sheet); không đọc lại toàn bộ tài liệu ở mỗi lượt nếu nội dung đã có trong hội thoại.

Không suy diễn nội dung từ tên file. Nếu chỉ đọc được một phần (file lỗi, thiếu trang, ảnh không đọc được, bảng bị vỡ), nói rõ phần nào chưa đọc được, và xin bản đọc được khi phần đó cần cho việc đang làm. Ghi nguồn khi dẫn: đường dẫn tương đối + sheet/heading/mã mục (ví dụ `…v3.docx › 6. Hợp đồng API › API-03`).

### Trạng thái: bản nháp

Tài liệu thiết kế hiện là **bản nháp**. Một số mục tự ghi là "đã chốt", và sheet "Câu hỏi mở" có cột "Đang giả định"; các mục này vẫn chỉ là ý định thiết kế cho tới khi người dùng xác nhận. Khi trình bày, luôn tách rõ 5 loại thông tin:

1. **Tài liệu ghi**: có trích nguồn.
2. **Code hiện tại**: có `file:dòng` làm bằng chứng.
3. **Còn thiếu hoặc chưa rõ.**
4. **Đề xuất của Claude**: kèm lý do, lợi ích, đánh đổi, ảnh hưởng. Không trình bày như yêu cầu gốc hay quyết định đã duyệt.
5. **Quyết định đã xác nhận**: trong `docs/quyet-dinh.md` hoặc người dùng vừa chốt trong hội thoại. Áp dụng cho phạm vi tương ứng, không hỏi lại cùng vấn đề.

Thứ tự ưu tiên khi các nguồn khác nhau: quyết định đã xác nhận > tài liệu > code hiện có. Nhưng không mặc định tài liệu đúng hơn một yêu cầu mới, và cũng không mặc định code đúng chỉ vì nó đang tồn tại. Không sửa tài liệu thiết kế gốc để phản ánh đề xuất.

### Khi nào hỏi, khi nào tự tiếp tục

**Phải dừng và hỏi** (ở phần bị ảnh hưởng) khi một mâu thuẫn hoặc một chỗ chưa rõ đụng tới: nghiệp vụ, API contract, schema dữ liệu, bảo mật/xác thực, tích hợp, tương thích ngược hoặc kiến trúc. Câu hỏi phải gồm:

- các nguồn mâu thuẫn và vị trí của chúng;
- trạng thái code (có bằng chứng);
- ảnh hưởng của từng phương án;
- phương án khuyến nghị và lý do.

**Được tự tiếp tục** với chi tiết nhỏ không đổi contract hay kiến trúc: chọn phương án đơn giản, nhất quán với code hiện có, và ghi giả định vào báo cáo. Nếu mâu thuẫn không liên quan đến phần đang làm, làm tiếp phần độc lập và ghi vấn đề còn treo. Không chọn phương án rủi ro cao chỉ để làm tiếp được.

Ví dụ thật: sheet "API" quy định lỗi có dạng `{ "error": { "code", "message", "fields" } }`, còn `QuizController` hiện chỉ trả `code` và `message`.

### Nhật ký quyết định

`docs/quyet-dinh.md` giữ các quyết định qua nhiều phiên làm việc.

- **Đọc**: trước khi thiết kế, triển khai hay review, Grep file này theo phạm vi đang làm (mã công việc, tên API, tên bảng). Chỉ áp dụng mục có trạng thái `Hiệu lực`.
- **Ghi**: khi người dùng xác nhận rõ ràng một quyết định về nghiệp vụ, API contract, schema, bảo mật, tích hợp hoặc kiến trúc, thêm một mục theo mẫu trong file và báo lại số `QĐ-xxx`. Không ghi đề xuất chưa được duyệt hay giả định của Claude. Không xóa mục cũ; đổi ý thì thêm mục mới và sửa trạng thái mục cũ.
- Quyết định nhỏ chỉ dùng cho một task thì không cần ghi; nêu trong báo cáo là đủ.

## Làm việc hai agent (Orchestrator / Worker)

Khi chạy hai agent song song trên cùng thư mục, vai trò của từng agent nằm trong `CLAUDE.md` cấp người dùng của nó. Nếu không có file đó thì làm như một agent bình thường. Hai agent trao đổi qua `docs/ban-giao/<mã công việc>/`:

| File | Ai ghi | Nội dung |
|---|---|---|
| `0-giao-viec.md` | Điều phối (phiên ở profile mặc định) hoặc người dùng | Yêu cầu, phạm vi, ưu tiên, việc tiếp theo của từng agent |
| `1-thiet-ke.md` | Orchestrator | Kết quả `/feature-design`: task, acceptance criteria, quyết định liên quan |
| `2-ban-giao.md` | Worker | Báo cáo `/implement-task` theo mẫu của skill; câu hỏi bị chặn nếu có. Khi chạy theo luồng: `2-ban-giao-<luồng>.md` |
| `3-review.md` | Orchestrator | Kết quả `/quality-check`; yêu cầu chạy thử nếu cần. Khi chạy theo luồng: `3-review-<luồng>.md`, để các phiên review song song không ghi cùng một file |

- Các phiên chạy với tài khoản khác nhau không nhắn tin được cho nhau, nên mọi giao việc đi qua file. Có hai cách chạy agent:
  - **Thủ công**: người dùng gõ `nhận việc <mã>` ở cửa sổ VS Code của agent.
  - **Tự động** (máy của anhnn): phiên điều phối ở profile mặc định chạy `C:\GTSC\DMST\antc-agent.ps1 -Role orchestrator|worker -Prompt "nhận việc <mã>"` ở chế độ chạy nền, đọc kết quả rồi chạy bước kế tiếp: Orchestrator thiết kế → Worker triển khai → Orchestrator review → lặp lại tối đa 3 vòng. Dừng và hỏi người dùng khi `1-thiet-ke.md` hoặc `2-ban-giao.md` có mục cần xác nhận, hoặc khi kết quả báo lỗi.
- Mỗi file có một người ghi; agent kia chỉ đọc. Ghi thêm lần mới thì thêm mục có ngày ở cuối file, không xóa nội dung cũ.
- Chỉ Worker build và chạy `run-local`, để tránh khóa `bin/obj`, tranh cổng 11000 và file SQLite.
- Chỉ Orchestrator ghi `docs/quyet-dinh.md`.

**Theo dõi các agent đang chạy** (máy của anhnn): chạy `C:\GTSC\DMST\agent-monitor\start.cmd`, mở http://127.0.0.1:8799. Trang chỉ đọc: agent nào đang chạy, làm bao lâu, đã gọi bao nhiêu lệnh, lệnh gần nhất; luồng và nhánh, commit gần đây, mục mới nhất của hồ sơ bàn giao, lịch sử các lần chạy. Mỗi lần `antc-agent.ps1` chạy ghi một hồ sơ vào `C:\GTSC\DMST\agent-runs\`; có nút "Dừng lần chạy này" cho từng lần chạy.

### Tiết kiệm lượt dùng

Số đo trên máy của anhnn (log `agent-logs`): mỗi tin nhắn mới trong một phiên đọc lại toàn bộ lịch sử phiên, nên phiên điều phối kéo dài (hàng trăm nghìn token ngữ cảnh) tốn gấp 5 đến 10 lần một lượt agent. Vì vậy:

- **Phiên điều phối ngắn, mỗi gói việc một phiên.** Trạng thái nằm trong file, không nằm trong trí nhớ phiên: `docs/ban-giao/TRANG-THAI.md` (đọc đầu tiên), `docs/ban-giao/<mã>/`, `docs/quyet-dinh.md`. Phiên mới nhận việc bằng cách đọc các file đó. Cuối mỗi chặng, cập nhật `TRANG-THAI.md` trước khi đóng phiên.
- **Điều phối dùng Sonnet.** Orchestrator chạy mặc định (Opus) cho **thiết kế và phân tích**; **review dùng `-Model sonnet`**: `antc-agent.ps1 -Role orchestrator -Model sonnet -Prompt "..."`. Worker đã chạy Sonnet.
- **Review theo mức rủi ro.** Task đụng API contract, schema, bảo mật, giao diện chính hoặc luồng tiền/lượt thi: review riêng. Task nhỏ: gộp hai đến ba task vào một lượt review, hoặc để review cuối gói.
- **Phiên điều phối không mở ảnh.** Mỗi ảnh nằm lại trong ngữ cảnh đến hết phiên; việc xem ảnh để Orchestrator hoặc một phiên riêng ngắn làm.
- Không đọc nguyên văn kết quả dài của agent; chỉ đọc phần kết luận ở cuối `3-review*.md` / `2-ban-giao*.md`.
- **Chuỗi việc lặp lại thì chạy bằng script, không cần phiên điều phối:** `C:\GTSC\DMST\antc-pipeline.ps1 -Code <mã> -Lane <luồng> -Tasks T1,T2` chạy lần lượt Worker làm → Orchestrator review (Sonnet) → Worker sửa (tối đa 2 vòng) → task kế tiếp, và chỉ dừng khi cần người quyết định (Worker bị chặn, review cần xác nhận, hết vòng sửa, hết số lần chạy, worktree còn file chưa commit, agent báo lỗi hoặc hết lượt dùng). Kết luận của agent đọc từ dòng cuối `TRANG-THAI: ...`. Chạy thử kế hoạch không tốn lượt dùng: thêm `-DryRun`. Tên task phải có trong `1-thiet-ke.md`.
  - Chỉ dùng khi thiết kế đã chốt: các task phải ở trạng thái "Làm được" và không còn câu hỏi chặn. Pipeline không tự ghi quyết định hay tự thiết kế lại.
  - Mỗi lần chạy vẫn hiện ở trang theo dõi; log của pipeline ở `agent-logs\pipeline-*.log`.

### Chạy song song theo luồng

Khi FE cần một BE chưa có (hoặc nhiều mã công việc độc lập), không chờ nhau mà chạy song song, mỗi luồng một git worktree:

1. **Contract trước**: `/feature-design` chốt contract API trong `1-thiet-ke.md` và chia task theo cột "Luồng" (`<mã>-fe`, `<mã>-be`, `chính`). Chưa chốt contract thì chưa mở luồng.
2. **Mở luồng**: `antc-agent.ps1 -Role worker -Lane <luồng> -Base <nhánh mã công việc> -AllowCommit -Prompt "..."`. Script tạo worktree `C:\GTSC\DMST\wt\<luồng>`, nhánh `lane/<luồng>`, cổng web riêng (11001, 11002…, ghi ở `wt\ports.json`), CSDL riêng. Các luồng chạy nền cùng lúc.
3. **Review từng luồng**: Orchestrator đọc code ở `C:\GTSC\DMST\wt\<luồng>` (chỉ đọc), ghi review vào `3-review.md`, mục riêng cho mỗi luồng.
4. **Ghép**: khi các luồng đạt, điều phối merge `lane/<luồng>` vào nhánh mã công việc (`git merge --no-ff`), xử lý xung đột nếu có, rồi giao task **I (tích hợp)** cho Worker trên nhánh chính: tắt mock, chạy luồng đầu–cuối.
5. **Dọn**: `antc-agent.ps1 -RemoveLane <luồng>`, rồi xóa nhánh `lane/<luồng>` khi không cần.

Quy tắc:
- **Mỗi phiên Worker làm đúng một task nhỏ**, không gom cả luồng vào một phiên. Trong một luồng, các task chạy nối tiếp, mỗi task một phiên mới trên cùng worktree: phiên sau đọc `1-thiet-ke.md` và mục bàn giao của task trước, không dựa vào trí nhớ của phiên cũ. Với `-AllowCommit`, mỗi task xong là một commit trong nhánh `lane/*`.
- Orchestrator cũng vậy: gói lớn thì thiết kế theo nhiều phiên (contract trước, rồi từng luồng hoặc từng đợt); review mỗi task một phiên.
- Hai luồng không sửa cùng file. Phần dùng chung (dịch vụ, entity, DTO, `CustomCoreComposer.cs`) giao cho đúng một luồng.
- Tài liệu điều phối (`docs/ban-giao`, `docs/quyet-dinh.md`) luôn đọc và ghi ở repo chính, không ở worktree.
- Worker chỉ commit trong nhánh `lane/*`, khi được chạy với `-AllowCommit`, không push.
- Các luồng dùng chung giới hạn lượt dùng của tài khoản Worker. Không mở quá 2–3 luồng cùng lúc.

## Lệnh thường dùng

Chạy ở thư mục gốc repo bằng PowerShell. Mỗi script đều có bản `.sh` tương ứng cho bash.

| Việc | Lệnh |
|---|---|
| Build App rồi chạy web (http://localhost:11000, quản trị ở `/umbraco`) | `.\run-local.ps1` |
| Xóa CSDL local (Umbraco, log, `App_Data`) rồi tạo lại | `.\run-local.ps1 -Reset` |
| Chỉ build, không chạy | `.\run-local.ps1 -NoRun` (hoặc `dotnet build src/ANTC.Portal.App/ANTC.Portal.App.slnx`) |
| Build lại gói core rồi chạy | `.\run-local.ps1 -BuildCore` |
| Build lại core vào feed NuGet nội bộ | `.\core_build.ps1` (`-BuildSpa` build lại cả backoffice, cần Node; `-Version x` đóng dấu phiên bản khi phát hành) |
| Tạo migration EF | `dotnet tool restore`, rồi trong `src/ANTC.Portal.App`: `dotnet ef migrations add <TenThayDoi> --project Umbraco.Plugin.Custom.Core --startup-project Umbraco.Plugin.Custom.Core --output-dir Data\Migrations` |

- Tài khoản quản trị local: `admin@antc.local` / `Antc@Local2026`. Ở lần chạy đầu, script tạo `appsettings.Local.json` (không commit) từ `appsettings.Local.template.json`.
- Web dùng được khi log in ra `uSync: Startup Complete`. Ở lần chạy đầu, vài dòng `unable to open database file` là bình thường.
- Repo **chưa có project test và chưa có bước lint**. Kiểm chứng hiện dựa vào build, chạy web và gọi thử API/trang. Thêm project test là một quyết định kiến trúc, cần hỏi trước.

## Kiến trúc 3 tầng

- **`src/ANTC.Portal.Core`**: bản sao mã nguồn Umbraco 18.2.1 (`umbraco.sln`). Ít khi phải sửa.
- **`src/ANTC.Portal.Lib/Build.Core`**: feed NuGet nội bộ chứa các gói `.nupkg` đóng gói từ core. **Được commit có chủ đích** (`.gitignore` cố ý không bỏ qua `*.nupkg`), để người làm ở tầng App không phải build core.
- **`src/ANTC.Portal.App`**: nơi cả nhóm viết code. App **chỉ tham chiếu core qua gói NuGet**.
  - `nuget.config` bắt mọi gói `Umbraco.Cms*` lấy từ feed nội bộ.
  - Phiên bản core chỉ khai báo ở `UmbracoCoreVersion` trong `src/ANTC.Portal.App/Directory.Build.props`; phiên bản các gói khác ở `Directory.Packages.props`.

Sửa gì trong `ANTC.Portal.Core` thì chạy `core_build.ps1` rồi commit cả mã nguồn lẫn các `.nupkg` mới. Script tự xóa các thư mục `umbraco.cms*` cùng phiên bản trong `~/.nuget/packages` để App nhận gói mới.

### Các project trong App

- **`Umbraco.Web.UI`** (host): `Program.cs` (pipeline Umbraco chuẩn, đọc thêm `appsettings.Local.json`, cấu hình `WebEncoderOptions` cho mọi dải Unicode để tiếng Việt không bị mã hóa thành ký hiệu số), view Razor trong `Views/`, file tĩnh trong `wwwroot/assets/`, cấu hình uSync trong `uSync/v18/`.
- **`Umbraco.Plugin.Custom.Core`** (nghiệp vụ): `Composers/CustomCoreComposer.cs` là nơi duy nhất đăng ký dịch vụ; Umbraco tự tìm và chạy composer này.
- **`Umbraco.Plugin.Custom.Api`**: controller ASP.NET Core dạng `ControllerBase`, route theo tiền tố `/api/v1/...`.

### Hai CSDL tách riêng

1. **CSDL Umbraco**: `Umbraco.Web.UI/umbraco/Data/Umbraco.sqlite.db`, do bước cài đặt tự động tạo ra.
2. **CSDL ứng dụng**: `AppDbContext` (EF Core), file `App_Data/app.sqlite.db`, chuỗi kết nối `appDb` (đường dẫn tương đối tính từ content root). Khi khởi động, `AppDbInitializer` áp dụng migration, bật WAL, và nạp ngân hàng câu hỏi từ `Data/Seed/quiz-bank.json`, `quiz-sample.json` (resource nhúng) nếu CSDL còn trống. Entity ở `Data/Entities.cs`; thiết kế bảng ở sheet "CSDL".

### Bộ nhớ đệm ngân hàng câu hỏi

- `IQuestionBank` (singleton) giữ một bản chụp bất biến `QuestionBankSnapshot`. API đọc câu hỏi và việc chấm điểm lấy từ đây, không truy vấn CSDL ở mỗi yêu cầu.
- `Version` của bản chụp = `QuizImports.Id` lớn nhất, được `QuizController` dùng làm ETag.
- Code nào làm thay đổi dữ liệu câu hỏi (ví dụ nhập ma trận câu hỏi) phải gọi `Reload()`.
- DTO dùng tên trường JSON ngắn (`cd`, `q`, `opt`, `ans`, `exp`, `sit`, `safe`, `sec`), khớp dữ liệu của bản dựng để FE dùng lại mã hiển thị. Không đổi tên.

### Document type nằm trong uSync, không nằm trong code

- Document type, template, nội dung mẫu lưu thành file trong `Umbraco.Web.UI/uSync/v18/`; thiết kế ở sheet "Nội dung Umbraco" và "URL".
- Ở Development, uSync tự nhập khi khởi động và tự xuất mỗi lần lưu trong backoffice. Đổi document type thì sửa trong backoffice rồi commit các file `.config` sinh ra. Môi trường khác chỉ nhập một lần khi CSDL trống.
- ModelsBuilder chạy `InMemoryAuto` (`umbraco/models/` không commit). View kế thừa `UmbracoViewPage`, đặt tên theo alias document type (`home.cshtml`, `ungPhoPage.cshtml`…).

## Quy ước

- **Frontend**: các trang dùng `Views/Shared/_SiteLayout.cshtml`. Trang chưa dựng còn gọi `Partials/_PageStub`, có ghi mã công việc cần làm. Màu, cỡ chữ, khoảng cách lấy từ biến trong `wwwroot/assets/css/tokens.css`; cỡ chữ viết bằng `rem`; không viết `style="..."`. Sửa view hay file tĩnh chỉ cần tải lại trang; sửa C# thì chạy lại `run-local`.
- **Ngôn ngữ**: comment trong C# và script viết tiếng Việt không dấu. Chữ hiển thị cho người dùng viết tiếng Việt có dấu đầy đủ. Commit message viết tiếng Việt, có tiền tố `feat:`, `docs:`…
- **API**: tiền tố `/api/v1`, mã API theo sheet "API" (API-xx, QUIZ-xx) ghi trong comment `<summary>` của action.
- **`.editorconfig`**: xuống dòng LF (riêng `.ps1` dùng CRLF), thụt lề 4 dấu cách; json, css, js, html, csproj, props, config thụt 2.

## Việc còn để lại (theo README)

- Một số thuộc tính dùng kiểu nhập tạm Textstring/Textarea thay cho Block List, Dropdown hoặc số thập phân: `emergencyNumbers`, `labelType`, `fieldIcon`, `listRole`, `readTimerFactor`.
- Chưa có composition SEO dùng chung.
- `SixLabors.ImageSharp 3.1.12` có cảnh báo lỗ hổng; nên ghim bản đã vá trong `Directory.Packages.props`.
- Chưa làm các API cuộc thi, hỏi đáp, trang quản trị, nhập ma trận câu hỏi.

## Nguyên tắc làm việc

- Chọn thiết kế đơn giản nhất đáp ứng yêu cầu hiện tại; giữ kiến trúc hiện có trừ khi có lý do rõ ràng. Không áp đặt framework, lớp trừu tượng thừa hay tính năng làm trước khi cần.
- Tách quy tắc nghiệp vụ khỏi phần truyền tải, lưu trữ và giao diện, ở mức hợp với quy mô dự án.
- Chia việc lớn thành các lát dọc nhỏ, kiểm chứng được độc lập; ưu tiên một luồng chạy được từ đầu đến cuối. Chưa làm việc phụ thuộc khi contract nó cần chưa thống nhất.
- Sửa tập trung đúng việc, không refactor ngoài phạm vi. Xử lý kiểm tra đầu vào, lỗi, trường hợp biên và tương thích ngược.
- Giữ nguyên thay đổi sẵn có của người dùng; không xóa test để che lỗi.
- Báo đúng lệnh đã chạy và kết quả thật; không tuyên bố đã kiểm chứng điều chưa chạy. Rà diff tìm hồi quy, thông tin bí mật và thay đổi ngoài ý muốn. Nêu rõ điểm còn thiếu, giới hạn, rủi ro, và mức độ tuân thủ thiết kế.
- Không commit, push, merge, deploy hay chạy thao tác phá hủy khi chưa được đồng ý rõ ràng.
