# Kiểm chứng bộ phát hành ngày 20/10/2026

| Hạng mục | Kết quả đã kiểm tra |
| --- | --- |
| Publish thực tế | Release, win-x64, self-contained; lần publish cuối khoảng 40,5 giây trên máy phát triển |
| Gói phát hành | Khoảng 341 MB; có Views/uSync/assets, runtime .NET và ASP.NET Core 10.0.8; không có `.db`, WAL/SHM hoặc appsettings.Local |
| Phiên bản | version.json có commit, UTC, RID, configuration, selfContained và dirty=true cho worktree chưa commit |
| Kiểm tra gói | Manifest SHA-256 đạt; script kiểm thử phát hiện tệp bị sửa và tệp dữ liệu thêm ngoài manifest |
| Chạy executable | Chạy trực tiếp `.exe` trong Staging với DOTNET_ROOT trỏ thư mục không có runtime; `/healthz` 200, đúng X-ANTC-Release |
| uSync khởi tạo | Chế độ bootstrap rõ ràng, nhập All trên CMS trống: receipt 220 actions thành công |
| uSync cập nhật | Nhập Settings ở lần tiếp theo: receipt 172 actions thành công; 8 chuyên đề/200 câu vẫn đọc được |
| Backup | Lệnh `--deployment-backup` tạo hai snapshot .db, quick_check và checksum; unit test giữ dữ liệu committed trong WAL và từ chối ghi đè backup |
| Proxy HTTPS cục bộ | Caddy 2.11.7 từ release chính thức, checksum archive SHA-512 đã đối chiếu; trang chủ và healthz qua HTTPS localhost đều 200 |
| Xác thực chứng thư thử | Dùng CA riêng của phiên thử qua `--cacert`, kiểm tra hostname/chain; Schannel dùng revocation best-effort vì CA thử nội bộ không có CRL; không dùng `-k` và không cài CA thử vào trust store hệ điều hành |
| IP quản trị | IP ngoài allowlist nhận 403 tại /umbraco, trang công khai cùng IP vẫn 200 |
| Bộ test .NET | 156 passed, 0 failed |
| Script PowerShell | Parse tất cả script; kiểm tra manifest, environment chưa thay placeholder, đường dẫn quá rộng đều đạt |

Các phiên thử dùng thư mục/CSDL tạm riêng, không cập nhật CSDL đang dùng của dự án.
Không cài Windows Service, không mở firewall hệ thống hay cài root CA vào máy phát triển trong vòng kiểm chứng này.

## Chưa nghiệm thu

- Chạy `Update-Staging.ps1` với Windows Service thực tế trên máy đích; thử tự phục hồi khi migration/uSync/health thất bại.
- Đo tổng thời gian cập nhật máy đích <300 giây với dữ liệu thực tế, đối chiếu số dòng và media trước/sau.
- DNS/IP máy nội bộ và quyền truy cập máy chưa được cấp.
- Truy cập HTTPS từ máy khác trong nhóm/chủ quản với chuỗi chứng thư được tin cậy.
- Reboot máy đích và kiểm tra tự khởi động service.

Thời gian publish trên máy phát triển và HTTPS localhost không thay thế các tiêu chí nghiệm thu trên.
