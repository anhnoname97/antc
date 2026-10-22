namespace Umbraco.Plugin.Custom.Core.Data;

// Cac bang cua CSDL ung dung (App_Data/app.sqlite.db), tach khoi CSDL cua Umbraco.
// Mo ta tung cot: sheet "CSDL" trong docs/ke-hoach/Ke-hoach-cong-viec-antoantaichinh-v3.xlsx.
// Moi thoi diem luu theo UTC.

/// <summary>Mot luot thi.</summary>
public class Entry
{
    public long Id { get; set; }
    /// <summary>Cuộc thi của lượt này; null chỉ dành cho dữ liệu cũ trước migration nhiều cuộc thi.</summary>
    public long? ContestId { get; set; }
    /// <summary>Ma du thi hien thi cho thi sinh, dang AD-XXXXXX.</summary>
    public string Code { get; set; } = "";
    /// <summary>SHA-256 cua token; token goc khong luu.</summary>
    public string TokenHash { get; set; } = "";
    /// <summary>named | anon</summary>
    public string Mode { get; set; } = EntryModes.Anon;
    public string? FullName { get; set; }
    /// <summary>So dien thoai da chuan hoa 0xxxxxxxxx.</summary>
    public string? Phone { get; set; }
    public string? Org { get; set; }
    public DateTime? ConsentAt { get; set; }
    public int? AttemptNo { get; set; }
    /// <summary>in_progress | submitted</summary>
    public string Status { get; set; } = EntryStatuses.InProgress;
    public int Answered { get; set; }
    public int? Score { get; set; }
    /// <summary>So cau dang dung trong ngan hang tai thoi diem nop bai.</summary>
    public int? TotalQuestions { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    /// <summary>JSON kết quả chốt khi nộp bài; trả nguyên bản khi nộp lại, không tính lại.</summary>
    public string? SubmissionResultJson { get; set; }
    public string? IpHash { get; set; }

    public ContestCampaign? Contest { get; set; }
    public List<EntryAnswer> Answers { get; set; } = new();
}

public static class EntryModes
{
    public const string Named = "named";
    public const string Anon = "anon";
}

public static class EntryStatuses
{
    public const string InProgress = "in_progress";
    public const string Submitted = "submitted";
}

/// <summary>Dap an cua mot cau trong mot luot thi. Khoa chinh (EntryId, QuestionCode): lan ghi dau thang.</summary>
public class EntryAnswer
{
    public long EntryId { get; set; }
    public string QuestionCode { get; set; } = "";
    public int Topic { get; set; }
    public string Chosen { get; set; } = "";
    public bool IsCorrect { get; set; }
    public DateTime AnsweredAt { get; set; }

    public Entry? Entry { get; set; }
}

/// <summary>Mot lan quay so.</summary>
public class Draw
{
    public long Id { get; set; }
    /// <summary>Cuộc thi được dùng để xác định tập người đủ điều kiện.</summary>
    public long? ContestId { get; set; }
    public long? PrizeId { get; set; }
    /// <summary>Prize labels frozen at draw time, independent of later catalogue edits.</summary>
    public string? PrizeCode { get; set; }
    public string? PrizeName { get; set; }
    public ContestPrize? PrizeAllocation { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = "";
    public int MinScore { get; set; }
    public int WinnersRequested { get; set; }
    public int EligibleCount { get; set; }
    public bool ExcludePrevious { get; set; }
    public string? Note { get; set; }

    /// <summary>Exact eligible-person snapshot. Null for legacy draws: never reconstruct from live entries.</summary>
    public string? EligibleSnapshotJson { get; set; }
    public Guid? RequestId { get; set; }

    public List<DrawWinner> Winners { get; set; } = new();
    public ContestCampaign? Contest { get; set; }
}

/// <summary>Nguoi trung trong mot lan quay; chup lai thong tin tai thoi diem quay.</summary>
public class DrawWinner
{
    public long DrawId { get; set; }
    public int Rank { get; set; }
    public long? EntryId { get; set; }
    public string Code { get; set; } = "";
    public string FullName { get; set; } = "";
    public string Phone { get; set; } = "";
    public int Score { get; set; }

    public Draw? Draw { get; set; }
}

/// <summary>Cau hoi, kien nghi, gop y gui tu trang Hoi - Dap.</summary>
public class QuestionSubmission
{
    public long Id { get; set; }
    /// <summary>cau-hoi | gop-y</summary>
    public string Type { get; set; } = "cau-hoi";
    public string Content { get; set; } = "";
    public bool WantReply { get; set; }
    public string? Contact { get; set; }
    /// <summary>Thời điểm người gửi portal đồng ý; để trống với nội dung do ban biên tập tạo.</summary>
    public DateTime? ConsentAt { get; set; }
    public string Source { get; set; } = "portal";
    public string? CreatedBy { get; set; }
    /// <summary>moi | dang-xu-ly | da-xu-ly | bo-qua</summary>
    public string Status { get; set; } = "moi";
    public string? AdminNote { get; set; }
    public string? HandledBy { get; set; }
    public DateTime? HandledAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? IpHash { get; set; }
    /// <summary>Câu trả lời đang soạn; nội dung câu hỏi gốc không sửa qua quản trị.</summary>
    public string? Answer { get; set; }
    /// <summary>Bản câu trả lời đã được duyệt; sửa nháp không thay đổi bản đang công khai.</summary>
    public string? PublishedAnswer { get; set; }
    public string? GuidanceLabel { get; set; }
    public string? GuidanceUrl { get; set; }
    public string? PublishedGuidanceLabel { get; set; }
    public string? PublishedGuidanceUrl { get; set; }
    public bool IsPublished { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovedBy { get; set; }
    public long ReviewVersion { get; set; }
    public long? AggregatedIntoId { get; set; }
    /// <summary>JSON chứa ID nguồn, giữ dấu vết sau khi nội dung nguồn được dọn.</summary>
    public string? AggregatedSourceIds { get; set; }
    public DateTime? DeletedAt { get; set; }
    public string? DeletedBy { get; set; }
}

public class QuestionRetentionPolicy
{
    public int Id { get; set; } = 1;
    public bool Enabled { get; set; }
    public int RetentionDays { get; set; } = 365;
    public long ReviewVersion { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime? LastRunAt { get; set; }
    public int LastDeletedCount { get; set; }
}

/// <summary>Chuyen de cua ngan hang cau hoi.</summary>
public class QuizTopic
{
    /// <summary>So chuyen de (hien la 1-8), khong tu tang.</summary>
    public int Id { get; set; }
    public string Title { get; set; } = "";
    /// <summary>JSON: mang cac doan gioi thieu.</summary>
    public string Intro { get; set; } = "[]";
    /// <summary>JSON: mang cap [tu, giai nghia].</summary>
    public string? Terms { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime UpdatedAt { get; set; }
    public long Revision { get; set; } = 1;

    public List<QuizQuestion> Questions { get; set; } = new();
    public List<ContestTopic> Contests { get; set; } = new();
}

/// <summary>Cau hoi. Khong xoa han khi da co nguoi tra loi; chi dat IsActive = false.</summary>
public class QuizQuestion
{
    /// <summary>Ma cau hoi, vi du CĐ1-001, TN-44, TH04-03. Chuyen de lay tu TopicId, khong suy tu ma.</summary>
    public string Code { get; set; } = "";
    public int TopicId { get; set; }
    public string Kind { get; set; } = "";
    public string? Situation { get; set; }
    public string Question { get; set; } = "";
    /// <summary>JSON: mang [chu cai, noi dung], 2 den 4 phan tu.</summary>
    public string Options { get; set; } = "[]";
    public string Answer { get; set; } = "";
    /// <summary>JSON: giai thich cho tung chu cai.</summary>
    public string Explanations { get; set; } = "{}";
    public string? SafeAction { get; set; }
    /// <summary>So giay khoa nut di tiep sau khi tra loi.</summary>
    public int ReadSeconds { get; set; }
    /// <summary>Thu tu trong bo Thu suc; null la khong dung cho Thu suc.</summary>
    public int? SampleOrder { get; set; }
    public string? SampleLabel { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime UpdatedAt { get; set; }
    public long Revision { get; set; } = 1;

    public QuizTopic? Topic { get; set; }
    public List<ContestQuestion> Contests { get; set; } = new();
}

/// <summary>Một cuộc thi độc lập, có thể diễn ra trong bất kỳ khoảng ngày/giờ nào.</summary>
public class ContestCampaign
{
    public long Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }
    public int MaxAttempts { get; set; } = 2;
    /// <summary>So gio con cho nop bai sau EndAt (QD-014 theo cuoc).</summary>
    public int SubmitGraceHours { get; set; } = 24;
    /// <summary>He so thoi gian doc moi cau (1 = mac dinh).</summary>
    public decimal ReadTimerFactor { get; set; } = 1m;
    /// <summary>Khoa linh vuc (trang Thu doan) de hien nhan; rong neu khong gan.</summary>
    public string? FocusArea { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    /// <summary>Phiên bản ngân hàng tại lúc cấu hình được lưu.</summary>
    public long BankVersion { get; set; }
    public long Revision { get; set; } = 1;

    public List<ContestTopic> Topics { get; set; } = new();
    public List<ContestQuestion> Questions { get; set; } = new();
    public List<Entry> Entries { get; set; } = new();
    public List<Draw> Draws { get; set; } = new();
    public List<ContestPrize> Prizes { get; set; } = new();
}

public class Prize
{
    public long Id { get; set; }
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public long Revision { get; set; } = 1;
    public List<ContestPrize> Contests { get; set; } = new();
}

/// <summary>Many-to-many allocation. Quantity belongs to the contest, not the catalogue.</summary>
public class ContestPrize
{
    public long PrizeMoney { get; set; }
    public long ContestId { get; set; }
    public long PrizeId { get; set; }
    public int Quantity { get; set; }
    public int SortOrder { get; set; }
    public ContestCampaign? Contest { get; set; }
    public Prize? Prize { get; set; }
    public List<Draw> Draws { get; set; } = new();
}

/// <summary>Chuyên đề được chọn cho một cuộc thi.</summary>
public class ContestTopic
{
    public long ContestId { get; set; }
    public int TopicId { get; set; }
    public int SortOrder { get; set; }
    /// <summary>Bản chụp dữ liệu chuyên đề để lịch sử cuộc thi không đổi theo ngân hàng.</summary>
    public string Title { get; set; } = "";
    public string Intro { get; set; } = "[]";
    public string? Terms { get; set; }

    public ContestCampaign? Contest { get; set; }
    public QuizTopic? Topic { get; set; }
}

/// <summary>Câu hỏi được chọn trong một chuyên đề của cuộc thi.</summary>
public class ContestQuestion
{
    public long ContestId { get; set; }
    public string QuestionCode { get; set; } = "";
    public int TopicId { get; set; }
    public int SortOrder { get; set; }
    /// <summary>Bản chụp đầy đủ nội dung và đáp án tại lúc lưu cuộc thi.</summary>
    public string Kind { get; set; } = "";
    public string? Situation { get; set; }
    public string QuestionText { get; set; } = "";
    public string Options { get; set; } = "[]";
    public string Answer { get; set; } = "";
    public string Explanations { get; set; } = "{}";
    public string? SafeAction { get; set; }
    public int ReadSeconds { get; set; }
    public int? SampleOrder { get; set; }
    public string? SampleLabel { get; set; }

    public ContestCampaign? Contest { get; set; }
    public QuizQuestion? Question { get; set; }
}

/// <summary>Lich su nhap ma tran cau hoi. Id cung la so phien ban ngan hang.</summary>
public class QuizImport
{
    public long Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = "";
    public string FileName { get; set; } = "";
    public int Added { get; set; }
    public int Updated { get; set; }
    public int Deactivated { get; set; }
    public bool DuringContest { get; set; }
}
