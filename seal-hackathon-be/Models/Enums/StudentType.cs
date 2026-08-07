using System.Text.Json.Serialization;

namespace SEAL.NET.Models.Enums
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum StudentType
    {
        FPT = 0,
        External = 1
    }
}
