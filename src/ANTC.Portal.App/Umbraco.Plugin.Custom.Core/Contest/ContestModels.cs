namespace Umbraco.Plugin.Custom.Core.Contest;

public sealed class ContestSecurityOptions
{
    public const string SectionName = "Contest";

    public string IpHashSalt { get; set; } = "";
}
