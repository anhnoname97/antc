# Triển khai và vận hành

## Cấu hình bắt buộc

Môi trường đích phải cung cấp connection string Umbraco, mật khẩu PostgreSQL và URL công khai của ứng dụng qua secret manager hoặc biến môi trường. Không sao chép `.env` local lên source control.

Production cần TLS cho website và kết nối database phù hợp với hạ tầng. Cấu hình `UmbracoApplicationUrl` để email invitation và password reset sinh đúng URL.

## Quy trình triển khai tối thiểu

1. Restore và build ở cấu hình Release.
2. Chạy toàn bộ test hiện có.
3. Kiểm tra package conflict và cảnh báo bảo mật.
4. Backup PostgreSQL và media.
5. Kiểm tra secret/configuration của môi trường đích.
6. Triển khai ứng dụng và migration đã được duyệt.
7. Kiểm tra health, website, Backoffice và log.
8. Xác minh rollback.

Lệnh kiểm tra solution:

```powershell
dotnet restore AnToanTaiChinh.sln
dotnet build AnToanTaiChinh.sln --configuration Release
dotnet test AnToanTaiChinh.sln --configuration Release --no-build
```

## PostgreSQL local

```powershell
docker compose up -d
docker compose ps
docker compose logs -f attc-admin-db
```

Sao lưu local:

```powershell
docker exec attc-admin-db pg_dump -U admin -d attc-admin-db -Fc -f /tmp/attc-admin-db.dump
docker cp attc-admin-db:/tmp/attc-admin-db.dump .\backups\attc-admin-db.dump
```

File backup phải được lưu ngoài source control và kiểm thử khả năng phục hồi định kỳ.

## Rollback

- Giữ artifact phiên bản trước.
- Không rollback code qua một migration database không tương thích nếu chưa có kế hoạch phục hồi.
- Nếu thay đổi schema, ghi rõ migration thuận, migration ngược hoặc phương án restore backup.
- Sau rollback, kiểm tra Backoffice, website, database connectivity và log lỗi.
