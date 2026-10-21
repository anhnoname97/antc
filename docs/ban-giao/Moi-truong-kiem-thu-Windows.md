# Môi trường kiểm thử Windows và lệnh phát hành

## Trạng thái bàn giao

Đã có script publish, cập nhật Windows Service, sao lưu/khôi phục hai SQLite, nhập cấu trúc uSync,
giới hạn IP quản trị và cấu hình reverse proxy HTTPS. Chưa có máy/IP/tên miền nội bộ hoặc phương thức truy cập máy đích.
Vì vậy **chưa nghiệm thu việc cả nhóm truy cập HTTPS hoặc cập nhật máy đích dưới 5 phút**.
Không lấy thời gian publish trên máy phát triển thay cho thời gian triển khai thực tế.

Máy đích cần Windows x64/ARM64 tương ứng gói publish, PowerShell 7.2+, đĩa NTFS, IP LAN cố định hoặc DHCP reservation,
DNS nội bộ và TCP 443 từ mạng nhóm. Chạy các script cài/cập nhật bằng Administrator tại máy đích (trực tiếp/RDP/WinRM).
Máy dựng cần .NET 10 SDK, Git và feed NuGet nội bộ đã có trong repo. Máy chạy không cần SDK/runtime .NET riêng.
Chọn ngày cấp máy/DNS sớm để kiểm chứng mốc xem thử ngày 6 của kế hoạch.

## Phát hành một bước

Từ thư mục gốc repository:

```powershell
pwsh -File .\ops\Publish-Release.ps1 -Runtime win-x64 -RequireClean
```

Script chạy `dotnet publish -c Release --self-contained true`, không trim/single-file vì Umbraco cần assembly scanning/Razor.
Đầu ra: `artifacts/releases/<releaseId>/`, có executable/runtime, Views, uSync và assets.
`version.json` chứa commit đầy đủ, thời điểm UTC, RID, Release/self-contained và cờ dirty.
`manifest.json` chứa SHA-256 từng file. Bỏ `-RequireClean` chỉ khi muốn tạo gói thử từ worktree chưa commit; gói được đánh dấu dirty.
Không publish `appsettings.Local*`, App_Data, CSDL, WAL/SHM, logs hoặc media đang sử dụng.
Mỗi output phải là thư mục mới; không ghi đè gói cũ. `-OutputDirectory` cho phép chọn thư mục khác.

Nếu máy dựng cũng là máy kiểm thử đã khởi tạo, có thể dựng và cập nhật bằng một lệnh:

```powershell
pwsh -File .\ops\Publish-Release.ps1 -RequireClean -Deploy -EnvironmentFile C:\AntcConfig\staging.environment.json
```

## Dữ liệu và quyền truy cập

```text
C:\AntcStaging\
  releases\<releaseId>\        code/runtime của từng bản
  shared\App_Data\             app.sqlite.db
  shared\UmbracoData\          Umbraco.sqlite.db
  shared\media\                media không bị thay khi cập nhật
  shared\Logs\                 log JSON
  shared\Keys\                 Data Protection keys (DPAPI, cùng tài khoản service)
  shared\Deployment\           receipt nhập uSync và cờ bảo trì
  backups\<timestamp>\         hai snapshot .db và checksum
  proxy\                       Caddy executable, cấu hình, PKI riêng
  last-deployment.json          bản hiện tại, thời gian thực tế và vị trí backup
```

Service chạy bằng LocalService. Root có ACL riêng cho SYSTEM/Administrators/LocalService.
Junction trong mỗi release trỏ App_Data, umbraco/Data, umbraco/Logs và wwwroot/media về shared.
Không di chuyển/copy đè thư mục shared khi thay code. Chưa có tự động xóa release/backup cũ để tránh mất khả năng phục hồi.
Theo dõi dung lượng đĩa và quy định lưu backup riêng trước khi dùng lâu dài.

## Cấu hình môi trường

Copy `ops/staging.environment.example.json` ra **ngoài repository**, ví dụ `C:\AntcConfig\staging.environment.json`.
Giới hạn ACL của file này cho Administrators/SYSTEM và thay mọi `__REPLACE...`.
Không gửi file môi trường lên Git, chat hoặc đính kèm log triển khai.

- `Contest__IpHashSalt`: bí mật ngẫu nhiên ít nhất 32 ký tự; tạo một lần, giữ ổn định giữa các lần cập nhật.
- `Administration__AllowedNetworks__0`, `__1`, …: IP/CIDR được vào `/umbraco/**` và `/api/v1/admin/**`.
  Không dùng `0.0.0.0/0` hay `::/0`. Kiểm tra IP thật qua proxy trước khi khóa danh sách.
- `ReverseProxy__ForwardLimit`, `ReverseProxy__KnownProxies__0`, …: proxy tin cậy; Caddy cùng máy dùng loopback đã được tin mặc định.
- `Umbraco__CMS__WebRouting__UmbracoApplicationUrl`: URL HTTPS thật của máy kiểm thử.
- Email/mật khẩu quản trị chỉ cần cho lần `-Initialize`; dùng mật khẩu riêng, không dùng tài khoản/mật khẩu local của repo.

Updater tạo biến môi trường cấp service qua registry `Environment` (REG_MULTI_SZ), không in giá trị bí mật.
Nó đặt `ConnectionStrings__appDb` và `ConnectionStrings__umbracoDbDSN` thành đường dẫn tuyệt đối trong shared,
cùng `ASPNETCORE_URLS=http://127.0.0.1:11010`, môi trường Staging, thư mục logs/keys và mã release.
Như vậy JSON local không thể ghi đè cấu hình máy chủ; host chỉ đọc appsettings.Local ở Development và env/CLI có ưu tiên cuối.
Thông tin bootstrap bị gỡ khỏi environment của service sau lần khởi tạo thành công; cũng gỡ khỏi file cấu hình nguồn và cất mật khẩu trong kho bí mật của nhóm.

## Khởi tạo lần đầu

Chuyển thư mục phát hành và các script `ops/*.ps1` lên máy Windows bằng kênh nội bộ được nhóm phê duyệt.
Chạy trên máy đích:

```powershell
pwsh -File .\ops\Update-Staging.ps1 `
  -ReleasePath D:\incoming\<releaseId> `
  -EnvironmentFile C:\AntcConfig\staging.environment.json `
  -InstallRoot C:\AntcStaging -Initialize -SeedContent
```

`-Initialize` chỉ cho môi trường mới hoàn toàn, cả hai CSDL chưa tồn tại; tạo service `ANTC-Staging` và tài khoản quản trị từ environment.
`-SeedContent` là lựa chọn rõ ràng để nhập nội dung mẫu của repo, chỉ được dùng cùng `-Initialize` và cây CMS trống.
Không có cờ này thì chỉ nhập cấu trúc Settings, không nhập cây nội dung. Các cuộc thi thực tế do admin tạo; Staging không sinh cuộc thi mẫu Development.
Nếu nội dung mẫu có ảnh qua Umbraco media, cần nhập riêng bộ media được bàn giao; publish không mang media máy cá nhân lên.

Khi chuyển dữ liệu có sẵn thay vì khởi tạo mới: IT chuẩn bị snapshot hợp lệ của **cả hai** CSDL cùng media và service đã provision;
không dùng `-Initialize`. Không copy `.db` đang ghi bỏ sót WAL; dùng lệnh backup của executable sau khi dừng tiến trình nguồn.
Không dùng script này để nhận quản lý một Windows Service ngoài InstallRoot.

## HTTPS qua Caddy

IT cấp DNS, ví dụ `antc-test.example.internal`, trỏ về IP LAN máy kiểm thử. Tải Caddy Windows từ nguồn chính thức,
kiểm tra checksum của archive rồi tính SHA-256 executable để truyền vào script (không tự động tải/chạy binary trong script cài):

```powershell
$hash = (Get-FileHash D:\tools\caddy.exe -Algorithm SHA256).Hash
pwsh -File .\ops\Install-StagingProxy.ps1 `
  -HostName antc-test.example.internal -CaddyExe D:\tools\caddy.exe -ExpectedSha256 $hash
```

Tên miền trên chỉ là ví dụ. Script tạo service `ANTC-Staging-Proxy`, tự chạy sau reboot,
proxy HTTPS về Kestrel loopback, mở firewall TCP 443/80 chỉ trong Domain/Private và LocalSubnet mặc định.
Dùng `-AllowedClientNetworks` để chỉ rõ các mạng nhóm/VPN thực tế; không mở port backend 11010 ra LAN.
Caddy admin API chỉ nghe loopback. Không bật access log ghi body/header/query chứa dữ liệu cá nhân.

Caddy cấp chứng thư bằng CA nội bộ (`tls internal`). Script **không tự cài root CA** vào trust store.
IT phân phối `C:\AntcStaging\proxy\data\pki\authorities\local\root.crt` tới máy người xem qua GPO/kênh tin cậy,
hoặc thay `tls internal` bằng certificate/key của PKI doanh nghiệp. Không chia sẻ private key của CA.
Không dùng bỏ kiểm tra TLS để nghiệm thu. Máy người xem phải resolve DNS và tin CA.

## Cập nhật một bước

```powershell
pwsh -File .\ops\Update-Staging.ps1 `
  -ReleasePath D:\incoming\<releaseId-moi> `
  -EnvironmentFile C:\AntcConfig\staging.environment.json
```

Thứ tự:

1. Kiểm tra manifest, SHA-256, RID, environment; lấy lock để không triển khai đồng thời; stage code vào release mới.
2. Bật cờ bảo trì (503; vẫn cho `/healthz`), dừng service và chờ dừng hẳn.
3. Dùng executable mới chạy `--deployment-backup <app.db> <Umbraco.db> <backupDirMoi>`.
   SQLite Backup API lấy cả committed WAL, chạy `PRAGMA quick_check` trên hai snapshot và ghi checksum; lỗi thì hủy cập nhật.
4. Đổi binary path/environment service rồi khởi động. Host nhập uSync **Settings** đồng bộ trước khi phục vụ HTTP,
   kiểm tra mọi action thành công và lưu receipt theo release; không nhập lại Content/Media ở các lần cập nhật.
5. Migration CSDL ứng dụng/Umbraco chạy theo pipeline khởi động. Chờ `/healthz` 200 kèm đúng `X-ANTC-Release`.
6. Ghi thời gian thực tế vào last-deployment.json, bỏ cờ bảo trì để mở lại traffic.

Nếu lỗi sau khi đổi bản: dừng bản mới, cất nguyên hai CSDL/WAL/SHM của bản lỗi vào `failed-release-data`,
khôi phục hai snapshot và binary/environment cũ, kiểm tra sức khỏe bản cũ rồi mở traffic.
Không mở lại traffic nếu phục hồi chưa khỏe. Không ghi đè hoặc xóa dữ liệu của bản lỗi.
Khởi tạo lần đầu thất bại không có bản cũ để quay lại: service dừng và các tệp được giữ để kiểm tra.
Script không xóa nội dung/media của môi trường đang dùng.

Timeout sức khỏe mặc định 180 giây, dừng service tối đa 30 giây; thời gian còn lại phụ thuộc đĩa, dung lượng DB và uSync.
Mốc dưới 5 phút phải đo trên máy đích với dữ liệu thực tế và một bản cập nhật tiếp theo; không bao gồm cấp máy/DNS/CA lần đầu.

## Checklist nghiệm thu tại máy đích

- Thực hiện update khi đang có dữ liệu thi, câu hỏi gửi lên và một ảnh media kiểm thử; đối chiếu số dòng và file trước/sau.
- Backup có đúng hai `.db`, checksum và khôi phục thử được ở môi trường riêng.
- last-deployment.json có seconds < 300; đúng commit/UTC/RID trong version.json.
- Receipt uSync của bản mới là group Settings; không nhập đè Content/Media đã biên tập.
- Từ máy khác trong nhóm gọi `https://<dns>/healthz`: TLS hợp lệ, 200, đúng release; không chỉ kiểm tra trên server.
- IP admin được phép vào; IP ngoài allowlist nhận 403; public site vẫn xem được.
- Reboot máy: cả hai service tự chạy, dữ liệu và đăng nhập không bị mất do đổi vị trí khóa.

Tài liệu nền: [Windows Service – Microsoft](https://learn.microsoft.com/aspnet/core/host-and-deploy/windows-service),
[Caddy Windows Service](https://caddyserver.com/docs/running#windows-service),
[Caddy internal HTTPS/trust](https://caddyserver.com/docs/automatic-https),
[uSync deployment](https://docs.jumoo.co.uk/usync/uSync/guides/once/).
