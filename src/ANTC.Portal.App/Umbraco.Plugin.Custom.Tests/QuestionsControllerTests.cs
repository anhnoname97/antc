using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Umbraco.Plugin.Custom.Api.Controllers;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Contest;
using Umbraco.Plugin.Custom.Core.Data;
using Umbraco.Plugin.Custom.Core.Questions;

namespace Umbraco.Plugin.Custom.Tests;

public class QuestionsControllerTests
{
    [Fact]
    public async Task Feedback_IsStored_AndSixthRequestIsRateLimited()
    {
        string path = Path.Combine(Path.GetTempPath(), $"antc-feedback-{Guid.NewGuid():N}.db");
        try
        {
            await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite($"Data Source={path}").Options);
            await db.Database.EnsureCreatedAsync();
            var controller = new QuestionsController(new QuestionSubmissionService(db,
                Options.Create(new ContestSecurityOptions { IpHashSalt = "test-salt" }), TimeProvider.System))
            { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
            var request = new CreateQuestionRequest("gop-y", "  góp ý cuộc thi  ", false, "", true, "");
            for (int i = 0; i < 5; i++)
                Assert.Equal(201, Assert.IsType<ObjectResult>(await controller.Create(request, default)).StatusCode);
            Assert.Equal(429, Assert.IsType<ObjectResult>(await controller.Create(request, default)).StatusCode);
            var rows = await db.QuestionSubmissions.AsNoTracking().ToListAsync();
            Assert.Equal(5, rows.Count);
            Assert.All(rows, row => { Assert.Equal("gop-y", row.Type); Assert.Equal("góp ý cuộc thi", row.Content);
                Assert.Null(row.Contact); Assert.Equal("moi", row.Status); Assert.Equal(64, row.IpHash!.Length); });
            // Spam trap does not insert or consume another slot.
            Assert.Equal(201, Assert.IsType<ObjectResult>(await controller.Create(request with { Website = "spam" }, default)).StatusCode);
            Assert.Equal(5, await db.QuestionSubmissions.CountAsync());
        }
        finally
        {
            Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
            File.Delete(path);
        }
    }

    [Theory]
    [InlineData("other", "Nội dung góp ý", true, false, "")]
    [InlineData("gop-y", "ngắn", true, false, "")]
    [InlineData("gop-y", "Nội dung góp ý", false, false, "")]
    [InlineData("cau-hoi", "Nội dung câu hỏi", true, true, "")]
    public async Task InvalidRequests_AreRejectedBeforePersistence(string type, string content, bool consent, bool wantReply, string contact)
    {
        var controller = new QuestionsController(null!);
        Assert.IsType<BadRequestObjectResult>(await controller.Create(new(type, content, wantReply, contact, consent, ""), default));
    }
}
