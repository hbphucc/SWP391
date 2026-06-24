using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEAL.NET.Migrations
{
    /// <inheritdoc />
    public partial class AddEventPromptDocument : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PromptDocumentId",
                table: "Events",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Events_PromptDocumentId",
                table: "Events",
                column: "PromptDocumentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Events_Documents_PromptDocumentId",
                table: "Events",
                column: "PromptDocumentId",
                principalTable: "Documents",
                principalColumn: "DocumentId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Events_Documents_PromptDocumentId",
                table: "Events");

            migrationBuilder.DropIndex(
                name: "IX_Events_PromptDocumentId",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "PromptDocumentId",
                table: "Events");
        }
    }
}
