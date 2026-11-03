# Công cụ dữ liệu Portal v2

Bộ script dựng mockup backoffice, phụ lục trường, dữ liệu mẫu (seed) và file kế hoạch Excel từ bản dựng v2. Thiết kế chung ở `docs/ban-giao/PORTAL-V2/1-thiet-ke.md`, nằm ở repo chính, nhánh `main`.

| File | Việc |
|---|---|
| `tach-ban-dung-don.js` | Tách bản dựng một file `antoantaichinh_co_anh_nen_sang.html` (QĐ-051, QĐ-052) thành `ban-dung-moi/build/app.js`, `data.json` và 39 ảnh `ban-dung-moi/anh/minh-hoa-<số>.jpg` kèm `alt.json`. Thư mục `ban-dung-moi/` không commit |
| `tach-du-lieu-ban-dung.js` | Tách các bảng dữ liệu trong `build/app.js` và `build/data.json` của bản dựng thành `v2data.json` |
| `build_bo.py` | Dựng 157 nút mẫu từ `v2data.json` và `data.json`, ghép vào `mockup-src.html`, ra `mockup-o-nhap-backoffice.html` |
| `mockup-src.html` | Khung mockup: giao diện, schema form (`T`), các thành phần combobox, bảng, thẻ, ma trận |
| `alias_map.js` | Bảng đổi alias viết tắt trong mockup sang alias chuẩn |
| `dump_schema.js` | In Phụ lục A (trường của từng loại) từ schema mockup |
| `xuat-seed.js` | Xuất `seed-portal-v2.json` cho công cụ `Tools/ImportPortalV2` (V2-01g, V2-12a) |
| `make_xlsx.py` | Dựng file kế hoạch Excel từ `1-thiet-ke.md` và `docs/quyet-dinh.md` |
| `seed-portal-v2.json` | Dữ liệu mẫu đã sinh. Không sửa tay |

## Chạy lại

Chạy trong thư mục này. `v2data.json` là file trung gian, không commit.

```
node tach-ban-dung-don.js <đường dẫn>/antoantaichinh_co_anh_nen_sang.html ban-dung-moi
node tach-du-lieu-ban-dung.js ban-dung-moi/build v2data.json
python -I build_bo.py v2data.json ban-dung-moi/build/data.json mockup-src.html ../mockup-o-nhap-backoffice.html
node dump_schema.js ../mockup-o-nhap-backoffice.html phu-luc-a.md
node xuat-seed.js ../mockup-o-nhap-backoffice.html seed-portal-v2.json
python make_xlsx.py ../1-thiet-ke.md ../../../quyet-dinh.md ../Ke-hoach-portal-v2.xlsx
```

Từ 2026-11-03 (QĐ-051) nguồn là bản dựng mới; trước đó: dựng lại từ bản dựng v2 ra mockup giống hệt bản đang commit (khác mỗi kiểu xuống dòng do `core.autocrlf`), ra seed giống hệt, và Phụ lục A khớp `1-thiet-ke.md`.

`make_xlsx.py` cần `openpyxl` và chạy bằng `python` thường: `python -I` bỏ qua thư viện cài theo người dùng nên không thấy `openpyxl`.

## Định dạng `seed-portal-v2.json`

- `nodes[]`: mỗi nút có:
  - `key`: GUID v5 tính từ mã nút trong mockup, nên chạy lại vẫn ra cùng khóa;
  - `parentKey`, `contentType` (alias loại chuẩn);
  - `name`, `state` (`published` hoặc `draft`), `sortOrder`;
  - `values`: theo alias của Phụ lục A.
- Ảnh minh họa trong `media[]` mang tên `minh-hoa-<số>.jpg`, lấy ở `ban-dung-moi/anh/`.
- Tham chiếu tới nút khác là `key` của nút đó.
- Giá trị danh sách cố định là mã (`ratCao`, `goi`…). Bảng mã và chữ hiển thị ở `fixedLists`, theo Phụ lục B1. Công cụ nhập đổi mã sang chữ bằng `DanhMucCoDinh`.
- Dòng của `Antc.InlineList` và hàng ma trận có `key` riêng. Ô bật tắt của ma trận nằm ở `match.step1`, `match.step2`, `match.step3`; giá trị là `key` của dòng lựa chọn ở `step1Options`, `step2Options`, `step3Options`.
- Ảnh và tệp là `{ "media": "<tên tệp>" }`. Công cụ nhập tạo mục Phương tiện giữ chỗ nếu chưa có.
- `fields`: kiểu của từng alias, để công cụ nhập biết cách ghi giá trị.

Kiểm khi xuất: script dừng với mã lỗi 1 nếu có tham chiếu trỏ tới nút không tồn tại.
