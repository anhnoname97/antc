using Umbraco.Plugin.Custom.Api.Models;
using Umbraco.Plugin.Custom.Api.Validation;
using Umbraco.Plugin.Custom.Core.Data;

namespace Umbraco.Plugin.Custom.Tests;

public class ContestEntryRequestValidatorTests
{
    [Theory]
    [InlineData("+84 912 345 678", "0912345678")]
    [InlineData("0912.345.678", "0912345678")]
    [InlineData("0912345678", "0912345678")]
    public void NamedEntry_NormalizesEquivalentPhoneNumbers(string input, string expected)
    {
        var request = new CreateContestEntryRequest("named", "Nguyễn Văn An", input, null, true);

        bool valid = ContestEntryRequestValidator.TryValidate(request, out var registration, out var fields);

        Assert.True(valid);
        Assert.Empty(fields);
        Assert.Equal(expected, registration!.Phone);
    }

    [Fact]
    public void AnonymousEntry_RejectsEveryPersonalField_EvenWhenEmpty()
    {
        var request = new CreateContestEntryRequest("anon", "", null, null, null);

        bool valid = ContestEntryRequestValidator.TryValidate(request, out _, out var fields);

        Assert.False(valid);
        Assert.Contains("fullName", fields.Keys);
    }

    [Fact]
    public void AnonymousEntry_WithoutPersonalData_IsValid()
    {
        var request = new CreateContestEntryRequest("anon", null, null, null, null);

        bool valid = ContestEntryRequestValidator.TryValidate(request, out var registration, out var fields);

        Assert.True(valid);
        Assert.Empty(fields);
        Assert.Equal(EntryModes.Anon, registration!.Mode);
        Assert.Null(registration.Phone);
    }
}
