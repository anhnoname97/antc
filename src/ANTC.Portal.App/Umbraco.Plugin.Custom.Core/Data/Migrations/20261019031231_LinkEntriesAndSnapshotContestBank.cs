using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Umbraco.Plugin.Custom.Core.Data.Migrations
{
    /// <inheritdoc />
    public partial class LinkEntriesAndSnapshotContestBank : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "revision",
                table: "quiz_topic",
                type: "INTEGER",
                nullable: false,
                defaultValue: 1L);

            migrationBuilder.AddColumn<long>(
                name: "revision",
                table: "quiz_question",
                type: "INTEGER",
                nullable: false,
                defaultValue: 1L);

            migrationBuilder.AddColumn<long>(
                name: "contest_id",
                table: "entry",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "contest_id",
                table: "draw",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "intro",
                table: "contest_topic",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "terms",
                table: "contest_topic",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "title",
                table: "contest_topic",
                type: "TEXT",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "answer",
                table: "contest_question",
                type: "TEXT",
                maxLength: 1,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "explanations",
                table: "contest_question",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "kind",
                table: "contest_question",
                type: "TEXT",
                maxLength: 40,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "options",
                table: "contest_question",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "question_text",
                table: "contest_question",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "read_seconds",
                table: "contest_question",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "safe_action",
                table: "contest_question",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "sample_label",
                table: "contest_question",
                type: "TEXT",
                maxLength: 60,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "sample_order",
                table: "contest_question",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "situation",
                table: "contest_question",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "topic_id",
                table: "contest_question",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<long>(
                name: "bank_version",
                table: "contest",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0L);

            // Bao toàn các cấu hình cuộc thi đã tạo trước migration bằng cách chụp dữ liệu hiện hành.
            migrationBuilder.Sql("""
                UPDATE contest_topic
                SET title = COALESCE((SELECT title FROM quiz_topic WHERE quiz_topic.id = contest_topic.topic_id), ''),
                    intro = COALESCE((SELECT intro FROM quiz_topic WHERE quiz_topic.id = contest_topic.topic_id), '[]'),
                    terms = (SELECT terms FROM quiz_topic WHERE quiz_topic.id = contest_topic.topic_id);

                UPDATE contest_question
                SET topic_id = COALESCE((SELECT topic_id FROM quiz_question WHERE quiz_question.code = contest_question.question_code), 0),
                    kind = COALESCE((SELECT kind FROM quiz_question WHERE quiz_question.code = contest_question.question_code), ''),
                    situation = (SELECT situation FROM quiz_question WHERE quiz_question.code = contest_question.question_code),
                    question_text = COALESCE((SELECT question FROM quiz_question WHERE quiz_question.code = contest_question.question_code), ''),
                    options = COALESCE((SELECT options FROM quiz_question WHERE quiz_question.code = contest_question.question_code), '[]'),
                    answer = COALESCE((SELECT answer FROM quiz_question WHERE quiz_question.code = contest_question.question_code), ''),
                    explanations = COALESCE((SELECT explanations FROM quiz_question WHERE quiz_question.code = contest_question.question_code), '{}'),
                    safe_action = (SELECT safe_action FROM quiz_question WHERE quiz_question.code = contest_question.question_code),
                    read_seconds = COALESCE((SELECT read_seconds FROM quiz_question WHERE quiz_question.code = contest_question.question_code), 0),
                    sample_order = (SELECT sample_order FROM quiz_question WHERE quiz_question.code = contest_question.question_code),
                    sample_label = (SELECT sample_label FROM quiz_question WHERE quiz_question.code = contest_question.question_code);

                UPDATE contest
                SET bank_version = COALESCE((SELECT MAX(id) FROM quiz_import), 0);
                """);

            migrationBuilder.AddColumn<long>(
                name: "revision",
                table: "contest",
                type: "INTEGER",
                nullable: false,
                defaultValue: 1L);

            migrationBuilder.CreateIndex(
                name: "IX_entry_contest_id_phone",
                table: "entry",
                columns: new[] { "contest_id", "phone" });

            migrationBuilder.CreateIndex(
                name: "IX_draw_contest_id",
                table: "draw",
                column: "contest_id");

            migrationBuilder.AddForeignKey(
                name: "FK_draw_contest_contest_id",
                table: "draw",
                column: "contest_id",
                principalTable: "contest",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_entry_contest_contest_id",
                table: "entry",
                column: "contest_id",
                principalTable: "contest",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_draw_contest_contest_id",
                table: "draw");

            migrationBuilder.DropForeignKey(
                name: "FK_entry_contest_contest_id",
                table: "entry");

            migrationBuilder.DropIndex(
                name: "IX_entry_contest_id_phone",
                table: "entry");

            migrationBuilder.DropIndex(
                name: "IX_draw_contest_id",
                table: "draw");

            migrationBuilder.DropColumn(
                name: "revision",
                table: "quiz_topic");

            migrationBuilder.DropColumn(
                name: "revision",
                table: "quiz_question");

            migrationBuilder.DropColumn(
                name: "contest_id",
                table: "entry");

            migrationBuilder.DropColumn(
                name: "contest_id",
                table: "draw");

            migrationBuilder.DropColumn(
                name: "intro",
                table: "contest_topic");

            migrationBuilder.DropColumn(
                name: "terms",
                table: "contest_topic");

            migrationBuilder.DropColumn(
                name: "title",
                table: "contest_topic");

            migrationBuilder.DropColumn(
                name: "answer",
                table: "contest_question");

            migrationBuilder.DropColumn(
                name: "explanations",
                table: "contest_question");

            migrationBuilder.DropColumn(
                name: "kind",
                table: "contest_question");

            migrationBuilder.DropColumn(
                name: "options",
                table: "contest_question");

            migrationBuilder.DropColumn(
                name: "question_text",
                table: "contest_question");

            migrationBuilder.DropColumn(
                name: "read_seconds",
                table: "contest_question");

            migrationBuilder.DropColumn(
                name: "safe_action",
                table: "contest_question");

            migrationBuilder.DropColumn(
                name: "sample_label",
                table: "contest_question");

            migrationBuilder.DropColumn(
                name: "sample_order",
                table: "contest_question");

            migrationBuilder.DropColumn(
                name: "situation",
                table: "contest_question");

            migrationBuilder.DropColumn(
                name: "topic_id",
                table: "contest_question");

            migrationBuilder.DropColumn(
                name: "bank_version",
                table: "contest");

            migrationBuilder.DropColumn(
                name: "revision",
                table: "contest");
        }
    }
}
