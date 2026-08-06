using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEAL.NET.Migrations
{
    /// <inheritdoc />
    public partial class ScopeMentorAssignmentToRound : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MentorAssignments_MentorUserId_TeamId",
                table: "MentorAssignments");

            migrationBuilder.AlterColumn<Guid>(
                name: "TeamId",
                table: "MentorAssignments",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "RoundId",
                table: "MentorAssignments",
                type: "uuid",
                nullable: true);

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

            migrationBuilder.AddForeignKey(
                name: "FK_MentorAssignments_Rounds_RoundId",
                table: "MentorAssignments",
                column: "RoundId",
                principalTable: "Rounds",
                principalColumn: "RoundId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MentorAssignments_Rounds_RoundId",
                table: "MentorAssignments");

            migrationBuilder.DropIndex(
                name: "IX_MentorAssignments_MentorUserId_RoundId_TeamId",
                table: "MentorAssignments");

            migrationBuilder.DropIndex(
                name: "IX_MentorAssignments_RoundId",
                table: "MentorAssignments");

            migrationBuilder.DropColumn(
                name: "RoundId",
                table: "MentorAssignments");

            migrationBuilder.AlterColumn<Guid>(
                name: "TeamId",
                table: "MentorAssignments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MentorAssignments_MentorUserId_TeamId",
                table: "MentorAssignments",
                columns: new[] { "MentorUserId", "TeamId" },
                unique: true,
                filter: "\"IsActive\" = TRUE");
        }
    }
}
