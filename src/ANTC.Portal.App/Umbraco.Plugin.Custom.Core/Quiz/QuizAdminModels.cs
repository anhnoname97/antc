namespace Umbraco.Plugin.Custom.Core.Quiz;

public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalItems, int TotalPages);

public sealed record QuizTopicAdminDto(
    int Id,
    string Title,
    IReadOnlyList<string> Intro,
    IReadOnlyList<QuizTermAdminDto> Terms,
    bool IsActive,
    int QuestionCount,
    int ActiveQuestionCount,
    DateTime UpdatedAt,
    long Revision = 1);

public sealed record QuizTermAdminDto(string Term, string Definition);

public sealed record SaveQuizTopicRequest(
    int Id,
    string? Title,
    IReadOnlyList<string>? Intro,
    IReadOnlyList<QuizTermAdminDto>? Terms,
    bool IsActive = true,
    long? ExpectedRevision = null);

public sealed record QuizAnswerAdminDto(string Key, string Text, string Explanation, bool IsCorrect);

public sealed record QuizQuestionAdminDto(
    string Code,
    int TopicId,
    string TopicTitle,
    string Kind,
    string Situation,
    string Question,
    IReadOnlyList<QuizAnswerAdminDto> Answers,
    string CorrectAnswer,
    string SafeAction,
    int ReadSeconds,
    int? SampleOrder,
    string? SampleLabel,
    int SortOrder,
    bool IsActive,
    DateTime UpdatedAt,
    long Revision = 1);

public sealed record SaveQuizQuestionRequest(
    string? Code,
    int TopicId,
    string? Kind,
    string? Situation,
    string? Question,
    IReadOnlyList<QuizAnswerAdminDto>? Answers,
    string? SafeAction,
    int ReadSeconds,
    int? SampleOrder,
    string? SampleLabel,
    int SortOrder,
    bool IsActive = true,
    long? ExpectedRevision = null);

public sealed record DeleteQuizQuestionResult(bool Deleted, bool Deactivated);

public sealed class QuizAdminValidationException(IReadOnlyDictionary<string, string> fields)
    : Exception("Dữ liệu ngân hàng câu hỏi không hợp lệ.")
{
    public IReadOnlyDictionary<string, string> Fields { get; } = fields;
}

public sealed class QuizAdminConflictException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}

