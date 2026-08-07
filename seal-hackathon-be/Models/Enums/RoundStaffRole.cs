using System.Text.Json.Serialization;

namespace SEAL.NET.Models.Enums
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum RoundStaffRole
    {
        Mentor,
        Judge
    }
}
