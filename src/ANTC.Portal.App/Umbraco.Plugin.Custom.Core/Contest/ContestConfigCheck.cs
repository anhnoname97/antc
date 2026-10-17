using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Umbraco.Plugin.Custom.Core.Contest;

/// <summary>
/// Kiem tra cau hinh cuoc thi luc khoi dong. Khong chan khoi dong (se keo sap ca website),
/// chi ghi canh bao de loi cau hinh lo ra ngay khi trien khai.
/// </summary>
public class ContestConfigCheck : IHostedService
{
    private readonly IConfiguration _config;
    private readonly ILogger<ContestConfigCheck> _logger;

    public ContestConfigCheck(IConfiguration config, ILogger<ContestConfigCheck> logger)
    {
        _config = config;
        _logger = logger;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(_config[ContestEntryService.IpHashSaltKey]))
        {
            _logger.LogWarning(
                "Thieu cau hinh {Key}: luot thi van dang ky duoc nhung ip_hash se de trong. Dat khoa nay truoc khi trien khai.",
                ContestEntryService.IpHashSaltKey);
        }

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
