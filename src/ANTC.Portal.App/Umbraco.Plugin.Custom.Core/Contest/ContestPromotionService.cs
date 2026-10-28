namespace Umbraco.Plugin.Custom.Core.Contest;

/// <summary>Nguon quang ba dung chung trong mot request; khong thay doi cua so dang ky/luot thi.</summary>
public sealed class ContestPromotionService(IContestCatalog catalog, TimeProvider clock)
{
    public const string SafetyNotice = "Cuộc thi chỉ diễn ra trên antoantaichinh.vn. Không thu phí, không hỏi mã OTP, không gọi điện hay nhắn tin báo trúng thưởng. Kết quả chỉ công bố trên website.";
    public const string ShortSafetyNotice = "Chỉ trên antoantaichinh.vn. Không thu phí, không hỏi mã OTP, không gọi báo trúng thưởng. Kết quả chỉ công bố trên website.";
    private Task<ContestInfo?>? selection;

    public Task<ContestInfo?> GetAsync(CancellationToken cancellationToken = default) => selection ??= SelectAsync(cancellationToken);
    public bool IsUpcoming(ContestInfo contest) => contest.StartAt > clock.GetUtcNow().UtcDateTime;

    private async Task<ContestInfo?> SelectAsync(CancellationToken ct)
    {
        var schedule = await catalog.GetScheduleAsync(clock.GetUtcNow().UtcDateTime, ct);
        return schedule.Ongoing.OrderByDescending(c => c.StartAt).ThenByDescending(c => c.Id).FirstOrDefault()
            ?? schedule.Upcoming.OrderBy(c => c.StartAt).ThenBy(c => c.Id).FirstOrDefault();
    }
}
