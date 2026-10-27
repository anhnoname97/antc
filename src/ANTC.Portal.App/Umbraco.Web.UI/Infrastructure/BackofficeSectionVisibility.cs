namespace Antc.Infrastructure;

/// <summary>Site-wide visibility, applied before the backoffice renders its sections.</summary>
public static class BackofficeSectionVisibility
{
    public static IReadOnlyList<string> HiddenSections(IConfiguration configuration)
    {
        const string prefix = "Antc:Backoffice:Sections:";
        var hidden = new List<string>();
        if (!configuration.GetValue<bool>(prefix + "ShowSettings")) hidden.Add("Umb.Section.Settings");
        if (!configuration.GetValue<bool>(prefix + "ShowPackages")) hidden.Add("Umb.Section.Packages");
        if (!configuration.GetValue<bool>(prefix + "ShowTranslation")) hidden.Add("Umb.Section.Translation");
        return hidden;
    }
}
