using System.Data;
using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Data;
using Umbraco.Plugin.Custom.Core.Quiz;

namespace Umbraco.Plugin.Custom.Core.Contest;

public interface IContestAdminService
{
    Task<PagedResult<ContestCampaignAdminDto>> SearchCampaignsAsync(
        string? search, bool? isActive, int page, int pageSize, CancellationToken ct);
    Task<ContestCampaignAdminDto?> GetCampaignAsync(long id, CancellationToken ct);
    Task<IReadOnlyList<ContestTopicTreeItemDto>> GetQuestionTreeAsync(long? contestId, CancellationToken ct);
    Task<ContestCampaignAdminDto> CreateCampaignAsync(SaveContestCampaignRequest request, CancellationToken ct);
    Task<ContestCampaignAdminDto?> UpdateCampaignAsync(long id, SaveContestCampaignRequest request, CancellationToken ct);
    Task<bool> DeleteCampaignAsync(long id, CancellationToken ct);
    Task<PagedResult<ContestEntryAdminDto>> SearchEntriesAsync(
        string? search, string? status, string? mode, int page, int pageSize, CancellationToken ct);
    Task<ContestEntryAdminDto?> GetEntryAsync(long id, CancellationToken ct);
    Task<PagedResult<DrawAdminDto>> SearchDrawsAsync(string? search, int page, int pageSize, CancellationToken ct);
    Task<DrawAdminDto?> GetDrawAsync(long id, CancellationToken ct);
    Task<DrawAdminDto> CreateDrawAsync(SaveDrawRequest request, string actor, CancellationToken ct);
    Task<DrawPreviewDto> PreviewDrawAsync(PreviewDrawRequest request, CancellationToken ct);
    Task<IReadOnlyList<DrawCandidateSnapshot>?> ExportDrawAsync(long id, bool winners, CancellationToken ct);
    Task<DrawAdminDto?> UpdateDrawAsync(long id, SaveDrawRequest request, CancellationToken ct);
    Task<bool> DeleteDrawAsync(long id, CancellationToken ct);
}

public sealed partial class ContestAdminService(AppDbContext db, TimeProvider timeProvider, IQuestionBank? bank = null) : IContestAdminService
{
    private static readonly System.Text.RegularExpressions.Regex FocusAreaPattern =
        new("^[a-z0-9_-]{1,50}$", System.Text.RegularExpressions.RegexOptions.Compiled);

    public async Task<PagedResult<ContestCampaignAdminDto>> SearchCampaignsAsync(
        string? search, bool? isActive, int page, int pageSize, CancellationToken ct)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);
        IQueryable<ContestCampaign> query = db.ContestCampaigns.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            string term = search.Trim().ToLower();
            query = query.Where(x => x.Name.ToLower().Contains(term) ||
                (x.Description != null && x.Description.ToLower().Contains(term)));
        }
        if (isActive is not null) query = query.Where(x => x.IsActive == isActive);

        int total = await query.CountAsync(ct);
        List<ContestCampaign> items = await query.Include(x => x.Topics).Include(x => x.Questions).AsSplitQuery()
            .OrderByDescending(x => x.StartAt).ThenByDescending(x => x.Id)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        long[] ids = items.Select(x => x.Id).ToArray();
        Dictionary<long, int> counts = await CountEntriesAsync(ids, ct);
        return Page(items.Select(x => MapCampaign(x, null, counts.GetValueOrDefault(x.Id))).ToList(), page, pageSize, total);
    }

    public async Task<ContestCampaignAdminDto?> GetCampaignAsync(long id, CancellationToken ct)
    {
        ContestCampaign? campaign = await db.ContestCampaigns.AsNoTracking()
            .Include(x => x.Topics).Include(x => x.Questions).AsSplitQuery().SingleOrDefaultAsync(x => x.Id == id, ct);
        if (campaign is null) return null;
        int entryCount = await db.Entries.CountAsync(x => x.ContestId == id, ct);
        return MapCampaign(campaign, await BuildQuestionTreeAsync(campaign, ct), entryCount);
    }

    public async Task<IReadOnlyList<ContestTopicTreeItemDto>> GetQuestionTreeAsync(long? contestId, CancellationToken ct)
    {
        ContestCampaign? campaign = contestId is null ? null : await db.ContestCampaigns.AsNoTracking()
            .Include(x => x.Topics).Include(x => x.Questions).AsSplitQuery().SingleOrDefaultAsync(x => x.Id == contestId, ct);
        return await BuildQuestionTreeAsync(campaign, ct);
    }

    public async Task<ContestCampaignAdminDto> CreateCampaignAsync(SaveContestCampaignRequest request, CancellationToken ct)
    {
        // Microsoft.Data.Sqlite starts a non-deferred write transaction at Serializable isolation.
        // Acquire it BEFORE reading the schedule, so concurrent requests cannot both pass the check.
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        ValidatedCampaign validated = await ValidateCampaignAsync(request, ct);
        await EnsureScheduleAvailableAsync(validated, null, ct);
        DateTime now = UtcNow();
        var campaign = new ContestCampaign { CreatedAt = now, Revision = 1,
            BankVersion = await CurrentBankVersionAsync(ct) };
        ApplyCampaign(campaign, request, validated, now);
        db.ContestCampaigns.Add(campaign);
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        bank?.Reload();
        return (await GetCampaignAsync(campaign.Id, ct))!;
    }

    public async Task<ContestCampaignAdminDto?> UpdateCampaignAsync(long id, SaveContestCampaignRequest request, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        ContestCampaign? campaign = await db.ContestCampaigns.Include(x => x.Topics).Include(x => x.Questions)
            .AsSplitQuery()
            .SingleOrDefaultAsync(x => x.Id == id, ct);
        if (campaign is null) return null;
        if (request.ExpectedRevision is not null && request.ExpectedRevision != campaign.Revision)
            throw new ContestAdminConflictException("CONTEST_CHANGED", "Cuộc thi đã được người khác cập nhật. Hãy tải lại dữ liệu.");
        bool started = campaign.StartAt <= UtcNow();
        if (started && IsOnlyActivationChange(campaign, request))
        {
            campaign.IsActive = request.IsActive;
            campaign.UpdatedAt = UtcNow();
            campaign.Revision++;
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            bank?.Reload();
            return (await GetCampaignAsync(id, ct))!;
        }
        if (started)
            throw new ContestAdminConflictException("CONTEST_LOCKED", "Cuộc thi đã bắt đầu hoặc đã có lượt dự thi; chỉ được thay đổi trạng thái sử dụng.");
        ValidatedCampaign validated = await ValidateCampaignAsync(request, ct);
        await EnsureScheduleAvailableAsync(validated, id, ct);
        if (DeckChanged(campaign, validated))
        {
            int entryCount = await db.Entries.CountAsync(x => x.ContestId == id, ct);
            if (entryCount > 0) throw new ContestHasEntriesException(entryCount);
        }
        campaign.BankVersion = await CurrentBankVersionAsync(ct);
        campaign.Revision++;
        ApplyCampaign(campaign, request, validated, UtcNow());
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        bank?.Reload();
        return (await GetCampaignAsync(id, ct))!;
    }

    public async Task<bool> DeleteCampaignAsync(long id, CancellationToken ct)
    {
        ContestCampaign? campaign = await db.ContestCampaigns.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (campaign is null) return false;
        int entryCount = await db.Entries.CountAsync(x => x.ContestId == id, ct);
        if (entryCount > 0) throw new ContestHasEntriesException(entryCount);
        if (campaign.StartAt <= UtcNow() || await db.Draws.AnyAsync(x => x.ContestId == id, ct))
            throw new ContestAdminConflictException("CONTEST_IN_USE", "Không thể xóa cuộc thi đã bắt đầu, có lượt dự thi hoặc có lần quay số; hãy chuyển sang ngừng sử dụng.");
        db.ContestCampaigns.Remove(campaign);
        await db.SaveChangesAsync(ct);
        bank?.Reload();
        return true;
    }

    public async Task<PagedResult<ContestEntryAdminDto>> SearchEntriesAsync(
        string? search, string? status, string? mode, int page, int pageSize, CancellationToken ct)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);
        IQueryable<Entry> query = db.Entries.AsNoTracking().Include(x => x.Contest);
        if (!string.IsNullOrWhiteSpace(search))
        {
            string term = search.Trim().ToLower();
            query = query.Where(x => x.Code.ToLower().Contains(term) ||
                (x.FullName != null && x.FullName.ToLower().Contains(term)) ||
                (x.Phone != null && x.Phone.Contains(term)) ||
                (x.Org != null && x.Org.ToLower().Contains(term)) ||
                (x.Contest != null && x.Contest.Name.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(x => x.Status == status);
        if (!string.IsNullOrWhiteSpace(mode)) query = query.Where(x => x.Mode == mode);
        int total = await query.CountAsync(ct);
        List<Entry> entries = await query.OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return Page(entries.Select(MapEntry).ToList(), page, pageSize, total);
    }

    public async Task<ContestEntryAdminDto?> GetEntryAsync(long id, CancellationToken ct) =>
        await db.Entries.AsNoTracking().Include(x => x.Contest).SingleOrDefaultAsync(x => x.Id == id, ct) is { } entry
            ? MapEntry(entry) : null;

    public async Task<PagedResult<DrawAdminDto>> SearchDrawsAsync(
        string? search, int page, int pageSize, CancellationToken ct)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);
        IQueryable<Draw> query = db.Draws.AsNoTracking().Include(x => x.Contest);
        if (!string.IsNullOrWhiteSpace(search))
        {
            string term = search.Trim().ToLower();
            query = query.Where(x => x.CreatedBy.ToLower().Contains(term) ||
                (x.Note != null && x.Note.ToLower().Contains(term)) ||
                (x.Contest != null && x.Contest.Name.ToLower().Contains(term)));
        }

        int total = await query.CountAsync(ct);
        List<Draw> draws = await query.Include(x => x.Winners).AsSplitQuery().OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return Page(draws.Select(MapDraw).ToList(), page, pageSize, total);
    }

    public async Task<DrawAdminDto?> GetDrawAsync(long id, CancellationToken ct) =>
        await db.Draws.AsNoTracking().Include(x => x.Winners).Include(x => x.Contest).AsSplitQuery()
            .SingleOrDefaultAsync(x => x.Id == id, ct) is { } draw ? MapDraw(draw) : null;

    public Task<DrawAdminDto?> UpdateDrawAsync(long id, SaveDrawRequest request, CancellationToken ct) =>
        throw new ContestAdminConflictException("DRAW_IMMUTABLE", "Lần quay đã lưu không được sửa. Hãy tạo lần quay mới.");

    public Task<bool> DeleteDrawAsync(long id, CancellationToken ct) =>
        throw new ContestAdminConflictException("DRAW_IMMUTABLE", "Lần quay đã lưu không được xóa. Lịch sử phải được giữ nguyên.");

    private static void Validate(SaveDrawRequest request)
    {
        var fields = new Dictionary<string, string>();
        if (request.ContestId is null or <= 0) fields["contestId"] = "Phải chọn cuộc thi.";
        if (request.MinScore < 0) fields["minScore"] = "Điểm tối thiểu không được âm.";
        if (request.WinnersRequested is < 1 or > 1000) fields["winnersRequested"] = "Số người trúng phải từ 1 đến 1.000.";
        if (request.Note?.Trim().Length > 200) fields["note"] = "Ghi chú tối đa 200 ký tự.";
        if (fields.Count > 0) throw new ContestAdminValidationException(fields);
    }

    private async Task EnsureScheduleAvailableAsync(ValidatedCampaign proposed, long? excludedId, CancellationToken ct)
    {
        // Inclusive endpoints match the participation window. Inactive contests still reserve their dates;
        // submit grace is deliberately excluded. Never compare an edited contest with itself.
        IQueryable<ContestCampaign> query = db.ContestCampaigns.AsNoTracking();
        if (excludedId is { } id) query = query.Where(x => x.Id != id);
        var conflict = await query
            .Where(x => x.StartAt <= proposed.EndAt && x.EndAt >= proposed.StartAt)
            .OrderBy(x => x.StartAt).ThenBy(x => x.Id)
            .Select(x => new { x.Id, x.Name }).FirstOrDefaultAsync(ct);
        if (conflict is not null)
            throw new ContestAdminConflictException("CONTEST_TIME_OVERLAP",
                $"Thời gian diễn ra trùng với cuộc thi #{conflict.Id} “{conflict.Name}”. Vui lòng chọn khoảng thời gian khác; thời điểm bắt đầu phải sau thời điểm kết thúc cuộc thi trước.");
    }

    private async Task<ValidatedCampaign> ValidateCampaignAsync(SaveContestCampaignRequest request, CancellationToken ct)
    {
        var fields = new Dictionary<string, string>();
        string name = request.Name?.Trim() ?? "";
        if (name.Length is < 2 or > 200) fields["name"] = "Tên cuộc thi phải có 2–200 ký tự.";
        if (request.Description?.Trim().Length > 2000) fields["description"] = "Mô tả tối đa 2.000 ký tự.";
        DateTime startAt = NormalizeInstant(request.StartAt);
        DateTime endAt = NormalizeInstant(request.EndAt);
        if (request.StartAt == default) fields["startAt"] = "Thời gian bắt đầu là bắt buộc.";
        if (request.EndAt == default) fields["endAt"] = "Thời gian kết thúc là bắt buộc.";
        if (request.StartAt != default && request.EndAt != default && endAt <= startAt)
            fields["endAt"] = "Thời gian kết thúc phải sau thời gian bắt đầu.";
        if (request.MaxAttempts is < 1 or > 1000) fields["maxAttempts"] = "Số lượt tối đa phải từ 1 đến 1.000.";
        if (request.SubmitGraceHours is < 0 or > 168)
            fields["submitGraceHours"] = "Thời gian gia hạn nộp bài phải từ 0 đến 168 giờ.";
        if (request.ReadTimerFactor is < 0m or > 5m)
            fields["readTimerFactor"] = "Hệ số thời gian đọc phải từ 0 đến 5.";
        string? focusArea = NullIfEmpty(request.FocusArea);
        if (focusArea is not null && !FocusAreaPattern.IsMatch(focusArea))
            fields["focusArea"] = "Lĩnh vực chỉ gồm chữ thường không dấu, số, gạch ngang hoặc gạch dưới (tối đa 50 ký tự).";

        List<SaveContestTopicRequest> topics = request.Topics?.ToList() ?? [];
        if (topics.Count == 0) fields["topics"] = "Phải chọn ít nhất một chuyên đề.";
        if (topics.Select(x => x.TopicId).Distinct().Count() != topics.Count)
            fields["topics"] = "Danh sách chuyên đề không được trùng.";
        var selections = topics.Select((topic, topicIndex) => new ValidatedTopic(
            topic.TopicId,
            topicIndex,
            (topic.QuestionCodes ?? []).Select((code, index) => new ValidatedQuestion(code.Trim().ToUpperInvariant(), index)).ToList())).ToList();
        if (selections.Any(x => x.Questions.Count == 0)) fields["questions"] = "Mỗi chuyên đề phải có ít nhất một câu hỏi.";
        if (selections.SelectMany(x => x.Questions).Select(x => x.Code).Distinct().Count() != selections.Sum(x => x.Questions.Count))
            fields["questions"] = "Một câu hỏi không được chọn lặp lại.";

        int[] topicIds = selections.Select(x => x.TopicId).ToArray();
        Dictionary<int, QuizTopic> existingTopics = await db.QuizTopics.Where(x => topicIds.Contains(x.Id) && x.IsActive)
            .ToDictionaryAsync(x => x.Id, ct);
        if (existingTopics.Count != topicIds.Distinct().Count()) fields["topics"] = "Có chuyên đề không tồn tại hoặc đang ngừng dùng.";
        string[] codes = selections.SelectMany(x => x.Questions).Select(x => x.Code).ToArray();
        Dictionary<string, QuizQuestion> existingQuestions = await db.QuizQuestions.Where(x => codes.Contains(x.Code) && x.IsActive)
            .ToDictionaryAsync(x => x.Code, ct);
        if (existingQuestions.Count != codes.Distinct().Count()) fields["questions"] = "Có câu hỏi không tồn tại hoặc đang ngừng dùng.";
        if (selections.Any(topic => topic.Questions.Any(question =>
                existingQuestions.TryGetValue(question.Code, out QuizQuestion? item) && item.TopicId != topic.TopicId)))
            fields["questions"] = "Câu hỏi phải thuộc đúng chuyên đề đã chọn.";
        if (fields.Count > 0) throw new ContestAdminValidationException(fields);
        return new ValidatedCampaign(name, startAt, endAt, selections.Select(topic => topic with
        {
            Topic = existingTopics[topic.TopicId],
            Questions = topic.Questions.Select(question => question with { Question = existingQuestions[question.Code] }).ToList()
        }).ToList(), focusArea);
    }

    private static void ApplyCampaign(
        ContestCampaign campaign, SaveContestCampaignRequest request, ValidatedCampaign validated, DateTime now)
    {
        campaign.Name = validated.Name;
        campaign.Description = NullIfEmpty(request.Description);
        campaign.StartAt = validated.StartAt;
        campaign.EndAt = validated.EndAt;
        campaign.MaxAttempts = request.MaxAttempts;
        campaign.SubmitGraceHours = request.SubmitGraceHours;
        campaign.ReadTimerFactor = request.ReadTimerFactor;
        campaign.FocusArea = validated.FocusArea;
        campaign.IsActive = request.IsActive;
        campaign.UpdatedAt = now;
        Dictionary<int, ValidatedTopic> selectedTopics = validated.Topics.ToDictionary(x => x.TopicId);
        campaign.Topics.RemoveAll(x => !selectedTopics.ContainsKey(x.TopicId));
        foreach (ValidatedTopic selected in validated.Topics)
        {
            ContestTopic? current = campaign.Topics.SingleOrDefault(x => x.TopicId == selected.TopicId);
            if (current is null)
            {
                current = new ContestTopic { TopicId = selected.TopicId };
                campaign.Topics.Add(current);
            }
            current.SortOrder = selected.SortOrder;
            current.Title = selected.Topic!.Title;
            current.Intro = selected.Topic.Intro;
            current.Terms = selected.Topic.Terms;
        }

        Dictionary<string, ValidatedQuestion> selectedQuestions = validated.Topics.SelectMany(x => x.Questions)
            .ToDictionary(x => x.Code, StringComparer.Ordinal);
        campaign.Questions.RemoveAll(x => !selectedQuestions.ContainsKey(x.QuestionCode));
        foreach (ValidatedQuestion selected in selectedQuestions.Values)
        {
            ContestQuestion? current = campaign.Questions.SingleOrDefault(x => x.QuestionCode == selected.Code);
            if (current is null)
            {
                current = new ContestQuestion { QuestionCode = selected.Code };
                campaign.Questions.Add(current);
            }
            QuizQuestion source = selected.Question!;
            current.TopicId = source.TopicId;
            current.SortOrder = selected.SortOrder;
            current.Kind = source.Kind;
            current.Situation = source.Situation;
            current.QuestionText = source.Question;
            current.Options = source.Options;
            current.Answer = source.Answer;
            current.Explanations = source.Explanations;
            current.SafeAction = source.SafeAction;
            current.ReadSeconds = source.ReadSeconds;
            current.SampleOrder = source.SampleOrder;
            current.SampleLabel = source.SampleLabel;
        }
    }

    private async Task<IReadOnlyList<ContestTopicTreeItemDto>> BuildQuestionTreeAsync(
        ContestCampaign? campaign, CancellationToken ct)
    {
        HashSet<int> selectedTopics = campaign?.Topics.Select(x => x.TopicId).ToHashSet() ?? [];
        HashSet<string> selectedQuestions = campaign?.Questions.Select(x => x.QuestionCode).ToHashSet() ?? [];
        List<QuizTopic> topics = await db.QuizTopics.AsNoTracking().Include(x => x.Questions)
            .OrderBy(x => x.Id).ToListAsync(ct);
        return topics.Select((topic, topicIndex) => new ContestTopicTreeItemDto(
            topic.Id,
            topic.Title,
            topicIndex,
            topic.IsActive,
            selectedTopics.Contains(topic.Id),
            topic.Questions.OrderBy(x => x.SortOrder).ThenBy(x => x.Code)
                .Select(x => new ContestQuestionTreeItemDto(
                    x.Code, x.Question, x.SortOrder, x.IsActive, selectedQuestions.Contains(x.Code)))
                .ToList())).ToList();
    }

    private static ContestCampaignAdminDto MapCampaign(
        ContestCampaign x, IReadOnlyList<ContestTopicTreeItemDto>? topics = null, int entryCount = 0) => new(
        x.Id, x.Name, x.Description, AsUtc(x.StartAt), AsUtc(x.EndAt), x.MaxAttempts, x.IsActive,
        x.Topics.Count, x.Questions.Count, AsUtc(x.CreatedAt), AsUtc(x.UpdatedAt), topics,
        x.SubmitGraceHours, x.ReadTimerFactor, x.FocusArea, entryCount, x.Revision);

    private static ContestEntryAdminDto MapEntry(Entry x) => new(
        x.Id, x.Code, x.Mode, x.FullName, x.Phone, x.Org, x.Status, x.Answered,
        x.Score, x.TotalQuestions, x.AttemptNo, x.CreatedAt, x.SubmittedAt, x.ContestId, x.Contest?.Name);

    private static DrawAdminDto MapDraw(Draw x) => new(
        x.Id, AsUtc(x.CreatedAt), x.CreatedBy, x.MinScore, x.WinnersRequested, x.EligibleCount,
        x.ExcludePrevious, x.Note, x.Winners.OrderBy(w => w.Rank)
            .Select(w => new DrawWinnerAdminDto(w.Rank, w.EntryId, w.Code, w.FullName, ContestResultsService.MaskPhone(w.Phone), w.Score)).ToList(),
        x.ContestId, x.Contest?.Name, x.EligibleSnapshotJson is not null,
        x.EligibleSnapshotJson?.Contains("\"Phone\":\"\"", StringComparison.Ordinal) == true);

    private static (int Page, int PageSize) NormalizePaging(int page, int pageSize) =>
        (Math.Max(1, page), Math.Clamp(pageSize, 1, 100));

    private static PagedResult<T> Page<T>(IReadOnlyList<T> items, int page, int pageSize, int total) =>
        new(items, page, pageSize, total, Math.Max(1, (int)Math.Ceiling(total / (double)pageSize)));

    // SQLite materializes UTC timestamps as Unspecified; restore the kind before JSON serialization.
    private static DateTime AsUtc(DateTime value) => DateTime.SpecifyKind(value, DateTimeKind.Utc);

    private DateTime UtcNow() => timeProvider.GetUtcNow().UtcDateTime;
    private static DateTime NormalizeInstant(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => TimeZoneInfo.ConvertTimeToUtc(value, TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh")),
    };
    private static string NormalizeActor(string actor) => string.IsNullOrWhiteSpace(actor) ? "backoffice" : actor[..Math.Min(actor.Length, 100)];
    private static string? NullIfEmpty(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private async Task<long> CurrentBankVersionAsync(CancellationToken ct) =>
        await db.QuizImports.Select(x => (long?)x.Id).MaxAsync(ct) ?? 0;

    private async Task<Dictionary<long, int>> CountEntriesAsync(long[] contestIds, CancellationToken ct) =>
        await db.Entries.Where(x => x.ContestId != null && contestIds.Contains(x.ContestId.Value))
            .GroupBy(x => x.ContestId!.Value).Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count, ct);

    private static bool DeckChanged(ContestCampaign campaign, ValidatedCampaign validated) =>
        !campaign.Topics.Select(x => x.TopicId).ToHashSet().SetEquals(validated.Topics.Select(x => x.TopicId)) ||
        !campaign.Questions.Select(x => x.QuestionCode).ToHashSet(StringComparer.Ordinal)
            .SetEquals(validated.Topics.SelectMany(x => x.Questions).Select(x => x.Code));

    private static bool IsOnlyActivationChange(ContestCampaign campaign, SaveContestCampaignRequest request)
    {
        DateTime start = NormalizeInstant(request.StartAt);
        DateTime end = NormalizeInstant(request.EndAt);
        var requestedTopics = (request.Topics ?? []).Select((x, index) => new
        {
            x.TopicId,
            SortOrder = index,
            Questions = (x.QuestionCodes ?? []).Select((code, questionIndex) => new
            {
                Code = code.Trim().ToUpperInvariant(),
                SortOrder = questionIndex,
            }).ToList(),
        }).ToList();
        bool sameTopics = requestedTopics.Count == campaign.Topics.Count && requestedTopics.All(x =>
            campaign.Topics.Any(current => current.TopicId == x.TopicId && current.SortOrder == x.SortOrder));
        bool sameQuestions = requestedTopics.SelectMany(x => x.Questions).Count() == campaign.Questions.Count &&
            requestedTopics.SelectMany(x => x.Questions).All(x => campaign.Questions.Any(current =>
                current.QuestionCode == x.Code && current.SortOrder == x.SortOrder));
        return string.Equals(campaign.Name, request.Name?.Trim(), StringComparison.Ordinal) &&
               string.Equals(campaign.Description, NullIfEmpty(request.Description), StringComparison.Ordinal) &&
               campaign.StartAt == start && campaign.EndAt == end && campaign.MaxAttempts == request.MaxAttempts &&
               campaign.SubmitGraceHours == request.SubmitGraceHours &&
               campaign.ReadTimerFactor == request.ReadTimerFactor &&
               string.Equals(campaign.FocusArea, NullIfEmpty(request.FocusArea), StringComparison.Ordinal) &&
               sameTopics && sameQuestions;
    }

    private sealed record ValidatedCampaign(
        string Name, DateTime StartAt, DateTime EndAt,
        IReadOnlyList<ValidatedTopic> Topics, string? FocusArea);
    private sealed record ValidatedTopic(int TopicId, int SortOrder, IReadOnlyList<ValidatedQuestion> Questions, QuizTopic? Topic = null);
    private sealed record ValidatedQuestion(string Code, int SortOrder, QuizQuestion? Question = null);
}
