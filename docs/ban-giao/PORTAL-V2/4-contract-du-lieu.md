# Portal v2: contract dữ liệu của thành phần tự viết

Ngày: 2026-11-03 · Bổ sung mục Contract của `1-thiet-ke.md` (C1–C4). Mã C5–C7 dùng chung cho luồng `chính`, `V2-ui` và `V2-web`. Đổi contract thì thêm quyết định mới, không sửa lặng lẽ.

Nguồn: QĐ-042 (cách nhập), QĐ-034 (ma trận), QĐ-044 (trường điều kiện), `3-thay-block-list.md` mục 3, Phụ lục A của `1-thiet-ke.md`, `cong-cu/seed-portal-v2.json`.

## C5 · `Antc.InlineList`

Schema riêng: `DataEditor` alias `Antc.InlineList`, kiểu giá trị JSON. Mỗi trường "InlineList · Bảng / Thẻ" ở Phụ lục A có một data type riêng; cấu hình lấy đúng các dòng "↳" của trường đó.

### Cấu hình data type

```json
{
  "layout": "table",
  "minRows": 1,
  "maxRows": 6,
  "sortable": true,
  "summaryField": "mainText",
  "unitLabel": "bước",
  "fields": [
    { "alias": "number", "label": "Số", "type": "text", "required": true, "maxChars": 6,
      "pattern": "^\\d{3,6}$", "patternMessage": "Chỉ gồm chữ số, 3–6 số.", "width": "90px" },
    { "alias": "contactMode", "label": "Hình thức", "type": "fixed", "list": "hinhThucLienHe", "required": true, "width": "190px" },
    { "alias": "description", "label": "Mô tả", "type": "area", "required": true, "maxChars": 200 },
    { "alias": "smsSyntax", "label": "Cú pháp tin nhắn", "type": "text", "maxChars": 120, "placement": "extra",
      "description": "Chỉ khi có nhắn tin" }
  ],
  "optionalSection": null
}
```

| Khóa | Kiểu | Ý nghĩa |
|---|---|---|
| `layout` | `"table"` \| `"cards"` | Dạng Bảng hoặc Thẻ (QĐ-042). Bảng tự chuyển sang thẻ khi khung hẹp hơn 720 px; đó là việc của giao diện, không đổi giá trị |
| `minRows`, `maxRows` | số | Số dòng. Bằng nhau thì là danh sách cố định: không thêm, không xóa |
| `sortable` | bool | Cho kéo sắp |
| `summaryField` | alias | Dạng Thẻ: ô dùng làm dòng tóm tắt khi thẻ đóng |
| `unitLabel` | chữ | Dạng Thẻ: "bước", "cửa", "nhóm"… dùng trong nút "Thêm … ở đây" |
| `fields[]` | danh sách ô | Xem bảng dưới |
| `optionalSection` | đối tượng hoặc `null` | Phần bật tắt trong thẻ, ví dụ "Hỏi thêm": `{ "toggleAlias": "hasFollowUp", "label": "Hỏi thêm", "addLabel": "Thêm câu hỏi rẽ nhánh", "fields": [...] }` |

Mỗi ô (`fields[]`):

| Khóa | Bắt buộc | Ý nghĩa |
|---|---|---|
| `alias` | ✔ | camelCase tiếng Anh, đúng Phụ lục A (phần sau `[].`) |
| `label` | ✔ | Nhãn tiếng Việt |
| `type` | ✔ | `text`, `area`, `number`, `date`, `toggle`, `fixed`, `content`, `lines`, `table` |
| `required` | | Bắt buộc khi ô đang hiện |
| `maxChars` | | `text`, `area` |
| `min`, `max` | | `number`: khoảng giá trị. `lines`, `content` nhiều mục, `table`: số mục |
| `pattern`, `patternMessage` | | Regex và câu báo lỗi tiếng Việt |
| `placement` | | `"main"` (mặc định) hoặc `"extra"`: nằm ở dòng mở rộng ▸ của dạng Bảng |
| `width` | | Dạng Bảng: bề rộng cột, ví dụ `"190px"`, `"30%"` |
| `description` | | Câu hướng dẫn dưới nhãn |
| `list` | khi `fixed` | Mã danh sách trong `DanhMucCoDinh`: `mucDo`, `loaiBai`, `mauKetQua`, `traLoiDauHieu`, `hinhThucLienHe`, `kieuCuaVao`, `hinhMinhHoaCuaVao`, `daiTrenCung`, `bieuTuong` |
| `multiple`, `allowedContentTypes`, `startNode` | khi `content` | Chọn một hay nhiều; alias loại được chọn; khóa nút gốc. Giao diện dùng combobox (QĐ-039) |
| `fields`, `minRows`, `maxRows` | khi `table` | Bảng nhỏ lồng một cấp. Không lồng tiếp |
| `showWhen` | | Chỉ hiện khi ô khác trong cùng dòng có giá trị: `{ "field": "openMode", "equals": "moDanhSach" }`. Ô ẩn không kiểm bắt buộc và không lưu giá trị |

### Giá trị lưu

Mảng các dòng, theo thứ tự hiện. Mỗi dòng có `key` GUID, sinh khi tạo dòng, không đổi khi sửa hay kéo sắp. Các ô nằm ngang hàng `key`, theo alias.

```json
[
  { "key": "3f2a…", "number": "113", "contactMode": "goi", "description": "Chỉ khi có nguy hiểm tức thời…" },
  { "key": "9c1d…", "number": "5656", "contactMode": "nhanTin", "description": "…", "smsSyntax": "…" }
]
```

| Kiểu ô | Lưu thành |
|---|---|
| `text`, `area` | chuỗi |
| `number` | số |
| `date` | chuỗi `yyyy-MM-dd` |
| `toggle` | `true` \| `false` |
| `fixed` | **mã** (`goi`, `ratCao`…), không phải chữ hiển thị. Đổi chữ ở `DanhMucCoDinh` không làm hỏng dữ liệu |
| `content` | khóa GUID của nút (chuỗi), hoặc mảng khóa khi `multiple` |
| `lines` | mảng chuỗi, bỏ dòng trống |
| `table` | mảng dòng con, mỗi dòng có `key` |
| phần tùy chọn | ô `toggleAlias` là `true` \| `false`; tắt thì các ô của phần đó không lưu |

Ô rỗng thì bỏ khỏi dòng, không lưu `""` hay `null`. Dữ liệu mẫu `seed-portal-v2.json` theo đúng định dạng này.

### Phía máy chủ

| Phần | Hành vi |
|---|---|
| Kiểm khi lưu | JSON đúng cấu trúc; số dòng trong `minRows`–`maxRows`; ô `required` đang hiện có giá trị; `maxChars`; `pattern`; `number` trong khoảng; mã `fixed` có trong danh sách; khóa `content` đúng định dạng GUID. Lỗi trả về theo đường dẫn ô, ví dụ `stateHotlines[1].number` |
| Tham chiếu | `IDataValueReferenceFactory` báo mọi khóa ở ô `content`, kể cả trong bảng lồng, để `DisableDeleteWhenReferenced` chặn xóa |
| Đọc trong view | Value converter trả `InlineListValue`: danh sách `InlineListRow` có `Key`, `GetString(alias)`, `GetBool`, `GetNumber`, `GetDate`, `GetCode`, `GetLines`, `GetKey`, `GetKeys`, `GetRows(alias)` |
| Chưa có giao diện riêng | Khung V2-01m đăng ký editor với giao diện tạm là ô JSON thô, để luồng `chính` tạo được loại nội dung trước khi luồng `V2-ui` làm xong Bảng và Thẻ |

## C6 · `Antc.WizardMatrix`

Schema riêng, kiểu giá trị JSON, dùng ở `wizardPage.situationMatrix`. Lựa chọn của 3 bước nằm ở ba trường `step1Options`, `step2Options`, `step3Options` (C5, dạng Bảng, ô `label` và `icon`). Ma trận trỏ tới `key` của các dòng lựa chọn đó.

```json
{
  "rows": [
    { "key": "24cc1d67-…", "name": "Giả mạo ngân hàng yêu cầu OTP", "cautionLevel": "ratCao",
      "signs": ["…", "…"], "actions": ["…"], "guideArticle": "<khóa bài hoặc cảnh báo>", "checklist": "<khóa checklist>",
      "enabled": true,
      "match": { "step1": ["<key dòng step1Options>"], "step2": ["…"], "step3": ["…"] } }
  ]
}
```

| Khóa | Kiểm |
|---|---|
| `name` | Bắt buộc, tối đa 80 ký tự |
| `cautionLevel` | Mã `thuong`, `cao`, `ratCao` |
| `signs` | 1–3 dòng |
| `actions` | 1–4 dòng |
| `guideArticle` | Bắt buộc, khóa `riskArticlePage`, `alertPage` hoặc `viecCanLamPage` |
| `checklist` | Không bắt buộc. Trống thì dùng `defaultChecklist` của trang |
| `enabled` | Hàng tắt thì không tính, không kiểm |
| `match` | Khi xuất bản, hàng đang dùng phải có ít nhất một khóa ở `step2` hoặc `step3`. Khóa trỏ tới lựa chọn đã xóa thì bỏ qua và ghi log |

- **Tham chiếu:** báo `guideArticle` và `checklist` của mọi hàng.
- **Cách tính điểm:** ở `rule` trong `cong-cu/wizard-cases.json`.
- **Bộ ca kiểm:** 12 ca, sinh từ hàm tính điểm của mockup bằng `cong-cu/sinh-ca-kiem-trinh-hoi.js`. `WizardScoring` (C#), giao diện ma trận và `wizard.js` của website phải ra đúng mọi ca.

## C7 · Ghi giá trị vào thuộc tính có sẵn của Umbraco

Dùng cho công cụ nhập (`Tools/ImportPortalV2`) và khi đọc trong view.

| Kiểu nhập ở Phụ lục A | Editor | Công cụ nhập ghi |
|---|---|---|
| Chữ, Đoạn, Mã, Liên kết | TextBox, TextArea | chuỗi |
| Số | Integer | số nguyên |
| Ngày | DateTime | `DateTime` (giờ 00:00) |
| Bật/tắt | TrueFalse | `bool` |
| Danh mục · … | DropDown.Flexible | **chữ hiển thị**, lấy từ mã qua `DanhMucCoDinh` (Umbraco lưu chữ; xem `2-danh-muc…` mục 3.1) |
| Chọn · … | MultiNodeTreePicker | danh sách UDI `umb://document/<khóa không gạch>` nối bằng dấu phẩy |
| Danh sách dòng | MultipleTextstring | các dòng nối bằng `\n` |
| Thẻ · … | Tags (JSON) | mảng chuỗi dạng JSON |
| Soạn thảo · … | RichText (Tiptap) | HTML, qua `ArticleHtmlSanitizer` |
| Chọn ảnh, Chọn tệp PDF | MediaPicker3 | mục Phương tiện theo tên tệp; chưa có thì tạo mục giữ chỗ |
| InlineList, WizardMatrix | `Antc.*` | chuỗi JSON theo C5, C6 |

Khóa nút, khóa loại nội dung và khóa data type là GUID v5. Không gian tên `6b1f3c1e-5a0e-4c4b-9a5e-2f0c8d7a9e11`, tên theo mẫu:
- `node:<mã mockup>` (khóa nút, giống seed);
- `contenttype:<alias>`;
- `datatype:<tên data type>`;
- `property:<alias loại>.<alias trường>`.

C# dùng `PortalV2Keys`, JS dùng `xuat-seed.js`; hai bên ra cùng khóa.
