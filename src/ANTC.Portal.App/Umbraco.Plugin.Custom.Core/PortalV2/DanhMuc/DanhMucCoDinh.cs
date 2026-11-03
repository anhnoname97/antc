namespace Umbraco.Plugin.Custom.Core.PortalV2.DanhMuc;

/// <summary>Mot muc cua danh sach co dinh: ma luu trong code, chu hien thi luu trong Dropdown cua Umbraco.</summary>
public sealed record MucDanhMuc(string Code, string Label);

/// <summary>Danh sach co dinh gan voi logic (Phu luc B1). Doi chu cua muc da co bai dung la viec lap trinh.</summary>
public sealed class DanhSachCoDinh(string id, string dataTypeName, IReadOnlyList<MucDanhMuc> items)
{
    public string Id { get; } = id;
    public string DataTypeName { get; } = dataTypeName;
    public IReadOnlyList<MucDanhMuc> Items { get; } = items;

    public string? Label(string? code) => Items.FirstOrDefault(x => x.Code == code)?.Label;
    public string? Code(string? label) => Items.FirstOrDefault(x => x.Label == label)?.Code;
    public bool HasCode(string? code) => Items.Any(x => x.Code == code);
}

/// <summary>
/// Cac danh sach co dinh cua Portal v2. Ma dung trong InlineList, ma tran va code;
/// chu hien thi dung trong data type Dropdown (Umbraco luu chu). Xem 4-contract-du-lieu.md muc C5, C7.
/// </summary>
public static class DanhMucCoDinh
{
    private static DanhSachCoDinh List(string id, string name, params (string Code, string Label)[] items)
        => new(id, name, items.Select(x => new MucDanhMuc(x.Code, x.Label)).ToArray());

    public static readonly DanhSachCoDinh MucDo = List("mucDo", "Danh mục · Mức độ cần thận trọng",
        ("thuong", "Cần thận trọng"), ("cao", "Cao"), ("ratCao", "Rất cao"));

    public static readonly DanhSachCoDinh LoaiBai = List("loaiBai", "Danh mục · Loại bài",
        ("huongDan", "Bài hướng dẫn"), ("docChuyenDe", "Bài đọc chuyên đề"), ("docThem", "Bài đọc thêm"));

    // QD-051: loai cau cua kiem tra nhanh va nghia cua lua chon rieng
    public static readonly DanhSachCoDinh LoaiCauKiemTra = List("loaiCauKiemTra", "Danh mục · Loại câu kiểm tra",
        ("phaiDung", "Phải dừng"), ("tamHoan", "Tạm hoãn"), ("canKiemTra", "Cần kiểm tra"));

    public static readonly DanhSachCoDinh NghiaCauTraLoi = List("nghiaCauTraLoi", "Danh mục · Nghĩa câu trả lời",
        ("co", "Có"), ("khong", "Không"), ("chuaBiet", "Chưa biết"));

    public static readonly DanhSachCoDinh HinhThucLienHe = List("hinhThucLienHe", "Danh mục · Hình thức liên hệ",
        ("goi", "Gọi"), ("nhanTin", "Nhắn tin"), ("goiVaNhanTin", "Gọi và nhắn tin"));

    public static readonly DanhSachCoDinh KieuCuaVao = List("kieuCuaVao", "Danh mục · Kiểu cửa vào",
        ("moTrang", "Mở trang ngay"), ("moDanhSach", "Mở danh sách lựa chọn"));

    public static readonly DanhSachCoDinh HinhMinhHoaCuaVao = List("hinhMinhHoaCuaVao", "Danh mục · Hình minh họa cửa vào",
        ("threat", "Bị đe dọa"), ("harm", "Đã có chuyện"), ("check", "Chưa có chuyện"));

    public static readonly DanhSachCoDinh DaiTrenCung = List("daiTrenCung", "Danh mục · Dải trên cùng",
        ("thu", "Bản dựng thử"), ("diaChi", "Địa chỉ duy nhất"), ("an", "Ẩn"));

    // Ten bieu tuong trung voi sprite SVG cua ban dung; chu hien thi dang "Ten · ma" de bien tap vien de nhan ra.
    public static readonly DanhSachCoDinh BieuTuong = new("bieuTuong", "Danh mục · Biểu tượng", new (string Code, string Name)[]
    {
        ("money", "Tiền"), ("key", "Khóa, mã"), ("link", "Đường link"), ("app", "Ứng dụng"), ("call", "Cuộc gọi"),
        ("phone", "Điện thoại"), ("chat", "Tin nhắn"), ("users", "Nhóm người"), ("person", "Một người"), ("shield", "Khiên"),
        ("alert", "Cảnh báo"), ("lock", "Ổ khóa"), ("face", "Khuôn mặt"), ("id", "Giấy tờ"), ("sim", "SIM"),
        ("hush", "Giữ bí mật"), ("stop", "Dừng lại"), ("clock", "Đồng hồ"), ("chart", "Biểu đồ"), ("coins", "Đồng xu"),
        ("brief", "Cặp tài liệu"), ("cart", "Mua sắm"), ("mail", "Thư"), ("globe", "Website"), ("book", "Sách"),
        ("doc", "Tài liệu"), ("pen", "Bút ký"), ("quiz", "Câu hỏi"), ("search", "Tìm, kiểm tra"), ("inbox", "Hộp thư đến"),
        ("gift", "Quà"), ("home", "Nhà"), ("mega", "Loa"), ("trophy", "Cúp"),
    }.Select(x => new MucDanhMuc(x.Code, x.Name + " · " + x.Code)).ToArray());

    public static IReadOnlyList<DanhSachCoDinh> All { get; } =
        [MucDo, LoaiBai, HinhThucLienHe, KieuCuaVao, HinhMinhHoaCuaVao, DaiTrenCung, BieuTuong, LoaiCauKiemTra, NghiaCauTraLoi];

    public static DanhSachCoDinh? Get(string? id) => All.FirstOrDefault(x => x.Id == id);

    /// <summary>Chu cu da luu trong noi dung, doi sang chu moi cua cung ma (QD-051).</summary>
    public static IReadOnlyList<(DanhSachCoDinh List, string OldLabel, string Code)> Renamed { get; } =
        [(MucDo, "Thường", "thuong")];

    /// <summary>Data type cua danh sach da bo (QD-051). Bo dung xoa neu khong con thuoc tinh nao dung.</summary>
    public static IReadOnlyList<string> Retired { get; } = ["Danh mục · Màu kết quả", "Danh mục · Trả lời là dấu hiệu"];
}
