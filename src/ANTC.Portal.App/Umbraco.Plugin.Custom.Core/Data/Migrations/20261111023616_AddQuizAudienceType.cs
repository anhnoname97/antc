using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Umbraco.Plugin.Custom.Core.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddQuizAudienceType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "type",
                table: "quiz_topic",
                type: "TEXT",
                maxLength: 16,
                nullable: false,
                defaultValue: "personal");

            // Existing enterprise parts keep their audience; all other topics default to personal.
            migrationBuilder.Sql("UPDATE quiz_topic SET type = 'organization' WHERE public_code IS NOT NULL");
            migrationBuilder.CreateIndex(
                name: "IX_quiz_topic_type",
                table: "quiz_topic",
                column: "type");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_quiz_topic_type",
                table: "quiz_topic");

            migrationBuilder.DropColumn(
                name: "type",
                table: "quiz_topic");
        }
    }
}
