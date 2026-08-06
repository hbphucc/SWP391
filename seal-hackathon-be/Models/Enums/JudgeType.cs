namespace SEAL.NET.Models.Enums
{
    /// <summary>
    /// Distinguishes faculty judges from invited outside judges (RQ3: does judge
    /// type affect scoring consistency).
    ///
    /// This used to be inferred from an @fpt.edu.vn email address, which put FPT
    /// students in the faculty bucket and any guest given a university mailbox in
    /// it too. Recording the answer at account creation removes the guesswork;
    /// Unspecified marks the accounts that predate the field so they are reported
    /// as unknown instead of being counted in the wrong group.
    /// </summary>
    public enum JudgeType
    {
        Unspecified = 0,

        /// <summary>SE Faculty / PDP staff judging as part of the department.</summary>
        Internal = 1,

        /// <summary>Invited judge on a temporary account created by the organisers.</summary>
        Guest = 2
    }
}
