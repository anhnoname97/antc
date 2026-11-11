using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using System.Text.Json;
using Umbraco.Plugin.Custom.Core.Data;
using Umbraco.Plugin.Custom.Core.Quiz;

namespace Umbraco.Plugin.Custom.Tests;

public sealed class QuizWorkbookTests
{
    [Theory] [InlineData(10)] [InlineData(50)] [InlineData(100)]
    public async Task ImportHistory_RespectsPageSize(int size)
    {
        await using var test = await Fixture.Create();
        for(int i=0;i<125;i++) test.Db.QuizImports.Add(new QuizImport { FileName=$"history-{i}.xlsx", CreatedBy="test", CreatedAt=DateTime.UtcNow });
        await test.Db.SaveChangesAsync();
        var first=await test.Service.HistoryAsync(1,default,size);
        var second=await test.Service.HistoryAsync(2,default,size);
        Assert.Equal(size,first.Items.Count); Assert.Equal(size,first.PageSize); Assert.Equal(125,first.TotalItems);
        Assert.Equal(Math.Min(size,125-size),second.Items.Count);
        Assert.Empty(first.Items.Select(x=>x.Id).Intersect(second.Items.Select(x=>x.Id)));
    }
    [Fact] public async Task ExportRoundtrip_IsZeroChanges_AndPreviewDoesNotWrite()
    {
        await using var test = await Fixture.Create();
        byte[] bytes = await test.Service.ExportAsync(false, default);
        var p = await test.Service.PreviewAsync(bytes, "export.xlsx", "admin", default);
        Assert.Empty(p.Errors); Assert.NotNull(p.PreviewId);
        Assert.Equal((0, 0, 0), (p.Added, p.Updated, p.Deactivated)); Assert.Empty(p.Topics);
        Assert.Empty(await test.Db.QuizImports.ToListAsync()); Assert.False(Directory.Exists(Path.Combine(test.Root, "App_Data")));
        var result = await test.Service.ConfirmAsync(new(p.PreviewId!, null), "admin", default);
        Assert.Equal((0, 0, 0), (result.Added, result.Updated, result.Deactivated));
        Assert.True(result.CanDownload); Assert.Equal(1, test.Bank.Reloads);
        var download = await test.Service.DownloadAsync(result.Id, default);
        Assert.Equal(bytes, download!.Value.Bytes);
        var again = await test.Service.PreviewAsync(await test.Service.ExportAsync(false, default), "again.xlsx", "admin", default);
        Assert.Empty(again.Errors); Assert.Equal((0, 0, 0), (again.Added, again.Updated, again.Deactivated));
    }
    [Fact] public async Task EditAddTopicAndTwoOptionQuestion_ReportsExactColumns_ThenCommits()
    {
        await using var test = await Fixture.Create();
        byte[] bytes = await test.Edit(w => {
            var q = w.Worksheet("CauHoi"); q.Cell(2, 5).Value = "Nội dung vừa sửa?";
            q.Row(2).CopyTo(q.Row(4)); q.Cell(4, 2).Value = "Q3"; q.Cell(4, 1).Value = "2";
            var t = w.Worksheet("ChuyenDe"); t.Row(2).CopyTo(t.Row(3)); t.Cell(3, 1).Value = "2"; t.Cell(3, 2).Value = "Chuyên đề mới";
        });
        var p = await test.Service.PreviewAsync(bytes, "edit.xlsx", "admin", default);
        Assert.Empty(p.Errors); Assert.Equal((1, 1, 0), (p.Added, p.Updated, p.Deactivated));
        Assert.Equal(new[] { "Câu hỏi" }, p.Questions.Single(c => c.Code == "Q1").Columns);
        Assert.Single(p.Topics);
        await test.Service.ConfirmAsync(new(p.PreviewId!, null), "admin", default);
        Assert.Equal("Nội dung vừa sửa?", (await test.Db.QuizQuestions.SingleAsync(q => q.Code == "Q1")).Question);
        var q3 = await test.Db.QuizQuestions.SingleAsync(q => q.Code == "Q3");
        Assert.Equal(2, q3.TopicId); Assert.Equal(2, JsonDocument.Parse(q3.Options).RootElement.GetArrayLength());
        Assert.Equal("B", q3.Answer); Assert.Equal(3, await test.Db.QuizQuestions.CountAsync(q => q.IsActive));
    }
    [Fact] public async Task InvalidAnswerE_ReportsSheetRowAndColumn_WithoutWrites()
    {
        await using var test = await Fixture.Create();
        byte[] bytes = await test.Edit(w => w.Worksheet("CauHoi").Cell(3, 10).Value = "E");
        var p = await test.Service.PreviewAsync(bytes, "bad.xlsx", "admin", default);
        Assert.Null(p.PreviewId); Assert.Contains(p.Errors, e => e.Sheet == "CauHoi" && e.Row == 3 && e.Column == "Đáp án đúng");
        Assert.Empty(await test.Db.QuizImports.ToListAsync());
    }
    [Fact] public async Task ValidationCollectsMissingTopicDuplicateCodeMissingExplanationAndBadNumbers()
    {
        await using var test = await Fixture.Create();
        byte[] bytes = await test.Edit(w => {
            var q = w.Worksheet("CauHoi"); q.Cell(2, 1).Value = "999"; q.Cell(3, 2).Value = "Q1";
            q.Cell(2, 11).Clear(); q.Cell(2, 16).Value = "601"; q.Cell(2, 17).Value = "2"; q.Cell(3, 17).Value = "2";
        });
        var p = await test.Service.PreviewAsync(bytes, "bad.xlsx", "admin", default);
        foreach (string column in new[] { "Số chuyên đề", "Mã câu", "Giải thích A", "Thời gian đọc (giây)", "Thứ tự Thử sức" })
            Assert.Contains(p.Errors, e => e.Column == column);
        Assert.Null(p.PreviewId);
    }
    [Fact] public async Task MissingHeaderAndFormula_AreRejected()
    {
        await using var test = await Fixture.Create();
        var missing = await test.Service.PreviewAsync(await test.Edit(w => w.Worksheet("CauHoi").Cell(1, 10).Value = "Sai tên"), "bad.xlsx", "admin", default);
        Assert.Contains(missing.Errors, e => e.Row == 1 && e.Column == "Đáp án đúng");
        var formula = await test.Service.PreviewAsync(await test.Edit(w => w.Worksheet("CauHoi").Cell(2, 5).FormulaA1 = "1+1"), "bad.xlsx", "admin", default);
        Assert.Contains(formula.Errors, e => e.Row == 2 && e.Column == "Câu hỏi" && e.Message.Contains("công thức"));
    }
    [Fact] public async Task RemovalOnlyDeactivates_PreservesAnswerAndContestSnapshot()
    {
        await using var test = await Fixture.Create();
        await test.AddContest(false);
        test.Db.EntryAnswers.Add(new EntryAnswer { EntryId = 1, QuestionCode = "Q2", Topic = 1, Chosen = "B", IsCorrect = true, AnsweredAt = DateTime.UtcNow });
        await test.Db.SaveChangesAsync();
        var p = await test.Service.PreviewAsync(await test.Edit(w => w.Worksheet("CauHoi").Row(3).Delete()), "remove.xlsx", "admin", default);
        Assert.Empty(p.Errors); Assert.Equal(1, p.Deactivated); Assert.Contains("Q2", p.DeactivatedCodes);
        await test.Service.ConfirmAsync(new(p.PreviewId!, null), "admin", default);
        Assert.False((await test.Db.QuizQuestions.SingleAsync(q => q.Code == "Q2")).IsActive);
        Assert.True((await test.Db.EntryAnswers.SingleAsync()).IsCorrect);
        Assert.Equal("B", (await test.Db.ContestQuestions.SingleAsync()).Answer);
        Assert.Equal("Đề cũ không thay đổi", (await test.Db.ContestQuestions.SingleAsync()).QuestionText);
        Assert.Equal((0, 0, 0), await test.RoundtripCounts());
    }
    [Fact] public async Task ActiveContestRequiresExactPhrase_AndRechecksContestAtCommit()
    {
        await using var test = await Fixture.Create();
        var p = await test.Service.PreviewAsync(await test.Service.ExportAsync(false, default), "live.xlsx", "admin", default);
        Assert.False(p.DuringContest);
        await test.AddContest(true);
        var ex = await Assert.ThrowsAsync<QuizAdminConflictException>(() => test.Service.ConfirmAsync(new(p.PreviewId!, "wrong"), "admin", default));
        Assert.Equal("IMPORT_CONFIRMATION_REQUIRED", ex.Code); Assert.Contains("1 lượt thi dở", ex.Message);
        Assert.Empty(await test.Db.QuizImports.ToListAsync());
        await test.Service.ConfirmAsync(new(p.PreviewId!, QuizWorkbookService.ConfirmationPhrase), "admin", default);
        Assert.True((await test.Db.QuizImports.SingleAsync()).DuringContest);
    }
    [Fact] public async Task StalePreviewAndOtherActor_CannotCommit()
    {
        await using var test = await Fixture.Create();
        var p = await test.Service.PreviewAsync(await test.Service.ExportAsync(false, default), "edit.xlsx", "admin", default);
        var wrongActor = await Assert.ThrowsAsync<QuizAdminConflictException>(() => test.Service.ConfirmAsync(new(p.PreviewId!, null), "other", default));
        Assert.Equal("IMPORT_EXPIRED", wrongActor.Code);
        var q = await test.Db.QuizQuestions.FirstAsync(); q.Question = "Đã sửa ở cửa sổ khác?"; q.Revision++; await test.Db.SaveChangesAsync();
        var stale = await Assert.ThrowsAsync<QuizAdminConflictException>(() => test.Service.ConfirmAsync(new(p.PreviewId!, null), "admin", default));
        Assert.Equal("BANK_CHANGED", stale.Code); Assert.Empty(await test.Db.QuizImports.ToListAsync());
    }
    [Fact] public async Task FileFailureRollsBackAllChanges_AndDoesNotDeleteExistingArchive()
    {
        await using var test = await Fixture.Create();
        var p = await test.Service.PreviewAsync(await test.Edit(w => w.Worksheet("CauHoi").Cell(2, 5).Value = "Thay đổi không được lưu?"), "edit.xlsx", "admin", default);
        string dir = Directory.CreateDirectory(Path.Combine(test.Root, "App_Data", "imports")).FullName;
        string existing = Path.Combine(dir, "1.xlsx"); await File.WriteAllTextAsync(existing, "evidence");
        await Assert.ThrowsAsync<IOException>(() => test.Service.ConfirmAsync(new(p.PreviewId!, null), "admin", default));
        Assert.Equal("evidence", await File.ReadAllTextAsync(existing)); Assert.Empty(await test.Db.QuizImports.ToListAsync());
        Assert.Equal("Có nên cung cấp mã OTP?", (await test.Db.QuizQuestions.SingleAsync(q => q.Code == "Q1")).Question);
    }
    [Fact] public async Task RejectsNonExcelOversizedAndEmptyFiles()
    {
        await using var test = await Fixture.Create();
        await Assert.ThrowsAsync<QuizAdminValidationException>(() => test.Service.PreviewAsync([1], "file.xls", "admin", default));
        await Assert.ThrowsAsync<QuizAdminValidationException>(() => test.Service.PreviewAsync(new byte[5 * 1024 * 1024 + 1], "big.xlsx", "admin", default));
        await Assert.ThrowsAsync<QuizAdminValidationException>(() => test.Service.PreviewAsync([1, 2, 3], "bad.xlsx", "admin", default));
        var p = await test.Service.PreviewAsync(await test.Edit(w => w.Worksheet("CauHoi").Rows(2, 3).Delete()), "empty.xlsx", "admin", default);
        Assert.Null(p.PreviewId); Assert.Contains(p.Errors, e => e.Message.Contains("ít nhất một câu"));
    }
    [Fact] public async Task TemplateIsValid_AndHistorySurvivesNewService()
    {
        await using var test = await Fixture.Create();
        var p = await test.Service.PreviewAsync(await test.Service.ExportAsync(true, default), "template.xlsx", "admin", default);
        Assert.Empty(p.Errors); await test.Service.ConfirmAsync(new(p.PreviewId!, null), "admin", default);
        await using var fresh = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(test.Db.Database.GetConnectionString()).Options);
        var service = new QuizWorkbookService(fresh, test.Bank, TimeProvider.System, new Host(test.Root), test.Previews);
        var history = await service.HistoryAsync(1, default);
        Assert.Single(history.Items); Assert.True(history.Items[0].CanDownload);
        Assert.Equal("admin", history.Items[0].CreatedBy);
    }
    [Fact] public async Task ConcurrentConfirmation_OnlyCommitsOneImport()
    {
        await using var test = await Fixture.Create();
        var p = await test.Service.PreviewAsync(await test.Service.ExportAsync(false, default), "same.xlsx", "admin", default);
        var tasks = Enumerable.Range(0, 5).Select(_ => Task.Run(async () => {
            await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(test.Db.Database.GetConnectionString()).Options);
            var service = new QuizWorkbookService(db, test.Bank, TimeProvider.System, new Host(test.Root), test.Previews);
            try { await service.ConfirmAsync(new(p.PreviewId!, null), "admin", default); return true; }
            catch (QuizAdminConflictException e) { Assert.Contains(e.Code, new[] { "BANK_CHANGED", "IMPORT_EXPIRED" }); return false; }
        }));
        Assert.Equal(1, (await Task.WhenAll(tasks)).Count(x => x));
        Assert.Equal(1, await test.Db.QuizImports.CountAsync());
        Assert.Single(Directory.GetFiles(Path.Combine(test.Root, "App_Data", "imports"), "*.xlsx"));
    }
    [Fact] public async Task AudienceMetadata_Roundtrips_AndLegacyWorkbookPreservesIt()
    {
        await using var test = await Fixture.Create();
        var topic = await test.Db.QuizTopics.SingleAsync();
        topic.Audience = "enterprise"; topic.ShortTitle = "Phần A"; topic.Caption = "{count} câu độc lập";
        await test.Db.SaveChangesAsync();
        Assert.Equal((0, 0, 0), await test.RoundtripCounts());
        var bytes = await test.Edit(w => w.Worksheet("ChuyenDe").Columns(5, 7).Delete());
        var preview = await test.Service.PreviewAsync(bytes, "legacy.xlsx", "admin", default);
        Assert.Empty(preview.Errors); Assert.Empty(preview.Topics);
        await test.Service.ConfirmAsync(new(preview.PreviewId!, null), "admin", default);
        await test.Db.Entry(topic).ReloadAsync();
        Assert.Equal("enterprise", topic.Audience); Assert.Equal("Phần A", topic.ShortTitle);
        Assert.Equal("{count} câu độc lập", topic.Caption);
    }

    [Fact] public async Task InvalidAudience_IsRejectedWithoutWriting()
    {
        await using var test = await Fixture.Create();
        var bytes = await test.Edit(w => w.Worksheet("ChuyenDe").Cell(2, 5).Value = "unknown");
        var preview = await test.Service.PreviewAsync(bytes, "bad.xlsx", "admin", default);
        Assert.Null(preview.PreviewId); Assert.Contains(preview.Errors, e => e.Column == "Nhóm người đọc");
        Assert.Equal("general", (await test.Db.QuizTopics.SingleAsync()).Audience);
    }

    [Fact] public async Task EnterpriseExplanationFormat_RequiresCorrectAnswerExplanation_AndPreservesLongContext()
    {
        await using var test = await Fixture.Create();
        void Edit(XLWorkbook w)
        {
            w.Worksheet("CauHoi").Cell(2, 3).Value = "Tình huống 1 · Bước 1/3 · Nhà cung cấp lâu năm đổi bên thụ hưởng";
            w.Worksheet("CauHoi").Cell(2, 11).Value = "";
        }
        var common = await test.Service.PreviewAsync(await test.Edit(Edit), "common.xlsx", "admin", default);
        Assert.Contains(common.Errors, e => e.Column == "Giải thích A");
        var enterprise = await test.Service.PreviewAsync(await test.Edit(w => { Edit(w); w.Worksheet("ChuyenDe").Cell(2, 5).Value = "enterprise"; }), "enterprise.xlsx", "admin", default);
        Assert.Empty(enterprise.Errors);
        await test.Service.ConfirmAsync(new(enterprise.PreviewId!, null), "admin", default);
        var question = await test.Db.QuizQuestions.SingleAsync(q => q.Code == "Q1");
        Assert.True(question.Kind.Length > 40); Assert.DoesNotContain("\"A\"", question.Explanations);
        var missing = await test.Service.PreviewAsync(await test.Edit(w => w.Worksheet("CauHoi").Cell(2, 12).Value = ""), "missing.xlsx", "admin", default);
        Assert.Contains(missing.Errors, e => e.Column == "Giải thích B");
    }

    private sealed class FakeBank : IQuestionBank { public int Reloads; public QuestionBankSnapshot Current => new(); public void Reload() => Reloads++; }
    private sealed class Host(string root) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Testing";
        public string ApplicationName { get; set; } = "Tests";
        public string ContentRootPath { get; set; } = root;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
    private sealed class Fixture : IAsyncDisposable
    {
        public string Root { get; } = Directory.CreateDirectory(Path.Combine(Path.GetTempPath(), "antc-workbook-" + Guid.NewGuid().ToString("N"))).FullName;
        public AppDbContext Db { get; }
        public FakeBank Bank { get; } = new();
        public QuizWorkbookPreviews Previews { get; } = new();
        public QuizWorkbookService Service { get; }
        private Fixture()
        {
            Db = new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite($"Data Source={Path.Combine(Root, "app.db")};Pooling=False").Options);
            Service = new(Db, Bank, TimeProvider.System, new Host(Root), Previews);
        }
        public static async Task<Fixture> Create()
        {
            var t = new Fixture(); await t.Db.Database.EnsureCreatedAsync();
            t.Db.QuizTopics.Add(new QuizTopic { Id = 1, Title = "Chuyên đề một", Intro = "[\"Giới thiệu một\",\"Giới thiệu hai\"]", Terms = "[[\"OTP\",\"Mật khẩu một lần\"]]" });
            foreach (string code in new[] { "Q1", "Q2" }) t.Db.QuizQuestions.Add(new QuizQuestion { Code = code, TopicId = 1, Kind = "Đúng – Sai", Question = "Có nên cung cấp mã OTP?",
                Options = "[[\"A\",\"Đúng\"],[\"B\",\"Sai\"]]", Answer = "B", Explanations = "{\"A\":\"Không nên\",\"B\":\"Chính xác\"}", ReadSeconds = 10, SortOrder = 1 });
            await t.Db.SaveChangesAsync(); return t;
        }
        public async Task<byte[]> Edit(Action<XLWorkbook> action)
        {
            using var w = new XLWorkbook(new MemoryStream(await Service.ExportAsync(false, default))); action(w);
            using var stream = new MemoryStream(); w.SaveAs(stream); return stream.ToArray();
        }
        public async Task<(int, int, int)> RoundtripCounts()
        {
            var p = await Service.PreviewAsync(await Service.ExportAsync(false, default), "roundtrip.xlsx", "admin", default);
            Assert.Empty(p.Errors); return (p.Added, p.Updated, p.Deactivated);
        }
        public async Task AddContest(bool active)
        {
            var c = new ContestCampaign { Name = "Cuộc thi", StartAt = DateTime.UtcNow.AddHours(-2), EndAt = active ? DateTime.UtcNow.AddHours(2) : DateTime.UtcNow.AddHours(-1), IsActive = true };
            c.Topics.Add(new ContestTopic { TopicId = 1, Title = "Chuyên đề cũ" });
            c.Questions.Add(new ContestQuestion { QuestionCode = "Q2", TopicId = 1, Answer = "B", QuestionText = "Đề cũ không thay đổi" });
            Db.ContestCampaigns.Add(c); await Db.SaveChangesAsync();
            Db.Entries.Add(new Entry { Id = 1, ContestId = c.Id, Code = "AD-ABC234", TokenHash = new string('a', 64), CreatedAt = DateTime.UtcNow });
            await Db.SaveChangesAsync();
        }
        public async ValueTask DisposeAsync()
        {
            await Db.DisposeAsync(); Previews.Dispose();
            // Only this fixture's GUID-named temporary directory, never the user's databases.
            Directory.Delete(Root, true);
        }
    }
}
