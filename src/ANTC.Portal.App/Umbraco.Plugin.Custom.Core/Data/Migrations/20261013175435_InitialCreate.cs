using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Umbraco.Plugin.Custom.Core.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "draw",
                columns: table => new
                {
                    id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    created_by = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    min_score = table.Column<int>(type: "INTEGER", nullable: false),
                    winners_requested = table.Column<int>(type: "INTEGER", nullable: false),
                    eligible_count = table.Column<int>(type: "INTEGER", nullable: false),
                    exclude_previous = table.Column<bool>(type: "INTEGER", nullable: false),
                    note = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_draw", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "entry",
                columns: table => new
                {
                    id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    code = table.Column<string>(type: "TEXT", maxLength: 9, nullable: false),
                    token_hash = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    mode = table.Column<string>(type: "TEXT", maxLength: 5, nullable: false),
                    full_name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    phone = table.Column<string>(type: "TEXT", maxLength: 10, nullable: true),
                    org = table.Column<string>(type: "TEXT", maxLength: 150, nullable: true),
                    consent_at = table.Column<DateTime>(type: "TEXT", nullable: true),
                    attempt_no = table.Column<int>(type: "INTEGER", nullable: true),
                    status = table.Column<string>(type: "TEXT", maxLength: 12, nullable: false),
                    answered = table.Column<int>(type: "INTEGER", nullable: false),
                    score = table.Column<int>(type: "INTEGER", nullable: true),
                    total_questions = table.Column<int>(type: "INTEGER", nullable: true),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    submitted_at = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ip_hash = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_entry", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "question_submission",
                columns: table => new
                {
                    id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    type = table.Column<string>(type: "TEXT", maxLength: 8, nullable: false),
                    content = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    want_reply = table.Column<bool>(type: "INTEGER", nullable: false),
                    contact = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    consent_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    status = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    admin_note = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    handled_by = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    handled_at = table.Column<DateTime>(type: "TEXT", nullable: true),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ip_hash = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_question_submission", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "quiz_import",
                columns: table => new
                {
                    id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    created_by = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    file_name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    added = table.Column<int>(type: "INTEGER", nullable: false),
                    updated = table.Column<int>(type: "INTEGER", nullable: false),
                    deactivated = table.Column<int>(type: "INTEGER", nullable: false),
                    during_contest = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_quiz_import", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "quiz_topic",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false),
                    title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    intro = table.Column<string>(type: "TEXT", nullable: false),
                    terms = table.Column<string>(type: "TEXT", nullable: true),
                    is_active = table.Column<bool>(type: "INTEGER", nullable: false),
                    updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_quiz_topic", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "draw_winner",
                columns: table => new
                {
                    draw_id = table.Column<long>(type: "INTEGER", nullable: false),
                    rank = table.Column<int>(type: "INTEGER", nullable: false),
                    entry_id = table.Column<long>(type: "INTEGER", nullable: true),
                    code = table.Column<string>(type: "TEXT", maxLength: 9, nullable: false),
                    full_name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    phone = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    score = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_draw_winner", x => new { x.draw_id, x.rank });
                    table.ForeignKey(
                        name: "FK_draw_winner_draw_draw_id",
                        column: x => x.draw_id,
                        principalTable: "draw",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "entry_answer",
                columns: table => new
                {
                    entry_id = table.Column<long>(type: "INTEGER", nullable: false),
                    question_code = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    topic = table.Column<int>(type: "INTEGER", nullable: false),
                    chosen = table.Column<string>(type: "TEXT", maxLength: 1, nullable: false),
                    is_correct = table.Column<bool>(type: "INTEGER", nullable: false),
                    answered_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_entry_answer", x => new { x.entry_id, x.question_code });
                    table.ForeignKey(
                        name: "FK_entry_answer_entry_entry_id",
                        column: x => x.entry_id,
                        principalTable: "entry",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "quiz_question",
                columns: table => new
                {
                    code = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    topic_id = table.Column<int>(type: "INTEGER", nullable: false),
                    kind = table.Column<string>(type: "TEXT", maxLength: 40, nullable: false),
                    situation = table.Column<string>(type: "TEXT", nullable: true),
                    question = table.Column<string>(type: "TEXT", nullable: false),
                    options = table.Column<string>(type: "TEXT", nullable: false),
                    answer = table.Column<string>(type: "TEXT", maxLength: 1, nullable: false),
                    explanations = table.Column<string>(type: "TEXT", nullable: false),
                    safe_action = table.Column<string>(type: "TEXT", nullable: true),
                    read_seconds = table.Column<int>(type: "INTEGER", nullable: false),
                    sample_order = table.Column<int>(type: "INTEGER", nullable: true),
                    sample_label = table.Column<string>(type: "TEXT", maxLength: 60, nullable: true),
                    sort_order = table.Column<int>(type: "INTEGER", nullable: false),
                    is_active = table.Column<bool>(type: "INTEGER", nullable: false),
                    updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_quiz_question", x => x.code);
                    table.ForeignKey(
                        name: "FK_quiz_question_quiz_topic_topic_id",
                        column: x => x.topic_id,
                        principalTable: "quiz_topic",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_entry_code",
                table: "entry",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_entry_phone",
                table: "entry",
                column: "phone");

            migrationBuilder.CreateIndex(
                name: "IX_entry_status_score",
                table: "entry",
                columns: new[] { "status", "score" });

            migrationBuilder.CreateIndex(
                name: "IX_entry_token_hash",
                table: "entry",
                column: "token_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_entry_answer_question_code",
                table: "entry_answer",
                column: "question_code");

            migrationBuilder.CreateIndex(
                name: "IX_question_submission_status_created_at",
                table: "question_submission",
                columns: new[] { "status", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_quiz_question_topic_id",
                table: "quiz_question",
                column: "topic_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "draw_winner");

            migrationBuilder.DropTable(
                name: "entry_answer");

            migrationBuilder.DropTable(
                name: "question_submission");

            migrationBuilder.DropTable(
                name: "quiz_import");

            migrationBuilder.DropTable(
                name: "quiz_question");

            migrationBuilder.DropTable(
                name: "draw");

            migrationBuilder.DropTable(
                name: "entry");

            migrationBuilder.DropTable(
                name: "quiz_topic");
        }
    }
}
