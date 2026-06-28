using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEAL.NET.Migrations
{
    /// <inheritdoc />
    public partial class AddEventRoleRegistrations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EventJudges",
                columns: table => new
                {
                    Event1EventId = table.Column<Guid>(type: "uuid", nullable: false),
                    RegisteredJudgesId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventJudges", x => new { x.Event1EventId, x.RegisteredJudgesId });
                    table.ForeignKey(
                        name: "FK_EventJudges_Events_Event1EventId",
                        column: x => x.Event1EventId,
                        principalTable: "Events",
                        principalColumn: "EventId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventJudges_Users_RegisteredJudgesId",
                        column: x => x.RegisteredJudgesId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventMentors",
                columns: table => new
                {
                    EventId = table.Column<Guid>(type: "uuid", nullable: false),
                    RegisteredMentorsId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventMentors", x => new { x.EventId, x.RegisteredMentorsId });
                    table.ForeignKey(
                        name: "FK_EventMentors_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "EventId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventMentors_Users_RegisteredMentorsId",
                        column: x => x.RegisteredMentorsId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EventJudges_RegisteredJudgesId",
                table: "EventJudges",
                column: "RegisteredJudgesId");

            migrationBuilder.CreateIndex(
                name: "IX_EventMentors_RegisteredMentorsId",
                table: "EventMentors",
                column: "RegisteredMentorsId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EventJudges");

            migrationBuilder.DropTable(
                name: "EventMentors");
        }
    }
}
