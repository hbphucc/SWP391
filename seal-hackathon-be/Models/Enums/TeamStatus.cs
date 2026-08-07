using System.Text.Json.Serialization;

namespace SEAL.NET.Models.Enums
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum TeamStatus
    {
        Pending,
        Approved,
        Active,
        Eliminated,
        Withdrawn,
        Champion,
        Rejected
    }
}