using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Plugin.Custom.Core.Articles;
using Umbraco.Plugin.Custom.Core.Backoffice;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;
using Umbraco.Plugin.Custom.Core.Quiz;
using Umbraco.Plugin.Custom.Core.Questions;
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

        builder.Services.AddOptions<ContestSecurityOptions>()
            .Bind(builder.Config.GetSection(ContestSecurityOptions.SectionName))
            .Validate(o => !string.IsNullOrWhiteSpace(o.IpHashSalt),
                "Contest:IpHashSalt phai duoc cau hinh de bam dia chi IP.")
            .ValidateOnStart();
        builder.Services.AddSingleton(TimeProvider.System);
        builder.Services.AddSingleton<ArticleHtmlSanitizer>();
        builder.Services.AddScoped<IArticleContentSource, UmbracoArticleContentSource>();
        builder.Services.AddScoped<IPublishedArticleService, PublishedArticleService>();
        builder.AddNotificationAsyncHandler<UmbracoApplicationStartingNotification, ArticleSchemaMigration>();
        builder.Services.AddScoped<IContestEntryService>(services => new ContestEntryService(
            services.GetRequiredService<AppDbContext>(),
            services.GetRequiredService<IContestCatalog>(),
            services.GetRequiredService<TimeProvider>(),
            services.GetRequiredService<IConfiguration>()));
        builder.Services.AddScoped<IContestAttemptService, ContestAttemptService>();
        builder.Services.AddScoped<IContestCatalog, ContestCatalog>();
        builder.Services.AddScoped<QuestionSubmissionService>();
        builder.Services.AddScoped<IContestAdminService, ContestAdminService>();
        builder.Services.AddScoped<ContestResultsService>();
        builder.Services.AddScoped<Umbraco.Plugin.Custom.Core.Administration.ContestReportingService>();
        builder.Services.AddScoped<Umbraco.Plugin.Custom.Core.Administration.ContestAuditService>();
        builder.Services.AddScoped<IQuestionSubmissionService, QuestionSubmissionService>();
        builder.Services.AddScoped<QuestionModerationService>();
        builder.Services.AddScoped<IQuestionModerationService>(services => services.GetRequiredService<QuestionModerationService>());
        builder.Services.AddScoped<IPublishedQuestionService>(services => services.GetRequiredService<QuestionModerationService>());
        builder.Services.AddScoped<QuestionOperations>();
        builder.Services.AddScoped<QuestionRetentionService>();
        builder.Services.AddHostedService<QuestionRetentionWorker>();
        builder.Services.AddScoped<ContestScheduleService>();
        builder.Services.AddScoped<ContestPromotionService>();
        builder.Services.AddScoped<ICurrentContestService>(services => new CurrentContestService(
            services.GetRequiredService<IContestCatalog>()));

        // Ngan hang cau hoi giu trong bo nho
        builder.Services.AddSingleton<IQuestionBank, QuestionBank>();
        builder.Services.AddScoped<IQuizAdminService, QuizAdminService>();

        // Cap quyen section Backoffice cho nhom Administrators sau khi Umbraco khoi dong.
        builder.AddNotificationAsyncHandler<
            UmbracoApplicationStartedNotification,
            ContestManagementSectionAccessHandler>();

        builder.Services.AddSingleton<IAppInfoService, AppInfoService>();
    }
}
