using AnToanTaiChinh.Domain.Exceptions;
using AnToanTaiChinh.Domain.ValueObjects;

namespace AnToanTaiChinh.Tests.Unit.Domain;

public sealed class SlugTests
{
    [Theory]
    [InlineData("kien-thuc-tai-chinh")]
    [InlineData("article-2026")]
    public void Create_WithValidValue_ReturnsNormalizedSlug(string value)
    {
        Slug slug = Slug.Create($"  {value.ToUpperInvariant()}  ");

        Assert.Equal(value, slug.Value);
    }

    [Theory]
    [InlineData("")]
    [InlineData("invalid slug")]
    [InlineData("invalid--slug")]
    public void Create_WithInvalidValue_ThrowsDomainValidationException(string value)
    {
        Assert.Throws<DomainValidationException>(() => Slug.Create(value));
    }
}
