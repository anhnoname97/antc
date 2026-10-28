using System.Security.Cryptography;

namespace Umbraco.Plugin.Custom.Core.Contest;

public static class CryptographicLottery
{
    // Partial Fisher-Yates: unbiased sampling without replacement, including when every person wins.
    public static IReadOnlyList<T> Select<T>(IReadOnlyList<T> candidates, int count)
    {
        if (count < 0 || count > candidates.Count) throw new ArgumentOutOfRangeException(nameof(count));
        T[] pool = candidates.ToArray();
        for (int i = 0; i < count; i++)
        {
            int j = RandomNumberGenerator.GetInt32(i, pool.Length);
            (pool[i], pool[j]) = (pool[j], pool[i]);
        }
        return pool.Take(count).ToArray();
    }
}
