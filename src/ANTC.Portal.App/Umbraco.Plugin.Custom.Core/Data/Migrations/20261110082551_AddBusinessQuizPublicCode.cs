using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Umbraco.Plugin.Custom.Core.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessQuizPublicCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "public_code",
                table: "quiz_topic",
                type: "TEXT",
                maxLength: 16,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_quiz_topic_public_code",
                table: "quiz_topic",
                column: "public_code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_quiz_topic_public_code",
                table: "quiz_topic");

            migrationBuilder.DropColumn(
                name: "public_code",
                table: "quiz_topic");
        }
    }
}
