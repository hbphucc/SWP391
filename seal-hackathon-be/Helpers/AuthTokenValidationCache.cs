using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Caching.Memory;
using SEAL.NET.Models.Entities;
using System.Collections.Concurrent;

namespace SEAL.NET.Helpers
{
    public sealed class AuthTokenValidationCache
    {
        private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(2);
        private readonly IMemoryCache _cache;
        private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();

        public AuthTokenValidationCache(IMemoryCache cache)
        {
            _cache = cache;
        }

        public async Task<string?> ValidateAsync(
            string userId,
            string tokenStamp,
            UserManager<ApplicationUser> userManager)
        {
            var cacheKey = $"auth-token-valid:{userId}:{tokenStamp}";
            if (_cache.TryGetValue(cacheKey, out bool isValid) && isValid)
                return null;

            var gate = _locks.GetOrAdd(cacheKey, _ => new SemaphoreSlim(1, 1));
            await gate.WaitAsync();

            try
            {
                if (_cache.TryGetValue(cacheKey, out isValid) && isValid)
                    return null;

                var user = await userManager.FindByIdAsync(userId);
                if (user == null)
                    return "User no longer exists.";

                if (!user.IsApproved)
                    return "Account is not approved.";

                var currentStamp = await userManager.GetSecurityStampAsync(user);
                if (!string.Equals(tokenStamp, currentStamp, StringComparison.Ordinal))
                    return "Session has been invalidated.";

                _cache.Set(cacheKey, true, CacheDuration);
                return null;
            }
            finally
            {
                gate.Release();
            }
        }
    }
}
