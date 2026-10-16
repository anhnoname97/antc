using Microsoft.AspNetCore.Mvc;
using Umbraco.Plugin.Custom.Api.Controllers;
using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Core.Questions;

namespace Umbraco.Plugin.Custom.Tests;

public class PublishedQuestionRequestTests
{
    [Theory]
    [InlineData(0, 20, null, "newest", "page")]
    [InlineData(1, 0, null, "newest", "pageSize")]
    [InlineData(1, 51, null, "newest", "pageSize")]
    [InlineData(1, 20, null, "NEWEST", "sort")]
    public async Task Invalid_query_returns_field_errors_without_calling_storage(int page, int size, string? search, string? sort, string field)
    {
        var service = new FakePublishedService();
        var response = Assert.IsType<BadRequestObjectResult>(await new PublishedQuestionsController(service).List(page, size, search, sort));
        var error = Assert.IsType<ApiErrorResponse>(response.Value).Error;
        Assert.Equal("VALIDATION", error.Code); Assert.Contains(field, error.Fields!.Keys);
        Assert.Null(service.Query);
    }

    [Fact]
    public async Task Search_bound_is_applied_after_trimming_and_all_query_fields_are_forwarded()
    {
        var service = new FakePublishedService(); var controller = new PublishedQuestionsController(service);
        var bad = Assert.IsType<BadRequestObjectResult>(await controller.List(search: new string('a', 201)));
        Assert.Contains("search", Assert.IsType<ApiErrorResponse>(bad.Value).Error.Fields!.Keys);
        Assert.Null(service.Query);
        var result = Assert.IsType<OkObjectResult>(await controller.List(3, 7, "  " + new string('a', 200) + "  ", "oldest"));
        Assert.Equal(3, service.Query!.Page); Assert.Equal(7, service.Query.PageSize);
        Assert.Equal("oldest", service.Query.Sort); Assert.Equal(200, service.Query.SearchTerm!.Length);
        var response = Assert.IsType<PublishedQuestionPage>(result.Value);
        Assert.Equal(7, response.PageSize);
    }

    [Fact]
    public async Task Defaults_use_the_single_list_contract()
    {
        var service = new FakePublishedService();
        Assert.IsType<OkObjectResult>(await new PublishedQuestionsController(service).List());
        Assert.Equal(new PublishedQuestionQuery(), service.Query);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Omitted_or_blank_sort_uses_the_default(string? sort)
    {
        var service = new FakePublishedService();
        Assert.IsType<OkObjectResult>(await new PublishedQuestionsController(service).List(sort: sort));
        Assert.Equal("newest", service.Query!.Sort);
    }

    [Fact]
    public async Task Missing_and_private_detail_share_the_same_404_and_only_published_DTO_is_returned()
    {
        var service = new FakePublishedService(); var controller = new PublishedQuestionsController(service);
        foreach (long id in new[] { 0L, -1L, 100L, long.MaxValue })
        {
            var missing = Assert.IsType<NotFoundObjectResult>(await controller.Detail(id));
            var error = Assert.IsType<ApiErrorResponse>(missing.Value).Error;
            Assert.Equal("NOT_FOUND", error.Code); Assert.Equal("Không tìm thấy câu hỏi.", error.Message);
        }
        service.Published = new PublishedQuestion(1, "Câu hỏi công khai.", "Câu trả lời đã duyệt.", DateTimeOffset.UtcNow);
        Assert.Equal(service.Published, Assert.IsType<OkObjectResult>(await controller.Detail(1)).Value);
    }

    private sealed class FakePublishedService : IPublishedQuestionService
    {
        public PublishedQuestionQuery? Query { get; private set; }
        public PublishedQuestion? Published { get; set; }
        public Task<PublishedQuestionPage> ListAsync(PublishedQuestionQuery query, CancellationToken ct = default)
        {
            Query = query;
            return Task.FromResult(new PublishedQuestionPage([], 0, query.Page, query.PageSize));
        }
        public Task<PublishedQuestion?> GetPublishedAsync(long id, CancellationToken ct = default) => Task.FromResult(Published);
    }
}
