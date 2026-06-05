using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SEAL.NET.DTOs.Auth;
using SEAL.NET.Models.Entities;
using SEAL.NET.Models.Enums;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;

namespace SEAL.NET.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private const string AuthCookieName = "seal_token";
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;
        private readonly IConfiguration _configuration;

        public AuthController(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole<Guid>> roleManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest model)
        {
            var userExists = await _userManager.FindByEmailAsync(model.Email);
            if (userExists != null)
                return BadRequest(new { message = "Email is already used." });

            if (!string.IsNullOrWhiteSpace(model.StudentCode))
            {
                var studentCode = model.StudentCode.Trim();
                var duplicateStudentCode = await _userManager.Users.AnyAsync(u =>
                    u.StudentCode != null &&
                    u.StudentCode.ToLower() == studentCode.ToLower());

                if (duplicateStudentCode)
                    return BadRequest(new { message = "Student code is already used." });
            }

            if (model.StudentType == StudentType.External &&
            string.IsNullOrWhiteSpace(model.SchoolName))
            {
                return BadRequest(new
                {
                    message = "School name is required for external students."
                });
            }

            var user = new ApplicationUser
            {
                UserName = model.Email,
                Email = model.Email,
                FullName = model.FullName,
                StudentType = model.StudentType,
                StudentCode = string.IsNullOrWhiteSpace(model.StudentCode) ? null : model.StudentCode.Trim(),
                SchoolName = model.SchoolName,
                IsApproved = true
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            if (!await _roleManager.RoleExistsAsync("Member"))
                await _roleManager.CreateAsync(new IdentityRole<Guid>("Member"));

            await _userManager.AddToRoleAsync(user, "Member");

            return Ok(new { message = "Created account successfully. You can sign in now." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null)
                return Unauthorized(new { message = "Email or password is incorrect." });

            if (await _userManager.IsLockedOutAsync(user))
                return Unauthorized(new { message = "Your account is temporarily locked due to too many failed attempts. Please try again later." });

            if (!await _userManager.CheckPasswordAsync(user, model.Password))
            {
                await _userManager.AccessFailedAsync(user);
                return Unauthorized(new { message = "Email or password is incorrect." });
            }

            await _userManager.ResetAccessFailedCountAsync(user);

            if (!user.IsApproved)
                return Unauthorized(new { message = "Your account is disabled or not allowed to access." });

            var userRoles = await _userManager.GetRolesAsync(user);

            var authClaims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Email, user.Email!),
                    new Claim("FullName", user.FullName),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
                };

            foreach (var role in userRoles)
            {
                authClaims.Add(new Claim(ClaimTypes.Role, role));
            }

            var token = GenerateNewJsonWebToken(authClaims);
            var tokenValue = new JwtSecurityTokenHandler().WriteToken(token);

            Response.Cookies.Append(AuthCookieName, tokenValue, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = GetCookieSameSite(),
                Expires = token.ValidTo
            });

            return Ok(new
            {
                expiration = token.ValidTo,
                user = new
                {
                    id = user.Id,
                    fullName = user.FullName,
                    email = user.Email,
                    roles = userRoles
                }
            });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete(AuthCookieName, new CookieOptions
            {
                Secure = true,
                SameSite = GetCookieSameSite()
            });

            return Ok(new { message = "Logged out successfully." });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "Invalid authentication token." });

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Unauthorized(new { message = "User not found." });

            if (!user.IsApproved)
                return Unauthorized(new { message = "Your account is disabled or not allowed to access." });

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new
            {
                id = user.Id,
                fullName = user.FullName,
                email = user.Email,
                phoneNumber = user.PhoneNumber,
                studentCode = user.StudentCode,
                schoolName = user.SchoolName,
                studentType = user.StudentType == null ? null : user.StudentType.ToString(),
                roles
            });
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "Invalid authentication token." });

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Unauthorized(new { message = "User not found." });

            if (!string.IsNullOrWhiteSpace(request.StudentCode) &&
                !string.Equals(user.StudentCode, request.StudentCode, StringComparison.OrdinalIgnoreCase))
            {
                var duplicateStudentCode = _userManager.Users.Any(u =>
                    u.Id != user.Id &&
                    u.StudentCode != null &&
                    u.StudentCode.ToLower() == request.StudentCode.ToLower());

                if (duplicateStudentCode)
                    return BadRequest(new { message = "Student code is already used." });
            }

            user.FullName = request.FullName.Trim();
            user.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim();
            user.StudentCode = string.IsNullOrWhiteSpace(request.StudentCode) ? user.StudentCode : request.StudentCode.Trim();

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new
            {
                id = user.Id,
                fullName = user.FullName,
                email = user.Email,
                phoneNumber = user.PhoneNumber,
                studentCode = user.StudentCode,
                schoolName = user.SchoolName,
                studentType = user.StudentType == null ? null : user.StudentType.ToString(),
                roles
            });
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "Invalid authentication token." });

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Unauthorized(new { message = "User not found." });

            var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return Ok(new { message = "Password changed successfully." });
        }

        private JwtSecurityToken GenerateNewJsonWebToken(List<Claim> authClaims)
        {
            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                expires: DateTime.Now.AddDays(Convert.ToDouble(_configuration["Jwt:ExpireDays"])),
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );

            return token;
        }

        private SameSiteMode GetCookieSameSite()
        {
            var configured = _configuration["Auth:CookieSameSite"];
            return Enum.TryParse<SameSiteMode>(configured, ignoreCase: true, out var sameSite)
                ? sameSite
                : SameSiteMode.Lax;
        }
    }
}
