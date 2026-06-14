using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Models.Entities;

namespace SEAL.NET.Data
{
    public static class DbSeeder
    {
        public static async Task SeedRolesAndAdminAsync(IServiceProvider serviceProvider)
        {
            var db = serviceProvider.GetRequiredService<ApplicationDbContext>();
            await db.Database.OpenConnectionAsync();
            using (var command = db.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = @"
                    CREATE TABLE IF NOT EXISTS ""KickRequests"" (
                        ""KickRequestId"" uuid NOT NULL CONSTRAINT ""PK_KickRequests"" PRIMARY KEY,
                        ""TeamId"" uuid NOT NULL,
                        ""UserId"" uuid NOT NULL,
                        ""Reason"" text NOT NULL,
                        ""Status"" varchar(50) NOT NULL,
                        ""RequestedAt"" timestamp without time zone NOT NULL,
                        CONSTRAINT ""FK_KickRequests_Teams_TeamId"" FOREIGN KEY (""TeamId"") REFERENCES ""Teams"" (""TeamId"") ON DELETE CASCADE,
                        CONSTRAINT ""FK_KickRequests_Users_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE
                    );
                    ALTER TABLE ""JudgeAssignments"" ADD COLUMN IF NOT EXISTS ""TeamId"" uuid NULL CONSTRAINT ""FK_JudgeAssignments_Teams_TeamId"" REFERENCES ""Teams"" (""TeamId"") ON DELETE CASCADE;
                ";
                await command.ExecuteNonQueryAsync();
            }

            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var configuration = serviceProvider.GetRequiredService<IConfiguration>();

            string[] roles =
            {
                "Admin",
                "Member",
                "TeamLeader",
                "Judge",
                "Mentor"
            };

            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole<Guid>(role));
                }
            }

            if (!configuration.GetValue<bool>("AdminBootstrap:Enabled"))
                return;

            var adminEmail = configuration["AdminBootstrap:Email"];
            var adminPassword = configuration["AdminBootstrap:Password"];

            if (string.IsNullOrWhiteSpace(adminEmail) || string.IsNullOrWhiteSpace(adminPassword))
                throw new InvalidOperationException("Admin bootstrap is enabled but email or password is missing.");

            var admin = await userManager.FindByEmailAsync(adminEmail);

            if (admin == null)
            {
                admin = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    FullName = "System Admin",
                    PlainPassword = adminPassword,
                    EmailConfirmed = true,
                    IsApproved = true
                };

                var result = await userManager.CreateAsync(admin, adminPassword);

                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(admin, "Admin");
                }
                else
                {
                    foreach (var error in result.Errors)
                    {
                        Console.WriteLine($"Seed admin error: {error.Description}");
                    }
                }
            }
        }
    }
}
