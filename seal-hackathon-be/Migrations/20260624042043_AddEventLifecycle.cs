using Microsoft.EntityFrameworkCore.Migrations;

using System;

#nullable disable

namespace SEAL.NET.Migrations
{
    /// <inheritdoc />
    public partial class AddEventLifecycle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "RegistrationStartDate",
                table: "Events",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RegistrationEndDate",
                table: "Events",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.Sql("UPDATE \"Events\" SET \"RegistrationStartDate\" = \"CreatedAt\", \"RegistrationEndDate\" = \"StartDate\" WHERE \"RegistrationStartDate\" IS NULL;");
            migrationBuilder.Sql("UPDATE \"Events\" SET \"Status\" = 4 WHERE \"Status\" = 0;");

            migrationBuilder.AlterColumn<DateTime>(
                name: "RegistrationStartDate",
                table: "Events",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "RegistrationEndDate",
                table: "Events",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE \"Events\" SET \"Status\" = 0 WHERE \"Status\" = 4;");

            migrationBuilder.AlterColumn<DateTime>(
                name: "RegistrationStartDate",
                table: "Events",
                type: "timestamp without time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "RegistrationEndDate",
                table: "Events",
                type: "timestamp without time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.DropColumn(
                name: "RegistrationStartDate",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "RegistrationEndDate",
                table: "Events");
        }
    }
}
