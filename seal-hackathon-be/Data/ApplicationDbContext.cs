using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using SEAL.NET.Models.Entities;
using SEAL.NET.Models.Enums;

namespace SEAL.NET.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>,
        IDataProtectionKeyContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Event> Events { get; set; }
        public DbSet<Track> Tracks { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Round> Rounds { get; set; }
        public DbSet<Team> Teams { get; set; }
        public DbSet<TeamMember> TeamMembers { get; set; }
        public DbSet<Criteria> Criteria { get; set; }
        public DbSet<Submission> Submissions { get; set; }
        public DbSet<JudgeAssignment> JudgeAssignments { get; set; }
        public DbSet<Score> Scores { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<TeamInvitation> TeamInvitations { get; set; }
        public DbSet<MentorAssignment> MentorAssignments { get; set; }
        public DbSet<Prize> Prizes { get; set; }
        public DbSet<Document> Documents { get; set; }
        public DbSet<KickRequest> KickRequests { get; set; }
        public DbSet<TeamChatMessage> TeamChatMessages { get; set; }
        public DbSet<CriteriaTemplate> CriteriaTemplates { get; set; }
        public DbSet<RoundStaffAssignment> RoundStaffAssignments { get; set; }

        // The keys that sign password-reset and email-confirmation tokens. They used
        // to be written to the container filesystem, which is discarded whenever the
        // service restarts — and a free instance sleeps after fifteen idle minutes.
        // Every restart invalidated every reset link already sitting in someone's
        // inbox. Keeping them in the database outlives the container.
        public DbSet<DataProtectionKey> DataProtectionKeys { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            var dateTimeConverter = new ValueConverter<DateTime, DateTime>(
                value => DateTime.SpecifyKind(value, DateTimeKind.Unspecified),
                value => DateTime.SpecifyKind(value, DateTimeKind.Utc));

            var nullableDateTimeConverter = new ValueConverter<DateTime?, DateTime?>(
                value => value.HasValue ? DateTime.SpecifyKind(value.Value, DateTimeKind.Unspecified) : value,
                value => value.HasValue ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc) : value);

            foreach (var entityType in builder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties())
                {
                    if (property.ClrType == typeof(DateTime))
                    {
                        property.SetColumnType("timestamp without time zone");
                        property.SetValueConverter(dateTimeConverter);
                    }
                    else if (property.ClrType == typeof(DateTime?))
                    {
                        property.SetColumnType("timestamp without time zone");
                        property.SetValueConverter(nullableDateTimeConverter);
                    }
                }
            }

            builder.Entity<ApplicationUser>().ToTable("Users");
            builder.Entity<ApplicationUser>()
                .HasIndex(u => u.StudentCode)
                .IsUnique()
                .HasFilter("\"StudentCode\" IS NOT NULL");

            builder.Entity<ApplicationUser>()
                .Property(u => u.StudentType)
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Entity<ApplicationUser>()
                .Property(u => u.DeveloperRole)
                .HasConversion<string>()
                .HasMaxLength(20);

            // Stored as text like the other profile enums, so the value stays
            // readable when the scoring dataset is exported for analysis.
            builder.Entity<ApplicationUser>()
                .Property(u => u.JudgeType)
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Entity<Criteria>()
                .Property(c => c.CriterionType)
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Entity<CriteriaTemplate>()
                .Property(c => c.CriterionType)
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Entity<ApplicationUser>()
                .Property(u => u.EmailNotificationsEnabled)
                .HasDefaultValue(true);

            builder.Entity<IdentityRole<Guid>>().ToTable("Roles");
            builder.Entity<IdentityUserRole<Guid>>().ToTable("UserRoles");
            builder.Entity<IdentityUserClaim<Guid>>().ToTable("UserClaims");
            builder.Entity<IdentityUserLogin<Guid>>().ToTable("UserLogins");
            builder.Entity<IdentityRoleClaim<Guid>>().ToTable("RoleClaims");
            builder.Entity<IdentityUserToken<Guid>>().ToTable("UserTokens");

            builder.Entity<Event>()
                .Property(e => e.Status)
                .HasConversion<int>();

            builder.Entity<Event>()
                .HasMany(e => e.RegisteredMentors)
                .WithMany()
                .UsingEntity(j => j.ToTable("EventMentors"));

            builder.Entity<Event>()
                .HasMany(e => e.RegisteredJudges)
                .WithMany()
                .UsingEntity(j => j.ToTable("EventJudges"));

            builder.Entity<Round>()
                .HasOne(r => r.PromptDocument)
                .WithMany()
                .HasForeignKey(r => r.PromptDocumentId)
                .OnDelete(DeleteBehavior.SetNull);

            // Global track catalog: unique name, and an optional back-link from
            // Category. Deleting a track nulls the link rather than cascading, so
            // already-materialized event categories survive.
            builder.Entity<Track>()
                .HasIndex(t => t.Name)
                .IsUnique();

            builder.Entity<Category>()
                .HasOne(c => c.Track)
                .WithMany(t => t.Categories)
                .HasForeignKey(c => c.TrackId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.Entity<Team>()
                .Property(t => t.Status)
                .HasConversion<int>();

            builder.Entity<Team>()
                .HasIndex(t => new { t.CategoryId, t.TeamName })
                .IsUnique();

            builder.Entity<Team>()
                .HasOne(t => t.Leader)
                .WithMany(u => u.LedTeams)
                .HasForeignKey(t => t.LeaderId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Team>()
                .HasOne(t => t.CurrentRound)
                .WithMany()
                .HasForeignKey(t => t.CurrentRoundId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<TeamMember>()
                .HasOne(tm => tm.User)
                .WithMany(u => u.TeamMemberships)
                .HasForeignKey(tm => tm.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Score>()
                .HasOne(s => s.Criteria)
                .WithMany(c => c.Scores)
                .HasForeignKey(s => s.CriteriaId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Score>()
                .HasOne(s => s.Submission)
                .WithMany(sub => sub.Scores)
                .HasForeignKey(s => s.SubmissionId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Score>()
                .HasOne(s => s.Judge)
                .WithMany(u => u.ScoresGiven)
                .HasForeignKey(s => s.JudgeId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<JudgeAssignment>()
                .HasOne(ja => ja.Judge)
                .WithMany(u => u.JudgeAssignments)
                .HasForeignKey(ja => ja.JudgeId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<JudgeAssignment>()
                .HasOne(j => j.Round)
                .WithMany(r => r.JudgeAssignments)
                .HasForeignKey(j => j.RoundId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<JudgeAssignment>()
                .HasOne(j => j.Category)
                .WithMany(c => c.JudgeAssignments)
                .HasForeignKey(j => j.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Submission>()
                .HasOne(s => s.Round)
                .WithMany(r => r.Submissions)
                .HasForeignKey(s => s.RoundId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Score>()
                .HasIndex(s => new { s.SubmissionId, s.JudgeId, s.CriteriaId })
                .IsUnique();

            builder.Entity<TeamMember>()
                .HasIndex(tm => new { tm.TeamId, tm.UserId })
                .IsUnique();

            builder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<AuditLog>()
                .HasOne(a => a.ActorUser)
                .WithMany()
                .HasForeignKey(a => a.ActorUserId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.Entity<TeamInvitation>()
                .Property(ti => ti.Status)
                .HasConversion<int>();

            builder.Entity<TeamInvitation>()
                .HasIndex(ti => new { ti.TeamId, ti.InviteeUserId })
                .IsUnique()
                .HasFilter("\"Status\" = 0");

            builder.Entity<TeamInvitation>()
                .HasOne(ti => ti.Team)
                .WithMany()
                .HasForeignKey(ti => ti.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<TeamInvitation>()
                .HasOne(ti => ti.InviterUser)
                .WithMany()
                .HasForeignKey(ti => ti.InviterUserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<TeamInvitation>()
                .HasOne(ti => ti.InviteeUser)
                .WithMany()
                .HasForeignKey(ti => ti.InviteeUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Mentoring is scoped to a round, so the same mentor may take the same
            // team again in a later round. Postgres treats NULLs as distinct, which
            // means this index does not stop a mentor being added to the same round
            // twice before any team is picked — MentorAdminService checks for that.
            builder.Entity<MentorAssignment>()
                .HasIndex(ma => new { ma.RoundId, ma.TeamId })
                .IsUnique()
                .HasFilter("\"IsActive\" = TRUE AND \"TeamId\" IS NOT NULL");

            builder.Entity<MentorAssignment>()
                .HasOne(ma => ma.Mentor)
                .WithMany()
                .HasForeignKey(ma => ma.MentorUserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<MentorAssignment>()
                .HasOne(ma => ma.AssignedBy)
                .WithMany()
                .HasForeignKey(ma => ma.AssignedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<MentorAssignment>()
                .HasOne(ma => ma.Team)
                .WithMany()
                .HasForeignKey(ma => ma.TeamId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<MentorAssignment>()
                .HasOne(ma => ma.Round)
                .WithMany()
                .HasForeignKey(ma => ma.RoundId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<RoundStaffAssignment>()
                .HasIndex(a => new { a.UserId, a.RoundId, a.Role })
                .IsUnique()
                .HasFilter("\"IsActive\" = TRUE");

            builder.Entity<RoundStaffAssignment>()
                .HasOne(a => a.Round)
                .WithMany()
                .HasForeignKey(a => a.RoundId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<RoundStaffAssignment>()
                .HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<RoundStaffAssignment>()
                .HasOne(a => a.AssignedBy)
                .WithMany()
                .HasForeignKey(a => a.AssignedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Prize>()
                .HasOne(p => p.Event)
                .WithMany()
                .HasForeignKey(p => p.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Document>()
                .HasOne(d => d.Uploader)
                .WithMany()
                .HasForeignKey(d => d.UploaderId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.Entity<KickRequest>()
                .HasOne(kr => kr.Team)
                .WithMany()
                .HasForeignKey(kr => kr.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<KickRequest>()
                .HasOne(kr => kr.User)
                .WithMany()
                .HasForeignKey(kr => kr.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<JudgeAssignment>()
                .HasOne(ja => ja.Team)
                .WithMany()
                .HasForeignKey(ja => ja.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<TeamChatMessage>()
                .HasOne(tc => tc.Team)
                .WithMany()
                .HasForeignKey(tc => tc.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<TeamChatMessage>()
                .HasOne(tc => tc.Sender)
                .WithMany()
                .HasForeignKey(tc => tc.SenderId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<TeamChatMessage>()
                .HasOne(tc => tc.AttachedDocument)
                .WithMany()
                .HasForeignKey(tc => tc.DocumentId)
                .OnDelete(DeleteBehavior.SetNull);

            // Equality column first, then the range/sort column — the shape
            // TeamChatService.GetMessagesAsync asks for:
            //   WHERE TeamId = ? AND SentAt < ?  ORDER BY SentAt DESC  LIMIT 50
            // The foreign-key index on TeamId alone makes Postgres read the whole
            // thread and sort it to return one page. The chat panel polls every four
            // seconds, so that sort was running constantly for every open thread.
            builder.Entity<TeamChatMessage>()
                .HasIndex(tc => new { tc.TeamId, tc.SentAt });

            // Same shape: the notification bell reads one user's newest first.
            builder.Entity<Notification>()
                .HasIndex(n => new { n.UserId, n.CreatedAt });

            // Audit logs are only ever read newest-first, and the table only grows.
            builder.Entity<AuditLog>()
                .HasIndex(a => a.CreatedAt);
        }
    }
}
