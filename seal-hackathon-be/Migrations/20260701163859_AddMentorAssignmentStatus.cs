using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEAL.NET.Migrations
{
    /// <inheritdoc />
    public partial class AddMentorAssignmentStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "MentorAssignments",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // Backfill: rows created before this column existed were never "Pending" —
            // they were either the team's confirmed mentor (IsActive = true -> Accepted)
            // or a superseded/removed assignment (IsActive = false -> Cancelled). Without
            // this, every pre-existing row would default to Pending and incorrectly show
            // up in a mentor's new "pending invitations" list.
            migrationBuilder.Sql(
                "UPDATE \"MentorAssignments\" SET \"Status\" = CASE WHEN \"IsActive\" THEN 1 ELSE 3 END;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Status",
                table: "MentorAssignments");
        }
    }
}
