namespace SEAL.NET.Services.Common
{
    public static class RateLimitPolicies
    {
        /// <summary>
        /// Guards the endpoints reachable without signing in. Shared so the policy
        /// registration and the attributes that reference it cannot drift apart.
        /// </summary>
        public const string Auth = "auth";
    }
}
