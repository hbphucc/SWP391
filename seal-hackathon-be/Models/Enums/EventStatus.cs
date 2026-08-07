using System.Text.Json.Serialization;

namespace SEAL.NET.Models.Enums
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum EventStatus
    {
        Ongoing = 1,
        Completed = 2,
        Cancelled = 3,
        Draft = 4,
        Published = 5
    }
}
