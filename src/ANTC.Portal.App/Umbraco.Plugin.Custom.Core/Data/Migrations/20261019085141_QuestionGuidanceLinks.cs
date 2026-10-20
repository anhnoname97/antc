using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Umbraco.Plugin.Custom.Core.Data.Migrations
{
    /// <inheritdoc />
    public partial class QuestionGuidanceLinks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "guidance_label",
                table: "question_submission",
                type: "TEXT",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "guidance_url",
                table: "question_submission",
                type: "TEXT",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "published_guidance_label",
                table: "question_submission",
                type: "TEXT",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "published_guidance_url",
                table: "question_submission",
                type: "TEXT",
                maxLength: 2048,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "guidance_label",
                table: "question_submission");

            migrationBuilder.DropColumn(
                name: "guidance_url",
                table: "question_submission");

            migrationBuilder.DropColumn(
                name: "published_guidance_label",
                table: "question_submission");

            migrationBuilder.DropColumn(
                name: "published_guidance_url",
                table: "question_submission");
        }
    }
}
