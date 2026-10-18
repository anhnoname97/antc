using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Umbraco.Plugin.Custom.Core.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddContestCampaigns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "contest",
                columns: table => new
                {
                    id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    start_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    end_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    max_attempts = table.Column<int>(type: "INTEGER", nullable: false),
                    is_active = table.Column<bool>(type: "INTEGER", nullable: false),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contest", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "contest_question",
                columns: table => new
                {
                    contest_id = table.Column<long>(type: "INTEGER", nullable: false),
                    question_code = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    sort_order = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contest_question", x => new { x.contest_id, x.question_code });
                    table.ForeignKey(
                        name: "FK_contest_question_contest_contest_id",
                        column: x => x.contest_id,
                        principalTable: "contest",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_contest_question_quiz_question_question_code",
                        column: x => x.question_code,
                        principalTable: "quiz_question",
                        principalColumn: "code",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "contest_topic",
                columns: table => new
                {
                    contest_id = table.Column<long>(type: "INTEGER", nullable: false),
                    topic_id = table.Column<int>(type: "INTEGER", nullable: false),
                    sort_order = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contest_topic", x => new { x.contest_id, x.topic_id });
                    table.ForeignKey(
                        name: "FK_contest_topic_contest_contest_id",
                        column: x => x.contest_id,
                        principalTable: "contest",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_contest_topic_quiz_topic_topic_id",
                        column: x => x.topic_id,
                        principalTable: "quiz_topic",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_contest_is_active_start_at_end_at",
                table: "contest",
                columns: new[] { "is_active", "start_at", "end_at" });

            migrationBuilder.CreateIndex(
                name: "IX_contest_question_question_code",
                table: "contest_question",
                column: "question_code");

            migrationBuilder.CreateIndex(
                name: "IX_contest_topic_topic_id",
                table: "contest_topic",
                column: "topic_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "contest_question");

            migrationBuilder.DropTable(
                name: "contest_topic");

            migrationBuilder.DropTable(
                name: "contest");
        }
    }
}
