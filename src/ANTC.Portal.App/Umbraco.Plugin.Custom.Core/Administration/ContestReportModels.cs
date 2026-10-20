namespace Umbraco.Plugin.Custom.Core.Administration;

public sealed class ContestReportFilter
{
    public long? ContestId { get; set; }
    public string? Mode { get; set; }
    public string? Status { get; set; }
    public bool? HasPhone { get; set; }
    public int? ScoreFrom { get; set; }
    public int? ScoreTo { get; set; }
    public DateOnly? From { get; set; }
    public DateOnly? To { get; set; }
    public string? Search { get; set; }
    public string Sort { get; set; } = "created_desc";
    public int Page { get; set; } = 1;

    public Dictionary<string,string> Validate()
    {
        var errors = new Dictionary<string,string>();
        if (ContestId is <= 0) errors[nameof(ContestId)] = "Cuộc thi không hợp lệ.";
        if (Mode is not (null or "" or "named" or "anon")) errors[nameof(Mode)] = "Chế độ không hợp lệ.";
        if (Status is not (null or "" or "submitted" or "in_progress")) errors[nameof(Status)] = "Trạng thái không hợp lệ.";
        if (ScoreFrom < 0 || ScoreTo < 0 || ScoreFrom > ScoreTo) errors[nameof(ScoreFrom)] = "Khoảng điểm không hợp lệ.";
        if (From > To) errors[nameof(From)] = "Đến ngày phải bằng hoặc sau từ ngày.";
        if (From == DateOnly.MinValue) errors[nameof(From)] = "Ngày bắt đầu không hợp lệ.";
        if (Search?.Length > 150) errors[nameof(Search)] = "Từ khóa tối đa 150 ký tự.";
        if (Sort is not ("created_desc" or "created_asc" or "score_desc" or "score_asc" or "submitted_desc")) errors[nameof(Sort)] = "Cách sắp xếp không hợp lệ.";
        if (Page is < 1 or > 1000000) errors[nameof(Page)] = "Số trang không hợp lệ.";
        return errors;
    }

}

public record ContestChoice(long Id, string Name);
public record ReportTopic(int Id, string Title);
public record ReportEntry(long Id, long? ContestId, string Code, string? FullName, string? Phone, string? Org,
    string Mode, int? AttemptNo, string Status, int Answered, int Correct, DateTime CreatedAt, DateTime? SubmittedAt);
public record EntryReportPage(IReadOnlyList<ReportEntry> Items, int Total, int Page)
{
    public int Pages => (int)Math.Ceiling(Total / 50d);
}
public record ScoreFrequency(int Score, int Count);
public record DayFrequency(DateTime Day, int Count);
public record ContestDashboard(int Created, int Submitted, int Named, int Anonymous, int DistinctPhones,
    IReadOnlyList<ScoreFrequency> Scores, IReadOnlyList<DayFrequency> Days);
public record DetailQuestion(string Code, int TopicId, string TopicTitle, string Text, string? CorrectAnswer,
    string? Chosen, bool? Correct, DateTime? AnsweredAt);
public record DetailTopic(int TopicId, string Title, int Correct, int Answered, int Total);
public record EntryReportDetail(ReportEntry Entry, IReadOnlyList<DetailQuestion> Questions, IReadOnlyList<DetailTopic> Topics, bool HasSnapshot);
public record QuestionReport(long? ContestId, string ContestName, string Code, int TopicId, string Text,
    int Answered, int Correct, int A, int B, int C, int D)
{
    public decimal? CorrectRate => Answered == 0 ? null : (decimal)Correct / Answered;
}
