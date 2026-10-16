using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Umbraco.Plugin.Custom.Core.Data;

/// <summary>
/// CSDL ung dung: luot thi, dap an, quay so, cau hoi gui len, ngan hang cau hoi.
/// File mac dinh: App_Data/app.sqlite.db (cau hinh ConnectionStrings:appDb).
/// Doi cau truc bang: sua entity roi chay
///   dotnet ef migrations add TenThayDoi --project src/ANTC.Portal.App/Umbraco.Plugin.Custom.Core
/// Migration duoc ap dung tu dong khi ung dung khoi dong.
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Entry> Entries => Set<Entry>();
    public DbSet<EntryAnswer> EntryAnswers => Set<EntryAnswer>();
    public DbSet<Draw> Draws => Set<Draw>();
    public DbSet<DrawWinner> DrawWinners => Set<DrawWinner>();
    public DbSet<QuestionSubmission> QuestionSubmissions => Set<QuestionSubmission>();
    public DbSet<QuizTopic> QuizTopics => Set<QuizTopic>();
    public DbSet<QuizQuestion> QuizQuestions => Set<QuizQuestion>();
    public DbSet<QuizImport> QuizImports => Set<QuizImport>();
    public DbSet<ContestCampaign> ContestCampaigns => Set<ContestCampaign>();
    public DbSet<ContestTopic> ContestTopics => Set<ContestTopic>();
    public DbSet<ContestQuestion> ContestQuestions => Set<ContestQuestion>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Entry>(e =>
        {
            e.ToTable("entry");
            e.Property(x => x.Code).HasMaxLength(9);
            e.Property(x => x.TokenHash).HasMaxLength(64);
            e.Property(x => x.Mode).HasMaxLength(5);
            e.Property(x => x.FullName).HasMaxLength(100);
            e.Property(x => x.Phone).HasMaxLength(10);
            e.Property(x => x.Org).HasMaxLength(150);
            e.Property(x => x.Status).HasMaxLength(12);
            e.Property(x => x.IpHash).HasMaxLength(64);
            e.HasIndex(x => x.Code).IsUnique();
            e.HasIndex(x => x.TokenHash).IsUnique();
            e.HasIndex(x => x.Phone);
            e.HasIndex(x => new { x.Status, x.Score });
        });

        b.Entity<EntryAnswer>(e =>
        {
            e.ToTable("entry_answer");
            e.HasKey(x => new { x.EntryId, x.QuestionCode });
            e.Property(x => x.QuestionCode).HasMaxLength(16);
            e.Property(x => x.Chosen).HasMaxLength(1);
            e.HasOne(x => x.Entry).WithMany(x => x.Answers).HasForeignKey(x => x.EntryId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.QuestionCode);
        });

        b.Entity<Draw>(e =>
        {
            e.ToTable("draw");
            e.Property(x => x.CreatedBy).HasMaxLength(100);
            e.Property(x => x.Note).HasMaxLength(200);
        });

        b.Entity<DrawWinner>(e =>
        {
            e.ToTable("draw_winner");
            e.HasKey(x => new { x.DrawId, x.Rank });
            e.Property(x => x.Code).HasMaxLength(9);
            e.Property(x => x.FullName).HasMaxLength(100);
            e.Property(x => x.Phone).HasMaxLength(10);
            e.HasOne(x => x.Draw).WithMany(x => x.Winners).HasForeignKey(x => x.DrawId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<QuestionSubmission>(e =>
        {
            e.ToTable("question_submission");
            e.Property(x => x.Type).HasMaxLength(8);
            e.Property(x => x.Content).HasMaxLength(2000);
            e.Property(x => x.Contact).HasMaxLength(200);
            e.Property(x => x.Status).HasMaxLength(10);
            e.Property(x => x.AdminNote).HasMaxLength(1000);
            e.Property(x => x.HandledBy).HasMaxLength(100);
            e.Property(x => x.IpHash).HasMaxLength(64);
            e.HasIndex(x => new { x.Status, x.CreatedAt });
            e.HasIndex(x => new { x.IpHash, x.CreatedAt });
            e.Property(x => x.Answer).HasMaxLength(10000);
            e.Property(x => x.PublishedAnswer).HasMaxLength(10000);
            e.Property(x => x.ApprovedBy).HasMaxLength(100);
            e.HasIndex(x => new { x.IsPublished, x.ApprovedAt });
        });

        b.Entity<QuizTopic>(e =>
        {
            e.ToTable("quiz_topic");
            e.Property(x => x.Id).ValueGeneratedNever();
            e.Property(x => x.Title).HasMaxLength(200);
        });

        b.Entity<QuizQuestion>(e =>
        {
            e.ToTable("quiz_question");
            e.HasKey(x => x.Code);
            e.Property(x => x.Code).HasMaxLength(16);
            e.Property(x => x.Kind).HasMaxLength(40);
            e.Property(x => x.Answer).HasMaxLength(1);
            e.Property(x => x.SampleLabel).HasMaxLength(60);
            e.HasOne(x => x.Topic).WithMany(x => x.Questions).HasForeignKey(x => x.TopicId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.TopicId);
        });

        b.Entity<ContestCampaign>(e =>
        {
            e.ToTable("contest");
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.Description).HasMaxLength(2000);
            e.HasIndex(x => new { x.IsActive, x.StartAt, x.EndAt });
        });

        b.Entity<ContestTopic>(e =>
        {
            e.ToTable("contest_topic");
            e.HasKey(x => new { x.ContestId, x.TopicId });
            e.HasOne(x => x.Contest).WithMany(x => x.Topics).HasForeignKey(x => x.ContestId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Topic).WithMany(x => x.Contests).HasForeignKey(x => x.TopicId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.TopicId);
        });

        b.Entity<ContestQuestion>(e =>
        {
            e.ToTable("contest_question");
            e.HasKey(x => new { x.ContestId, x.QuestionCode });
            e.Property(x => x.QuestionCode).HasMaxLength(16);
            e.HasOne(x => x.Contest).WithMany(x => x.Questions).HasForeignKey(x => x.ContestId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Question).WithMany(x => x.Contests).HasForeignKey(x => x.QuestionCode).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.QuestionCode);
        });

        b.Entity<QuizImport>(e =>
        {
            e.ToTable("quiz_import");
            e.Property(x => x.CreatedBy).HasMaxLength(100);
            e.Property(x => x.FileName).HasMaxLength(200);
        });

        // Ten cot dang snake_case (FullName -> full_name) cho dong bo voi tai lieu.
        foreach (var entity in b.Model.GetEntityTypes())
        {
            foreach (var property in entity.GetProperties())
            {
                property.SetColumnName(Regex.Replace(property.Name, "(?<=[a-z0-9])([A-Z])", "_$1").ToLowerInvariant());
            }
        }
    }
}

/// <summary>Cho lenh "dotnet ef" tao migration ma khong can khoi dong Umbraco.</summary>
public class AppDbContextDesignFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args) =>
        new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite("Data Source=design-time.sqlite.db").Options);
}
