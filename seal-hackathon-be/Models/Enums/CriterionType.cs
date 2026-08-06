namespace SEAL.NET.Models.Enums
{
    /// <summary>
    /// Groups a scoring criterion for inter-rater analysis (RQ2: which criteria
    /// show the highest and lowest agreement, technical versus subjective).
    ///
    /// Unspecified is the default so criteria created before this existed are not
    /// silently mislabelled — an unlabelled criterion is excluded from the
    /// comparison rather than counted in the wrong group.
    /// </summary>
    public enum CriterionType
    {
        Unspecified = 0,

        /// <summary>Objectively checkable: code quality, test coverage, architecture.</summary>
        Technical = 1,

        /// <summary>Judgement-based: presentation, creativity, business potential.</summary>
        Soft = 2
    }
}
