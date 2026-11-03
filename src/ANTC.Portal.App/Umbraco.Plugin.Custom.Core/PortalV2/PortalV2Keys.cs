using System.Security.Cryptography;
using System.Text;

namespace Umbraco.Plugin.Custom.Core.PortalV2;

/// <summary>
/// Khoa GUID v5 co dinh cho nut, loai noi dung, data type cua Portal v2 (contract C7).
/// Cung thuat toan va khong gian ten voi cong-cu/xuat-seed.js, nen moi may ra cung khoa.
/// </summary>
public static class PortalV2Keys
{
    private static readonly byte[] Namespace = Convert.FromHexString("6b1f3c1e5a0e4c4b9a5e2f0c8d7a9e11");

    /// <summary>Tinh GUID v5 (SHA-1) tu ten.</summary>
    public static Guid For(string name)
    {
        byte[] nameBytes = Encoding.UTF8.GetBytes(name);
        byte[] input = new byte[Namespace.Length + nameBytes.Length];
        Namespace.CopyTo(input, 0);
        nameBytes.CopyTo(input, Namespace.Length);
        byte[] hash = SHA1.HashData(input);
        hash[6] = (byte)((hash[6] & 0x0f) | 0x50);
        hash[8] = (byte)((hash[8] & 0x3f) | 0x80);
        return Guid.ParseExact(Convert.ToHexString(hash, 0, 16), "N");
    }

    public static Guid Node(string mockupId) => For("node:" + mockupId);
    public static Guid ContentType(string alias) => For("contenttype:" + alias);
    public static Guid DataType(string name) => For("datatype:" + name);
    public static Guid Property(string contentTypeAlias, string propertyAlias) => For("property:" + contentTypeAlias + "." + propertyAlias);
}
