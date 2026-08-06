using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEAL.NET.Migrations
{
    /// <inheritdoc />
    public partial class AddCriterionTypeAndJudgeType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "JudgeType",
                table: "Users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                // "Unspecified" rather than the scaffolded "", so existing rows read
                // back as a real enum member and show up as genuinely unlabelled in
                // the research export instead of as a blank.
                defaultValue: "Unspecified");

            migrationBuilder.AddColumn<string>(
                name: "CriterionType",
                table: "Criteria",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                // "Unspecified" rather than the scaffolded "", so existing rows read
                // back as a real enum member and show up as genuinely unlabelled in
                // the research export instead of as a blank.
                defaultValue: "Unspecified");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "JudgeType",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CriterionType",
                table: "Criteria");
        }
    }
}
