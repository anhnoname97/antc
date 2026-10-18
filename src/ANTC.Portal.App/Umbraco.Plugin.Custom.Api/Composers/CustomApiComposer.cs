using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Plugin.Custom.Api.Models;

namespace Umbraco.Plugin.Custom.Api.Composers;

/// <summary>Chuan hoa loi model binding cua API ve cung hop dong loi cua du an.</summary>
public class CustomApiComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.Configure<ApiBehaviorOptions>(options =>
        {
            options.InvalidModelStateResponseFactory = context =>
            {
                var fields = new Dictionary<string, string>();
                foreach ((string key, var value) in context.ModelState)
                {
                    string field = NormalizeField(key);
                    fields.TryAdd(field, value.Errors.Count > 0 ? "Giá trị không hợp lệ." : "Dữ liệu không hợp lệ.");
                }

                if (fields.Count == 0)
                {
                    fields["body"] = "Dữ liệu gửi lên không hợp lệ.";
                }

                return new BadRequestObjectResult(new ApiErrorResponse(
                    new ApiError("VALIDATION", "Dữ liệu gửi lên không hợp lệ.", fields)));
            };
        });
    }

    private static string NormalizeField(string key)
    {
        string normalized = key.TrimStart('$', '.');
        int separator = normalized.LastIndexOf('.');
        return string.IsNullOrWhiteSpace(normalized)
            ? "body"
            : normalized[(separator + 1)..];
    }
}
