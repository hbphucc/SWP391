namespace SEAL.NET.Services.Common
{
    /// <summary>
    /// Extension allow-list plus a content signature check for uploads.
    ///
    /// The extension alone is a claim by the caller, so for every format with a
    /// stable magic number we also confirm the bytes match. Plain-text formats
    /// (txt, csv, md) have no signature and pass on the extension alone — they
    /// carry no executable payload once the download is served as an attachment.
    /// </summary>
    public static class UploadedFileValidator
    {
        /// Enough bytes for every signature below; TAR needs offset 257..261.
        public const int SignatureProbeBytes = 512;

        private static readonly byte[] Pdf = "%PDF"u8.ToArray();
        private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        private static readonly byte[] Jpeg = [0xFF, 0xD8, 0xFF];
        private static readonly byte[] Gif = "GIF8"u8.ToArray();
        private static readonly byte[] Zip = [0x50, 0x4B, 0x03, 0x04];
        private static readonly byte[] ZipEmpty = [0x50, 0x4B, 0x05, 0x06];
        private static readonly byte[] Rar = [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07];
        private static readonly byte[] SevenZip = [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C];
        private static readonly byte[] Gzip = [0x1F, 0x8B];
        private static readonly byte[] Rtf = @"{\rtf"u8.ToArray();
        /// Legacy Office container (.doc/.xls/.ppt) — OLE2 compound file.
        private static readonly byte[] Ole2 = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1];

        /// Extension -> accepted leading signatures. An empty list means the format
        /// has no dependable magic number and the extension is trusted on its own.
        private static readonly Dictionary<string, byte[][]> Allowed = new(StringComparer.OrdinalIgnoreCase)
        {
            [".pdf"] = [Pdf],
            [".png"] = [Png],
            [".jpg"] = [Jpeg],
            [".jpeg"] = [Jpeg],
            [".gif"] = [Gif],
            [".webp"] = [],           // RIFF header is checked separately
            // OOXML files are ZIP containers; the legacy binaries are OLE2.
            [".docx"] = [Zip, ZipEmpty],
            [".xlsx"] = [Zip, ZipEmpty],
            [".pptx"] = [Zip, ZipEmpty],
            [".zip"] = [Zip, ZipEmpty],
            [".doc"] = [Ole2],
            [".xls"] = [Ole2],
            [".ppt"] = [Ole2],
            [".rar"] = [Rar],
            [".7z"] = [SevenZip],
            [".gz"] = [Gzip],
            [".tar"] = [],            // "ustar" at offset 257 is checked separately
            [".rtf"] = [Rtf],
            [".txt"] = [],
            [".csv"] = [],
            [".md"] = [],
        };

        /// Their marker sits past offset 0, so they are verified by MatchesSpecialCase
        /// rather than by a leading-bytes comparison.
        private static readonly HashSet<string> SpecialCased =
            new(StringComparer.OrdinalIgnoreCase) { ".webp", ".tar" };

        public static IEnumerable<string> AllowedExtensions => Allowed.Keys;

        /// <returns>null when the file is acceptable, otherwise the reason to report.</returns>
        public static string? Validate(string fileName, ReadOnlySpan<byte> head)
        {
            var extension = Path.GetExtension(fileName);

            if (string.IsNullOrWhiteSpace(extension))
                return "File must have an extension.";

            if (!Allowed.TryGetValue(extension, out var signatures))
                return $"Files of type {extension.ToLowerInvariant()} are not accepted. Allowed: {string.Join(", ", Allowed.Keys.Order())}.";

            // Formats whose marker is not at offset 0 still have to prove it —
            // they must not fall through to the signature-less branch below.
            if (SpecialCased.Contains(extension))
            {
                return MatchesSpecialCase(extension, head)
                    ? null
                    : $"File contents do not match its {extension.ToLowerInvariant()} extension.";
            }

            // Genuinely signature-less (txt/csv/md): the extension is all we have.
            if (signatures.Length == 0) return null;

            foreach (var signature in signatures)
            {
                if (head.Length >= signature.Length && head[..signature.Length].SequenceEqual(signature))
                    return null;
            }

            return $"File contents do not match its {extension.ToLowerInvariant()} extension.";
        }

        /// Formats whose marker is not at offset 0.
        private static bool MatchesSpecialCase(string extension, ReadOnlySpan<byte> head)
        {
            if (extension.Equals(".webp", StringComparison.OrdinalIgnoreCase))
            {
                // "RIFF" ---- "WEBP"
                return head.Length >= 12
                    && head[..4].SequenceEqual("RIFF"u8)
                    && head.Slice(8, 4).SequenceEqual("WEBP"u8);
            }

            if (extension.Equals(".tar", StringComparison.OrdinalIgnoreCase))
            {
                return head.Length >= 262 && head.Slice(257, 5).SequenceEqual("ustar"u8);
            }

            return false;
        }
    }
}
