using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Plugin.Custom.Core.Quiz;

namespace Umbraco.Plugin.Custom.Api.Controllers;

/// <summary>
/// Ba API chi doc ngan hang cau hoi (QUIZ-01..03 trong sheet "API" cua file ke hoach).
/// Du lieu lay tu bo nho cua IQuestionBank, khong truy van CSDL o moi yeu cau.
/// </summary>
[ApiController]
[Route("api/v1/quiz")]
public class QuizController : ControllerBase
{
    private readonly IQuestionBank _bank;

    public QuizController(IQuestionBank bank) => _bank = bank;

    /// <summary>QUIZ-01: danh sach chuyen de dang dung.</summary>
    [HttpGet("topics")]
    public IActionResult Topics() => Cached(_bank.Current.Topics);

    /// <summary>QUIZ-02: cau hoi dang dung cua mot chuyen de.</summary>
    [HttpGet("topics/{topic:int}/questions")]
    public IActionResult Questions(int topic)
    {
        if (!_bank.Current.QuestionsByTopic.TryGetValue(topic, out var questions))
        {
            return NotFound(new { error = new { code = "UNKNOWN_TOPIC", message = "Chuyên đề không tồn tại hoặc không còn dùng." } });
        }

        return Cached(questions);
    }

    /// <summary>QUIZ-03: cac cau cua trang Thu suc, theo thu tu.</summary>
    [HttpGet("sample")]
    public IActionResult Sample() => Cached(_bank.Current.Sample);

    private IActionResult Cached(object payload)
    {
        string etag = $"\"quiz-v{_bank.Current.Version}\"";
        Response.Headers.ETag = etag;
        Response.Headers.CacheControl = "public, max-age=300";
        if (Request.Headers.IfNoneMatch == etag)
        {
            return StatusCode(StatusCodes.Status304NotModified);
        }

        return Ok(payload);
    }
}