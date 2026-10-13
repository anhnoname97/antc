using System.Text.RegularExpressions;
using AnToanTaiChinh.Domain.Exceptions;

namespace AnToanTaiChinh.Domain.ValueObjects;

public readonly partial record struct Slug
{
    public string Value { get; }

    private Slug(string value)
    {
        Value = value;
    }

    public static Slug Create(string value)
    {
        string normalized = value?.Trim().ToLowerInvariant()
            ?? throw new DomainValidationException("Slug is required.");

        if (normalized.Length is < 1 or > 200 || !ValidSlugPattern().IsMatch(normalized))
        {
            throw new DomainValidationException(
                "Slug must contain only lowercase letters, numbers and single hyphens.");
        }

        return new Slug(normalized);
    }

    public override string ToString() => Value;

    [GeneratedRegex("^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    private static partial Regex ValidSlugPattern();
}
