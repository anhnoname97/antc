using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Umbraco.Plugin.Custom.Core.Data;

/// <summary>One-time content release. Existing contest snapshots are deliberately never changed.</summary>
public static class QuizBankRelease20261110
{
    public const string Release = "seed:quiz-20261110";

    public static async Task ApplyAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        if (await db.QuizImports.AnyAsync(x => x.FileName == Release, ct)) return;
        using var baseline = Read("quiz-bank-before-20261110.json");
        using var general = Read("quiz-bank.json");
        using var business = Read("quiz-business.json");
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var topics = await db.QuizTopics.ToListAsync(ct);
        var questions = await db.QuizQuestions.ToDictionaryAsync(x => x.Code, ct);
        int nextId = topics.Select(x => x.Id).DefaultIfEmpty().Max() + 1;
        int added = 0, updated = 0, preserved = 0;
        var now = DateTime.UtcNow;
        foreach (var entry in general.RootElement.EnumerateObject().Concat(business.RootElement.EnumerateObject()))
        {
            bool enterprise = entry.Name.StartsWith("dn", StringComparison.Ordinal);
            var topic = enterprise ? topics.SingleOrDefault(x => x.PublicCode == entry.Name)
                : topics.SingleOrDefault(x => x.Id == int.Parse(entry.Name));
            if (topic is null)
            {
                topic = new QuizTopic { Id = enterprise ? nextId++ : int.Parse(entry.Name),
                    PublicCode = enterprise ? entry.Name : null, Type = enterprise ? QuizAudience.Organization : QuizAudience.Personal, UpdatedAt = now };
                topics.Add(topic); db.QuizTopics.Add(topic);
                SetTopic(topic, entry.Value);
            }
            else if (!enterprise && baseline.RootElement.TryGetProperty(entry.Name, out var oldTopic))
            {
                if (topic.Title == Text(oldTopic, "t") && SameJson(topic.Intro, oldTopic.GetProperty("intro")) &&
                    SameJson(topic.Terms ?? "[]", oldTopic.GetProperty("terms")))
                { SetTopic(topic, entry.Value); topic.Revision++; topic.UpdatedAt = now; }
            }
            nextId = Math.Max(nextId, topic.Id + 1);
            var oldQuestions = !enterprise && baseline.RootElement.TryGetProperty(entry.Name, out var old)
                ? old.GetProperty("q").EnumerateArray().ToDictionary(x => Text(x, "code")) : new Dictionary<string, JsonElement>();
            int order = 0;
            foreach (var item in entry.Value.GetProperty("q").EnumerateArray())
            {
                order++;
                string code = Text(item, "code");
                if (questions.TryGetValue(code, out var question))
                {
                    if (enterprise && question.TopicId != topic.Id)
                        throw new InvalidOperationException($"Business question code {code} already belongs to another topic.");
                    if (question.TopicId == topic.Id && Matches(question, item)) continue;
                    if (!oldQuestions.TryGetValue(code, out var prior) || question.TopicId != topic.Id || !Matches(question, prior))
                    { preserved++; continue; }
                    question.Revision++; updated++;
                }
                else
                {
                    question = new QuizQuestion { Code = code, TopicId = topic.Id, SortOrder = order };
                    db.QuizQuestions.Add(question); questions.Add(code, question); added++;
                }
                question.Kind = Text(item, "kind"); question.Situation = Text(item, "sit");
                question.Question = Text(item, "q"); question.Options = item.GetProperty("opt").GetRawText();
                question.Answer = Text(item, "ans"); question.Explanations = item.GetProperty("exp").GetRawText();
                question.SafeAction = Text(item, "safe"); question.ReadSeconds = item.GetProperty("sec").GetInt32();
                question.UpdatedAt = now;
            }
        }
        db.QuizImports.Add(new QuizImport { FileName = Release, CreatedBy = "system", CreatedAt = now, Added = added, Updated = updated });
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        logger.LogInformation("Quiz release 20261110: {Added} added, {Updated} updated, {Preserved} edited questions preserved", added, updated, preserved);
    }

    private static void SetTopic(QuizTopic topic, JsonElement item)
    { topic.Title = Text(item, "t"); topic.Intro = item.GetProperty("intro").GetRawText(); topic.Terms = item.GetProperty("terms").GetRawText(); }

    private static bool Matches(QuizQuestion q, JsonElement old) => q.Kind == Text(old, "kind") &&
        (q.Situation ?? "") == Text(old, "sit") && q.Question == Text(old, "q") && q.Answer == Text(old, "ans") &&
        (q.SafeAction ?? "") == Text(old, "safe") && q.ReadSeconds == old.GetProperty("sec").GetInt32() &&
        SameJson(q.Options, old.GetProperty("opt")) && SameJson(q.Explanations, old.GetProperty("exp"));

    private static string Text(JsonElement item, string key) => item.GetProperty(key).GetString() ?? "";
    private static bool SameJson(string value, JsonElement other)
    { using var parsed = JsonDocument.Parse(value); return JsonElement.DeepEquals(parsed.RootElement, other); }
    private static JsonDocument Read(string name)
    {
        var assembly = typeof(QuizBankRelease20261110).Assembly;
        using var stream = assembly.GetManifestResourceStream(assembly.GetManifestResourceNames().Single(x => x.EndsWith("." + name, StringComparison.Ordinal)))!;
        return JsonDocument.Parse(stream);
    }
}
