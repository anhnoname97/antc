using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Umbraco.Plugin.Custom.Core.Data.Migrations
{
    /// <inheritdoc />
    public partial class QuizTopicAudiences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "audience",
                table: "quiz_topic",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "general");

            migrationBuilder.AddColumn<string>(
                name: "caption",
                table: "quiz_topic",
                type: "TEXT",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "short_title",
                table: "quiz_topic",
                type: "TEXT",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "audience",
                table: "quiz_topic");

            migrationBuilder.DropColumn(
                name: "caption",
                table: "quiz_topic");

            migrationBuilder.DropColumn(
                name: "short_title",
                table: "quiz_topic");
        }
    }
}
