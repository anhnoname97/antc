using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;
using Umbraco.Plugin.Custom.Core.Quiz;
using Umbraco.Plugin.Custom.Core.Services;

namespace Umbraco.Plugin.Custom.Core.Composers;

/// <summary>
/// Dang ky dich vu nghiep vu cua du an. Umbraco tu tim va chay composer nay khi khoi dong.
/// Them dich vu moi (cuoc thi, hoi dap, quay so...) vao day.
/// </summary>
public class CustomCoreComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        // CSDL ung dung, tach khoi CSDL cua Umbraco
        string configured = builder.Config.GetConnectionString("appDb") ?? "Data Source=App_Data/app.sqlite.db";
        builder.Services.AddDbContext<AppDbContext>((services, options) =>
        {
            // Duong dan tuong doi tinh tu thu muc goc cua ung dung (content root), khong phu thuoc thu muc dang dung.
            var csb = new SqliteConnectionStringBuilder(configured);
            if (!Path.IsPathRooted(csb.DataSource))
            {
                string root = services.GetRequiredService<IHostEnvironment>().ContentRootPath;
                csb.DataSource = Path.GetFullPath(Path.Combine(root, csb.DataSource));
            }

            Directory.CreateDirectory(Path.GetDirectoryName(csb.DataSource)!);
            options.UseSqlite(csb.ConnectionString);
        });
        builder.Services.AddHostedService<AppDbInitializer>();

        // Ngan hang cau hoi giu trong bo nho
        builder.Services.AddSingleton<IQuestionBank, QuestionBank>();

        // Cai dat cuoc thi doc tu trang thiPage, dung chung cho trang va API cuoc thi
        builder.Services.AddSingleton<IContestSettings, ContestSettingsService>();
        builder.Services.AddScoped<IContestEntryService, ContestEntryService>();
        builder.Services.AddScoped<IContestAttemptService, ContestAttemptService>();
        builder.Services.AddHostedService<ContestConfigCheck>();

        builder.Services.AddSingleton<IAppInfoService, AppInfoService>();
    }
}