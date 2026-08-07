using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEAL.NET.Migrations
{
    /// <inheritdoc />
    public partial class SyncMentorAssignmentUniqueIndex : Migration
    {
        /// <remarks>
        /// Written as IF EXISTS / IF NOT EXISTS rather than the usual builder calls.
        /// This database has been changed by hand more than once, so its indexes do
        /// not always match what the migration history claims — the plain DropIndex
        /// this was first generated as brought the service down at startup on an
        /// index that was not there.
        ///
        /// Migrations run during boot here, so one that assumes a shape it has not
        /// checked takes the whole application with it.
        /// </remarks>
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DROP INDEX IF EXISTS ""IX_MentorAssignments_MentorUserId_RoundId_TeamId"";
                DROP INDEX IF EXISTS ""IX_MentorAssignments_RoundId"";

                CREATE INDEX IF NOT EXISTS ""IX_MentorAssignments_MentorUserId""
                    ON ""MentorAssignments"" (""MentorUserId"");

                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_MentorAssignments_RoundId_TeamId""
                    ON ""MentorAssignments"" (""RoundId"", ""TeamId"")
                    WHERE ""IsActive"" = TRUE AND ""TeamId"" IS NOT NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DROP INDEX IF EXISTS ""IX_MentorAssignments_MentorUserId"";
                DROP INDEX IF EXISTS ""IX_MentorAssignments_RoundId_TeamId"";

                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_MentorAssignments_MentorUserId_RoundId_TeamId""
                    ON ""MentorAssignments"" (""MentorUserId"", ""RoundId"", ""TeamId"")
                    WHERE ""IsActive"" = TRUE;

                CREATE INDEX IF NOT EXISTS ""IX_MentorAssignments_RoundId""
                    ON ""MentorAssignments"" (""RoundId"");
            ");
        }
    }
}
