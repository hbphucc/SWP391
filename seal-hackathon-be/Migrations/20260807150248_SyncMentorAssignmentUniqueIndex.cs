using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEAL.NET.Migrations
{
    /// <inheritdoc />
    public partial class SyncMentorAssignmentUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MentorAssignments_MentorUserId_RoundId_TeamId",
                table: "MentorAssignments");

            migrationBuilder.DropIndex(
                name: "IX_MentorAssignments_RoundId",
                table: "MentorAssignments");

            migrationBuilder.CreateIndex(
                name: "IX_MentorAssignments_MentorUserId",
                table: "MentorAssignments",
                column: "MentorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MentorAssignments_RoundId_TeamId",
                table: "MentorAssignments",
                columns: new[] { "RoundId", "TeamId" },
                unique: true,
                filter: "\"IsActive\" = TRUE AND \"TeamId\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MentorAssignments_MentorUserId",
                table: "MentorAssignments");

            migrationBuilder.DropIndex(
                name: "IX_MentorAssignments_RoundId_TeamId",
                table: "MentorAssignments");

            migrationBuilder.CreateIndex(
                name: "IX_MentorAssignments_MentorUserId_RoundId_TeamId",
                table: "MentorAssignments",
                columns: new[] { "MentorUserId", "RoundId", "TeamId" },
                unique: true,
                filter: "\"IsActive\" = TRUE");

            migrationBuilder.CreateIndex(
                name: "IX_MentorAssignments_RoundId",
                table: "MentorAssignments",
                column: "RoundId");
        }
    }
}
