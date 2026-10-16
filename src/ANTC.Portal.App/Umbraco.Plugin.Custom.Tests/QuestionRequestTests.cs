using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Plugin.Custom.Api.Controllers;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Api.Validation;
using Umbraco.Plugin.Custom.Core.Questions;

namespace Umbraco.Plugin.Custom.Tests;

public class QuestionRequestTests
{
    [Theory]
    [InlineData(9, false)]
    [InlineData(10, true)]
    [InlineData(2000, true)]
    [InlineData(2001, false)]
    public void Content_length_is_checked_after_trimming(int length, bool valid)
    {
        var request = Valid() with { Content = " \n" + new string('a', length) + " \t" };
        Assert.Equal(valid, QuestionRequestValidator.TryValidate(request, out var row, out var fields));
        if (valid) Assert.Equal(length, row!.Content.Length);
        else Assert.Contains("content", fields.Keys);
    }

    [Fact]
    public void Missing_request_reports_the_contract_fields()
    {
        Assert.False(QuestionRequestValidator.TryValidate(null, out _, out var fields));
        Assert.Equal(new[] { "consent", "content", "type" }, fields.Keys.Order().ToArray());
    }

    [Theory]
    [InlineData("cau-hoi", true)]
    [InlineData("gop-y", true)]
    [InlineData("kien-nghi", false)]
    [InlineData("CAU-HOI", false)]
    public void Only_the_two_contract_types_are_accepted(string type, bool valid) =>
        Assert.Equal(valid, QuestionRequestValidator.TryValidate(Valid() with { Type = type }, out _, out _));

    [Theory]
    [InlineData(null)]
    [InlineData(false)]
    public void Explicit_consent_is_required(bool? consent)
    {
        Assert.False(QuestionRequestValidator.TryValidate(Valid() with { Consent = consent }, out _, out var fields));
        Assert.Contains("consent", fields.Keys);
    }

    [Theory]
    [InlineData(false, 0, true)]
    [InlineData(true, 0, false)]
    [InlineData(true, 200, true)]
    [InlineData(true, 201, false)]
    [InlineData(false, 201, false)]
    public void Private_reply_requires_contact_and_contact_is_bounded(bool wantReply, int length, bool valid) =>
        Assert.Equal(valid, QuestionRequestValidator.TryValidate(Valid() with
        { WantReply = wantReply, Contact = "  " + new string('a', length) + "  " }, out _, out _));

    [Fact]
    public async Task Honeypot_returns_the_same_201_without_validation_or_storage()
    {
        var service = new FakeService();
        QuestionsController controller = Controller(service);
        var result = Assert.IsType<ObjectResult>(await controller.Create(Valid() with
        { Website = "https://bot.invalid", Content = "x", Consent = false, Type = "wrong" }, default));
        Assert.Equal(201, result.StatusCode);
        Assert.True(Assert.IsType<CreateQuestionResponse>(result.Value).Ok);
        Assert.Equal(0, service.Calls);
    }

    [Fact]
    public async Task Rate_limit_uses_the_contract_error_and_retry_header()
    {
        var service = new FakeService { Limited = true };
        QuestionsController controller = Controller(service);
        var result = Assert.IsType<ObjectResult>(await controller.Create(Valid(), default));
        Assert.Equal(429, result.StatusCode);
        Assert.Equal("RATE_LIMITED", Assert.IsType<ApiErrorResponse>(result.Value).Error.Code);
        Assert.Equal("60", controller.Response.Headers.RetryAfter);
    }

    [Fact]
    public async Task Invalid_submission_is_400_and_does_not_reach_storage()
    {
        var service = new FakeService();
        var result = Assert.IsType<BadRequestObjectResult>(await Controller(service).Create(Valid() with { Content = "short" }, default));
        Assert.Equal("VALIDATION", Assert.IsType<ApiErrorResponse>(result.Value).Error.Code);
        Assert.Equal(0, service.Calls);
    }

    private static CreateQuestionRequest Valid() => new("cau-hoi", "Tôi cần tư vấn về cuộc gọi giả mạo.", false, "", true, "");
    private static QuestionsController Controller(FakeService service) => new(service)
    { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };

    private sealed class FakeService : IQuestionSubmissionService
    {
        public int Calls { get; private set; }
        public bool Limited { get; init; }
        public Task SubmitAsync(QuestionRegistration registration, IPAddress? ip, CancellationToken ct = default)
        { Calls++; if (Limited) throw new QuestionRateLimitedException(60); return Task.CompletedTask; }
        public Task<QuestionPage> ListAsync(QuestionFilter filter, int page, CancellationToken ct = default) => throw new NotSupportedException();
        public IAsyncEnumerable<QuestionRow> ExportAsync(QuestionFilter filter, CancellationToken ct = default) => throw new NotSupportedException();
        public Task<bool> ReviewAsync(long id, string status, string? note, string actor, CancellationToken ct = default) => throw new NotSupportedException();
    }
}
