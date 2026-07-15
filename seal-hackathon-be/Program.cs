using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Npgsql;
using SEAL.NET.Data;
using SEAL.NET.Helpers;
using SEAL.NET.Models.Entities;
using SEAL.NET.Repositories.Implementations;
using SEAL.NET.Repositories.Interfaces;
using SEAL.NET.Services.Implementations;
using SEAL.NET.Services.Interfaces;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? builder.Configuration["DATABASE_URL"]
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' or 'DATABASE_URL' not found.");

connectionString = BuildNpgsqlConnectionString(connectionString, builder.Configuration);

var jwtKey = builder.Configuration["Jwt:Key"];
if (builder.Environment.IsProduction() &&
    (string.IsNullOrWhiteSpace(jwtKey) ||
     jwtKey.Length < 32 ||
     jwtKey.Contains("CHANGE_ME", StringComparison.OrdinalIgnoreCase)))
{
    throw new InvalidOperationException(
        "Jwt:Key is missing, shorter than 32 characters, or still set to the default placeholder. " +
        "Configure a secure Jwt:Key via user secrets or environment variables before running in Production.");
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.CommandTimeout(20);
    }));


builder.Services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
{
    options.Lockout.AllowedForNewUsers = true;
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
})
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();


builder.Services.AddScoped<ITeamRepository, TeamRepository>();
builder.Services.AddScoped<IScoreRepository, ScoreRepository>();
builder.Services.AddScoped<IEventRepository, EventRepository>();


builder.Services.AddScoped<IEventService, EventService>();
builder.Services.AddScoped<ITeamService, TeamService>();
builder.Services.AddScoped<IScoreService, ScoreService>();
builder.Services.AddScoped<IRankingService, RankingService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ITrackService, TrackService>();
builder.Services.AddScoped<ICriteriaService, CriteriaService>();
builder.Services.AddScoped<IRoundService, RoundService>();
builder.Services.AddScoped<IPrizeService, PrizeService>();
builder.Services.AddScoped<IJudgeAssignmentService, JudgeAssignmentService>();
builder.Services.AddScoped<IJudgeDashboardService, JudgeDashboardService>();
builder.Services.AddScoped<INotificationInboxService, NotificationInboxService>();
builder.Services.AddScoped<IAuditLogQueryService, AuditLogQueryService>();
builder.Services.AddScoped<IMentorService, MentorService>();
builder.Services.AddScoped<IMentorAdminService, MentorAdminService>();
builder.Services.AddScoped<IDocumentService, DocumentService>();
builder.Services.AddScoped<ISubmissionService, SubmissionService>();
builder.Services.AddScoped<IMatchmakingService, MatchmakingService>();
builder.Services.AddScoped<IAdminUserService, AdminUserService>();
builder.Services.AddScoped<IAdminTeamService, AdminTeamService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<AuthTokenValidationCache>();


builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (string.IsNullOrWhiteSpace(context.Token) &&
                context.Request.Cookies.TryGetValue("seal_token", out var token))
            {
                context.Token = token;
            }

            return Task.CompletedTask;
        },

        OnTokenValidated = async context =>
        {
            var userManager = context.HttpContext.RequestServices
                .GetRequiredService<UserManager<ApplicationUser>>();
            var authTokenCache = context.HttpContext.RequestServices
                .GetRequiredService<AuthTokenValidationCache>();

            var principal = context.Principal;
            var userId = principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId) || !Guid.TryParse(userId, out _))
            {
                context.Fail("Invalid authentication token.");
                return;
            }

            var stampClaimType = userManager.Options.ClaimsIdentity.SecurityStampClaimType;
            var tokenStamp = principal?.FindFirstValue(stampClaimType);
            if (string.IsNullOrWhiteSpace(tokenStamp))
            {
                context.Fail("Session token is missing required security information.");
                return;
            }

            var validationError = await authTokenCache.ValidateAsync(userId, tokenStamp, userManager);
            if (validationError != null)
            {
                context.Fail(validationError);
                return;
            }
        }
    };
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)
        )
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                ?? new[] { "http://localhost:3000", "http://localhost:3001", "http://localhost:5173" }
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("CookieAuth", new OpenApiSecurityScheme
    {
        Name = "seal_token",
        Type = SecuritySchemeType.ApiKey,
        In = ParameterLocation.Cookie,
        Description = "Authentication uses the HttpOnly seal_token cookie set by POST /api/auth/login. Browser clients do not read or store the token."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "CookieAuth"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        var traceId = System.Diagnostics.Activity.Current?.Id ?? context.TraceIdentifier;

        var logger = context.RequestServices.GetRequiredService<ILoggerFactory>()
            .CreateLogger("UnhandledException");
        logger.LogError(ex, "Unhandled exception while processing {Method} {Path} (traceId: {TraceId})",
            context.Request.Method, context.Request.Path, traceId);

        if (context.Response.HasStarted)
            throw;

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;

        var env = context.RequestServices.GetRequiredService<IWebHostEnvironment>();
        var response = new
        {
            message = env.IsDevelopment() ? ex.ToString() : "An unexpected error occurred. Please contact support.",
            traceId = traceId
        };

        await context.Response.WriteAsJsonAsync(response);
    }
});

using (var scope = app.Services.CreateScope())
{
    await SeedDatabaseOnStartupAsync(app, scope.ServiceProvider);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseForwardedHeaders();
app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseMiddleware<SEAL.NET.Middleware.CsrfOriginValidationMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", async (ApplicationDbContext dbContext, ILoggerFactory loggerFactory) =>
{
    var logger = loggerFactory.CreateLogger("HealthCheck");
    try
    {
        var canConnect = await dbContext.Database.CanConnectAsync();
        return canConnect
            ? Results.Ok(new { status = "Healthy", database = "Healthy" })
            : Results.Json(new { status = "Unhealthy", database = "Unhealthy" },
                statusCode: StatusCodes.Status503ServiceUnavailable);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Health check failed.");
        return Results.Json(new { status = "Unhealthy", database = "Unhealthy" },
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }
}).AllowAnonymous();

app.MapControllers();

app.Run();

static string BuildNpgsqlConnectionString(string connectionString, IConfiguration configuration)
{
    var builder = new NpgsqlConnectionStringBuilder(connectionString)
    {
        Pooling = true,
        MinPoolSize = 0,
        MaxPoolSize = configuration.GetValue<int?>("Database:MaxPoolSize") ?? 5,
        Timeout = configuration.GetValue<int?>("Database:TimeoutSeconds") ?? 15,
        CommandTimeout = configuration.GetValue<int?>("Database:CommandTimeoutSeconds") ?? 20,
        ConnectionIdleLifetime = configuration.GetValue<int?>("Database:ConnectionIdleLifetimeSeconds") ?? 10,
        ConnectionPruningInterval = configuration.GetValue<int?>("Database:ConnectionPruningIntervalSeconds") ?? 5
    };

    return builder.ConnectionString;
}

static async Task SeedDatabaseOnStartupAsync(WebApplication app, IServiceProvider serviceProvider)
{
    var logger = serviceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseSeeder");
    var delays = new[] { TimeSpan.FromSeconds(2), TimeSpan.FromSeconds(5), TimeSpan.FromSeconds(10) };

    for (var attempt = 0; attempt <= delays.Length; attempt++)
    {
        try
        {
            await DbSeeder.SeedRolesAndAdminAsync(serviceProvider);
            return;
        }
        catch (PostgresException ex) when (IsSupabasePoolLimit(ex) && attempt < delays.Length)
        {
            logger.LogWarning(
                ex,
                "Supabase connection pool is full while seeding database. Retrying in {DelaySeconds}s.",
                delays[attempt].TotalSeconds);
            await Task.Delay(delays[attempt]);
        }
        catch (PostgresException ex) when (IsSupabasePoolLimit(ex) && app.Environment.IsDevelopment())
        {
            logger.LogWarning(
                ex,
                "Supabase connection pool stayed full after retries. Skipping startup seed in Development.");
            return;
        }
    }
}

static bool IsSupabasePoolLimit(PostgresException ex)
{
    return ex.MessageText.Contains("MAXCONNSESSION", StringComparison.OrdinalIgnoreCase)
        || ex.MessageText.Contains("max clients", StringComparison.OrdinalIgnoreCase);
}
