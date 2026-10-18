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
    Task<DrawAdminDto?> UpdateDrawAsync(long id, SaveDrawRequest request, CancellationToken ct);
    Task<bool> DeleteDrawAsync(long id, CancellationToken ct);
}

public sealed class ContestAdminService(AppDbContext db, TimeProvider timeProvider) : IContestAdminService
{
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
        List<ContestCampaign> items = await query.Include(x => x.Topics).Include(x => x.Questions)
            .OrderByDescending(x => x.StartAt).ThenByDescending(x => x.Id)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return Page(items.Select(x => MapCampaign(x)).ToList(), page, pageSize, total);
    }

    public async Task<ContestCampaignAdminDto?> GetCampaignAsync(long id, CancellationToken ct)
    {
        ContestCampaign? campaign = await db.ContestCampaigns.AsNoTracking()
            .Include(x => x.Topics).Include(x => x.Questions).SingleOrDefaultAsync(x => x.Id == id, ct);
        if (campaign is null) return null;
        return MapCampaign(campaign, await BuildQuestionTreeAsync(campaign, ct));
    }

    public async Task<IReadOnlyList<ContestTopicTreeItemDto>> GetQuestionTreeAsync(long? contestId, CancellationToken ct)
    {
        ContestCampaign? campaign = contestId is null ? null : await db.ContestCampaigns.AsNoTracking()
            .Include(x => x.Topics).Include(x => x.Questions).SingleOrDefaultAsync(x => x.Id == contestId, ct);
        return await BuildQuestionTreeAsync(campaign, ct);
    }

    public async Task<ContestCampaignAdminDto> CreateCampaignAsync(SaveContestCampaignRequest request, CancellationToken ct)
    {
        ValidatedCampaign validated = await ValidateCampaignAsync(request, ct);
        DateTime now = UtcNow();
        var campaign = new ContestCampaign { CreatedAt = now };
        ApplyCampaign(campaign, request, validated, now);
        db.ContestCampaigns.Add(campaign);
        await db.SaveChangesAsync(ct);
        return (await GetCampaignAsync(campaign.Id, ct))!;
    }

    public async Task<ContestCampaignAdminDto?> UpdateCampaignAsync(long id, SaveContestCampaignRequest request, CancellationToken ct)
    {
        ContestCampaign? campaign = await db.ContestCampaigns.Include(x => x.Topics).Include(x => x.Questions)
            .SingleOrDefaultAsync(x => x.Id == id, ct);
        if (campaign is null) return null;
        ValidatedCampaign validated = await ValidateCampaignAsync(request, ct);
        ApplyCampaign(campaign, request, validated, UtcNow());
        await db.SaveChangesAsync(ct);
        return (await GetCampaignAsync(id, ct))!;
    }

    public async Task<bool> DeleteCampaignAsync(long id, CancellationToken ct)
    {
        ContestCampaign? campaign = await db.ContestCampaigns.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (campaign is null) return false;
        db.ContestCampaigns.Remove(campaign);
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<PagedResult<ContestEntryAdminDto>> SearchEntriesAsync(
        string? search, string? status, string? mode, int page, int pageSize, CancellationToken ct)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);
        IQueryable<Entry> query = db.Entries.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            string term = search.Trim().ToLower();
            query = query.Where(x => x.Code.ToLower().Contains(term) ||
                (x.FullName != null && x.FullName.ToLower().Contains(term)) ||
                (x.Phone != null && x.Phone.Contains(term)) ||
                (x.Org != null && x.Org.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(x => x.Status == status);
        if (!string.IsNullOrWhiteSpace(mode)) query = query.Where(x => x.Mode == mode);
        int total = await query.CountAsync(ct);
        List<Entry> entries = await query.OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return Page(entries.Select(MapEntry).ToList(), page, pageSize, total);
    }

    public async Task<ContestEntryAdminDto?> GetEntryAsync(long id, CancellationToken ct) =>
        await db.Entries.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, ct) is { } entry
            ? MapEntry(entry) : null;

    public async Task<PagedResult<DrawAdminDto>> SearchDrawsAsync(
        string? search, int page, int pageSize, CancellationToken ct)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);
        IQueryable<Draw> query = db.Draws.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            string term = search.Trim().ToLower();
            query = query.Where(x => x.CreatedBy.ToLower().Contains(term) ||
                (x.Note != null && x.Note.ToLower().Contains(term)));
        }

        int total = await query.CountAsync(ct);
        List<Draw> draws = await query.Include(x => x.Winners).OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return Page(draws.Select(MapDraw).ToList(), page, pageSize, total);
    }

    public async Task<DrawAdminDto?> GetDrawAsync(long id, CancellationToken ct) =>
        await db.Draws.AsNoTracking().Include(x => x.Winners)
            .SingleOrDefaultAsync(x => x.Id == id, ct) is { } draw ? MapDraw(draw) : null;

    public async Task<DrawAdminDto> CreateDrawAsync(SaveDrawRequest request, string actor, CancellationToken ct)
    {
        Validate(request);
        DateTime now = UtcNow();
        List<long> previousWinnerIds = request.ExcludePrevious
            ? await db.DrawWinners.Where(x => x.EntryId != null).Select(x => x.EntryId!.Value).Distinct().ToListAsync(ct)
            : [];
        IQueryable<Entry> eligibleQuery = db.Entries.Where(x =>
            x.Status == EntryStatuses.Submitted && x.Score >= request.MinScore);
        if (previousWinnerIds.Count > 0) eligibleQuery = eligibleQuery.Where(x => !previousWinnerIds.Contains(x.Id));
        List<Entry> eligible = await eligibleQuery.OrderBy(_ => EF.Functions.Random()).ToListAsync(ct);
        Draw draw = new()
        {
            CreatedAt = now,
            CreatedBy = NormalizeActor(actor),
            MinScore = request.MinScore,
            WinnersRequested = request.WinnersRequested,
            EligibleCount = eligible.Count,
            ExcludePrevious = request.ExcludePrevious,
            Note = NullIfEmpty(request.Note),
        };
        foreach (Entry entry in eligible.Take(request.WinnersRequested))
        {
            draw.Winners.Add(new DrawWinner
            {
                Rank = draw.Winners.Count + 1,
                EntryId = entry.Id,
                Code = entry.Code,
                FullName = entry.FullName ?? "Ẩn danh",
                Phone = entry.Phone ?? "",
                Score = entry.Score ?? 0,
            });
        }

        db.Draws.Add(draw);
        await db.SaveChangesAsync(ct);
        return MapDraw(draw);
    }

    public async Task<DrawAdminDto?> UpdateDrawAsync(long id, SaveDrawRequest request, CancellationToken ct)
    {
        Validate(request);
        Draw? draw = await db.Draws.Include(x => x.Winners).SingleOrDefaultAsync(x => x.Id == id, ct);
        if (draw is null) return null;
        draw.MinScore = request.MinScore;
        draw.WinnersRequested = request.WinnersRequested;
        draw.ExcludePrevious = request.ExcludePrevious;
        draw.Note = NullIfEmpty(request.Note);
        await db.SaveChangesAsync(ct);
        return MapDraw(draw);
    }

    public async Task<bool> DeleteDrawAsync(long id, CancellationToken ct)
    {
        Draw? draw = await db.Draws.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (draw is null) return false;
        db.Draws.Remove(draw);
        await db.SaveChangesAsync(ct);
        return true;
    }

    private static void Validate(SaveDrawRequest request)
    {
        var fields = new Dictionary<string, string>();
        if (request.MinScore < 0) fields["minScore"] = "Điểm tối thiểu không được âm.";
        if (request.WinnersRequested is < 1 or > 1000) fields["winnersRequested"] = "Số người trúng phải từ 1 đến 1.000.";
        if (request.Note?.Trim().Length > 200) fields["note"] = "Ghi chú tối đa 200 ký tự.";
        if (fields.Count > 0) throw new ContestAdminValidationException(fields);
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
        List<int> existingTopicIds = await db.QuizTopics.Where(x => topicIds.Contains(x.Id)).Select(x => x.Id).ToListAsync(ct);
        if (existingTopicIds.Count != topicIds.Distinct().Count()) fields["topics"] = "Có chuyên đề không tồn tại.";
        string[] codes = selections.SelectMany(x => x.Questions).Select(x => x.Code).ToArray();
        Dictionary<string, int> questionTopics = await db.QuizQuestions.Where(x => codes.Contains(x.Code))
            .ToDictionaryAsync(x => x.Code, x => x.TopicId, ct);
        if (questionTopics.Count != codes.Distinct().Count()) fields["questions"] = "Có câu hỏi không tồn tại.";
        if (selections.Any(topic => topic.Questions.Any(question =>
                questionTopics.TryGetValue(question.Code, out int topicId) && topicId != topic.TopicId)))
            fields["questions"] = "Câu hỏi phải thuộc đúng chuyên đề đã chọn.";
        if (fields.Count > 0) throw new ContestAdminValidationException(fields);
        return new ValidatedCampaign(name, startAt, endAt, selections);
    }

    private static void ApplyCampaign(
        ContestCampaign campaign, SaveContestCampaignRequest request, ValidatedCampaign validated, DateTime now)
    {
        campaign.Name = validated.Name;
        campaign.Description = NullIfEmpty(request.Description);
        campaign.StartAt = validated.StartAt;
        campaign.EndAt = validated.EndAt;
        campaign.MaxAttempts = request.MaxAttempts;
        campaign.IsActive = request.IsActive;
        campaign.UpdatedAt = now;
        Dictionary<int, ValidatedTopic> selectedTopics = validated.Topics.ToDictionary(x => x.TopicId);
        campaign.Topics.RemoveAll(x => !selectedTopics.ContainsKey(x.TopicId));
        foreach (ValidatedTopic selected in validated.Topics)
        {
            ContestTopic? current = campaign.Topics.SingleOrDefault(x => x.TopicId == selected.TopicId);
            if (current is null) campaign.Topics.Add(new ContestTopic { TopicId = selected.TopicId, SortOrder = selected.SortOrder });
            else current.SortOrder = selected.SortOrder;
        }

        Dictionary<string, ValidatedQuestion> selectedQuestions = validated.Topics.SelectMany(x => x.Questions)
            .ToDictionary(x => x.Code, StringComparer.Ordinal);
        campaign.Questions.RemoveAll(x => !selectedQuestions.ContainsKey(x.QuestionCode));
        foreach (ValidatedQuestion selected in selectedQuestions.Values)
        {
            ContestQuestion? current = campaign.Questions.SingleOrDefault(x => x.QuestionCode == selected.Code);
            if (current is null) campaign.Questions.Add(new ContestQuestion { QuestionCode = selected.Code, SortOrder = selected.SortOrder });
            else current.SortOrder = selected.SortOrder;
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
        ContestCampaign x, IReadOnlyList<ContestTopicTreeItemDto>? topics = null) => new(
        x.Id, x.Name, x.Description, AsUtc(x.StartAt), AsUtc(x.EndAt), x.MaxAttempts, x.IsActive,
        x.Topics.Count, x.Questions.Count, AsUtc(x.CreatedAt), AsUtc(x.UpdatedAt), topics);

    private static ContestEntryAdminDto MapEntry(Entry x) => new(
        x.Id, x.Code, x.Mode, x.FullName, x.Phone, x.Org, x.Status, x.Answered,
        x.Score, x.TotalQuestions, x.AttemptNo, x.CreatedAt, x.SubmittedAt);

    private static DrawAdminDto MapDraw(Draw x) => new(
        x.Id, x.CreatedAt, x.CreatedBy, x.MinScore, x.WinnersRequested, x.EligibleCount,
        x.ExcludePrevious, x.Note, x.Winners.OrderBy(w => w.Rank)
            .Select(w => new DrawWinnerAdminDto(w.Rank, w.EntryId, w.Code, w.FullName, w.Phone, w.Score)).ToList());

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
    private sealed record ValidatedCampaign(string Name, DateTime StartAt, DateTime EndAt, IReadOnlyList<ValidatedTopic> Topics);
    private sealed record ValidatedTopic(int TopicId, int SortOrder, IReadOnlyList<ValidatedQuestion> Questions);
    private sealed record ValidatedQuestion(string Code, int SortOrder);
}
