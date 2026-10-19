using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Umbraco.Plugin.Custom.Core.Data.Migrations
{
    /// <inheritdoc />
    public partial class QuestionBackofficeCreation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Chỉ thêm cột ở bước này. Đổi consent_at sang nullable tại migration
            // QuestionSubmissionConsentNullable sau khi hai nhánh đã có đủ cột.
            // SQLite dựng lại bảng khi AlterColumn; chạy bước đó ở đây sẽ làm mất
            // guidance_* nếu máy đã áp dụng QuestionGuidanceLinks từ main trước.

            migrationBuilder.AddColumn<string>(
                name: "created_by",
                table: "question_submission",
                type: "TEXT",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "source",
                table: "question_submission",
                type: "TEXT",
                maxLength: 16,
                nullable: false,
                defaultValue: "portal");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "created_by",
                table: "question_submission");

            migrationBuilder.DropColumn(
                name: "source",
                table: "question_submission");

        }
    }
}
