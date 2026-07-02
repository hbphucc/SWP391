using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEAL.NET.Migrations
{
    /// <inheritdoc />
    public partial class LinkDocumentToEvent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Columns already exist
            // migrationBuilder.AddColumn<string>(
            //     name: "PosterUrl",
            //     table: "Events",
            //     type: "character varying(2048)",
            //     maxLength: 2048,
            //     nullable: true);

            // migrationBuilder.AddColumn<string>(
            //     name: "WinnerImageUrl",
            //     table: "Events",
            //     type: "character varying(2048)",
            //     maxLength: 2048,
            //     nullable: true);

            // migrationBuilder.AddColumn<Guid>(
            //     name: "EventId",
            //     table: "Documents",
            //     type: "uuid",
            //     nullable: true);

            // migrationBuilder.CreateIndex(
            //     name: "IX_Documents_EventId",
            //     table: "Documents",
            //     column: "EventId");

            // migrationBuilder.AddForeignKey(
            //     name: "FK_Documents_Events_EventId",
            //     table: "Documents",
            //     column: "EventId",
            //     principalTable: "Events",
            //     principalColumn: "EventId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Events_EventId",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Documents_EventId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "PosterUrl",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "WinnerImageUrl",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "EventId",
                table: "Documents");
        }
    }
}
