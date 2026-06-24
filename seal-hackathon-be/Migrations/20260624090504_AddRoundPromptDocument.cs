using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEAL.NET.Migrations
{
    /// <inheritdoc />
    public partial class AddRoundPromptDocument : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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

            migrationBuilder.AddColumn<Guid>(
                name: "PromptDocumentId",
                table: "Rounds",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Rounds_PromptDocumentId",
                table: "Rounds",
                column: "PromptDocumentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Rounds_Documents_PromptDocumentId",
                table: "Rounds",
                column: "PromptDocumentId",
                principalTable: "Documents",
                principalColumn: "DocumentId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Rounds_Documents_PromptDocumentId",
                table: "Rounds");

            migrationBuilder.DropIndex(
                name: "IX_Rounds_PromptDocumentId",
                table: "Rounds");

            migrationBuilder.DropColumn(
                name: "PromptDocumentId",
                table: "Rounds");

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
    }
}
