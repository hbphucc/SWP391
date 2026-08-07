using System.Text.Json.Serialization;

namespace SEAL.NET.Models.Enums
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum InvitationStatus
    {
        Pending = 0,
        Accepted = 1,
        Rejected = 2,
        Cancelled = 3
    }
}
