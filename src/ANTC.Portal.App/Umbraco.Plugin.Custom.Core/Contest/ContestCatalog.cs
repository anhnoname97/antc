using Microsoft.EntityFrameworkCore;
using Umbraco.Plugin.Custom.Core.Data;
using Umbraco.Plugin.Custom.Core.Quiz;

namespace Umbraco.Plugin.Custom.Core.Contest;

public enum ContestState { Upcoming, Ongoing, Ended }

/// <summary>Giai doan nhan bai: Open nhan tra loi va nop; SubmitOnly chi nop; Closed khong nhan gi.</summary>
public enum ContestPhase { Open, SubmitOnly, Closed }

/// <summary>Mot chuyen de trong de cua cuoc thi. Cd la so chuyen de (QuizTopic.Id) dang chuoi.</summary>
public sealed record ContestExamTopic(string Cd, int TopicId, string Title, int Count);

/// <summary>Mot cuoc thi dang hoat dong cung de cua no. Gio luu o UTC.</summary>
public sealed record ContestInfo(
    long Id, string Name, string? Description, DateTime StartAt, DateTime EndAt,
    int MaxAttempts, int SubmitGraceHours, decimal ReadTimerFactor, string? FocusArea,
    IReadOnlyList<ContestExamTopic> Topics, IReadOnlyList<string> QuestionCodes, DateTime UpdatedAt)
{
    /// <summary>Han nop = EndAt + SubmitGraceHours (QD-014 theo cuoc).</summary>
    public DateTime SubmitUntil => EndAt.AddHours(SubmitGraceHours);

    public int QuestionCount => QuestionCodes.Count;

    public ContestState StatusAt(DateTime now) =>
        now < StartAt ? ContestState.Upcoming : now < EndAt ? ContestState.Ongoing : ContestState.Ended;

    public ContestPhase PhaseAt(DateTime now) => StatusAt(now) switch
    {
        ContestState.Ongoing => ContestPhase.Open,
        ContestState.Ended when now < SubmitUntil => ContestPhase.SubmitOnly,
        _ => ContestPhase.Closed,
    };
}

/// <summary>Lich cuoc thi cong khai: chi cuoc is_active.</summary>
public sealed record ContestSchedule(
    DateTime ServerTime, IReadOnlyList<ContestInfo> Ongoing,
    IReadOnlyList<ContestInfo> Upcoming, IReadOnlyList<ContestInfo> Ended);

/// <summary>
/// Nguon duy nhat cho lich, trang thai, han nop va de cua cuoc thi. API va view Razor cung dung,
/// de trang va API khong lech nhau.
/// </summary>
public interface IContestCatalog
{
    /// <summary>Cuoc thi theo id; null khi khong co hoac khong is_active (moi trang thai deu tra ve).</summary>
    Task<ContestInfo?> GetAsync(long id, CancellationToken cancellationToken = default);

    Task<ContestSchedule> GetScheduleAsync(DateTime now, CancellationToken cancellationToken = default);

    /// <summary>Cuoc chinh cho thanh thong bao: trong cac cuoc ongoing, cuoc bat dau muon nhat.</summary>
    Task<ContestInfo?> GetCurrentAsync(CancellationToken cancellationToken = default);
}

public sealed class ContestCatalog(AppDbContext db, IQuestionBank questionBank, TimeProvider clock) : IContestCatalog
{
    /// <summary>So cuoc da ket thuc toi da trong lich.</summary>
    public const int MaxEnded = 12;

    public async Task<ContestInfo?> GetAsync(long id, CancellationToken cancellationToken = default)
    {
        ContestCampaign? campaign = await Query().FirstOrDefaultAsync(x => x.Id == id && x.IsActive, cancellationToken);
        return campaign is null ? null : ToInfo(campaign, questionBank.Current);
    }

    public async Task<ContestSchedule> GetScheduleAsync(DateTime now, CancellationToken cancellationToken = default)
    {
        QuestionBankSnapshot bank = questionBank.Current;
        List<ContestCampaign> ongoing = await Query()
            .Where(x => x.IsActive && x.StartAt <= now && now < x.EndAt)
            .OrderByDescending(x => x.StartAt).ThenByDescending(x => x.Id)
            .ToListAsync(cancellationToken);
        List<ContestCampaign> upcoming = await Query()
            .Where(x => x.IsActive && now < x.StartAt)
            .OrderBy(x => x.StartAt).ThenBy(x => x.Id)
            .ToListAsync(cancellationToken);
        List<ContestCampaign> ended = await Query()
            .Where(x => x.IsActive && x.EndAt <= now)
            .OrderByDescending(x => x.EndAt).ThenByDescending(x => x.Id)
            .Take(MaxEnded)
            .ToListAsync(cancellationToken);
        return new ContestSchedule(now,
            ongoing.Select(x => ToInfo(x, bank)).ToList(),
            upcoming.Select(x => ToInfo(x, bank)).ToList(),
            ended.Select(x => ToInfo(x, bank)).ToList());
    }

    public async Task<ContestInfo?> GetCurrentAsync(CancellationToken cancellationToken = default)
    {
        DateTime now = clock.GetUtcNow().UtcDateTime;
        ContestCampaign? campaign = await Query()
            .Where(x => x.IsActive && x.StartAt <= now && now < x.EndAt)
            .OrderByDescending(x => x.StartAt).ThenByDescending(x => x.Id)
            .FirstOrDefaultAsync(cancellationToken);
        return campaign is null ? null : ToInfo(campaign, questionBank.Current);
    }

    private IQueryable<ContestCampaign> Query() => db.ContestCampaigns.AsNoTracking()
        .Include(x => x.Topics).ThenInclude(x => x.Topic)
        .Include(x => x.Questions)
        .AsSplitQuery();

    /// <summary>
    /// De = cau cua cuoc con trong ban chup ngan hang va thuoc chuyen de da chon.
    /// Thu tu: contest_topic.sort_order roi contest_question.sort_order.
    /// </summary>
    private static ContestInfo ToInfo(ContestCampaign campaign, QuestionBankSnapshot bank)
    {
        var topics = new List<ContestExamTopic>();
        var codes = new List<string>();
        var topicIds = campaign.Topics.OrderBy(x => x.SortOrder).ThenBy(x => x.TopicId).Select(x => x.TopicId).ToList();
        var inExam = new HashSet<int>(topicIds);
        List<ContestQuestion> ordered = campaign.Questions
            .OrderBy(x => x.SortOrder).ThenBy(x => x.QuestionCode, StringComparer.Ordinal).ToList();
        foreach (int topicId in topicIds)
        {
            List<string> topicCodes = ordered
                .Where(x => bank.Keys.TryGetValue(x.QuestionCode, out AnswerKey? key) && key.TopicId == topicId)
                .Select(x => x.QuestionCode).ToList();
            if (topicCodes.Count == 0) continue;
            string title = bank.Topics.FirstOrDefault(t => t.Cd == topicId.ToString())?.Title
                ?? campaign.Topics.First(x => x.TopicId == topicId).Topic?.Title ?? "";
            topics.Add(new ContestExamTopic(topicId.ToString(), topicId, title, topicCodes.Count));
            codes.AddRange(topicCodes);
        }

        return new ContestInfo(campaign.Id, campaign.Name, campaign.Description, campaign.StartAt, campaign.EndAt,
            campaign.MaxAttempts, campaign.SubmitGraceHours, campaign.ReadTimerFactor,
            string.IsNullOrWhiteSpace(campaign.FocusArea) ? null : campaign.FocusArea, topics, codes, campaign.UpdatedAt);
    }
}
