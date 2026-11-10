namespace Umbraco.Web.UI.Models;

public sealed record SelfCheckCard(string Title, string? Description, string Icon, string? Url, bool Urgent = false, string? Image = null);
