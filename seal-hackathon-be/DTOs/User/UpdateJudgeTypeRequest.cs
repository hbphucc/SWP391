using SEAL.NET.Models.Enums;

namespace SEAL.NET.DTOs.User
{
    public class UpdateJudgeTypeRequest
    {
        /// <summary>Internal (faculty) or Guest; Unspecified clears the label.</summary>
        public JudgeType JudgeType { get; set; }
    }
}
