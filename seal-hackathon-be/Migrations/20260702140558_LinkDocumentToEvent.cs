using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEAL.NET.Migrations
{
    /// <inheritdoc />
    public partial class LinkDocumentToEvent : Migration
    {
        /// <inheritdoc />
        /// <remarks>
        /// This body was once commented out with the note "Columns already exist",
        /// because the database it was written against had been changed by hand
        /// first. That left the migration claiming to link documents to events while
        /// creating nothing, so a database built from these migrations came out
        /// without Documents.EventId at all and the documents screen failed on it.
        ///
        /// Written as idempotent SQL rather than the usual builder calls so it is
        /// correct from either starting point: it creates what is missing on a fresh
        /// database and does nothing on one that already has these.
        ///
        /// The foreign key is left with the default NO ACTION, matching what the
        /// deployed database already enforces. EventRepository.HardDeleteAsync
        /// removes an event's documents before the event for that reason.
        /// </remarks>
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""Events"" ADD COLUMN IF NOT EXISTS ""PosterUrl"" character varying(2048);
                ALTER TABLE ""Events"" ADD COLUMN IF NOT EXISTS ""WinnerImageUrl"" character varying(2048);
                ALTER TABLE ""Documents"" ADD COLUMN IF NOT EXISTS ""EventId"" uuid;

                CREATE INDEX IF NOT EXISTS ""IX_Documents_EventId"" ON ""Documents"" (""EventId"");

                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'FK_Documents_Events_EventId'
                    ) THEN
                        ALTER TABLE ""Documents""
                            ADD CONSTRAINT ""FK_Documents_Events_EventId""
                            FOREIGN KEY (""EventId"") REFERENCES ""Events"" (""EventId"");
                    END IF;
                END $$;
            ");
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
