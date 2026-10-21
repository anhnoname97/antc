using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Umbraco.Plugin.Custom.Core.Data.Migrations
{
    /// <inheritdoc />
    public partial class QuestionAggregationAndRetention : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "aggregated_into_id",
                table: "question_submission",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "aggregated_source_ids",
                table: "question_submission",
                type: "TEXT",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "question_submission",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "deleted_by",
                table: "question_submission",
                type: "TEXT",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "question_retention_policy",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false),
                    enabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    retention_days = table.Column<int>(type: "INTEGER", nullable: false),
                    review_version = table.Column<long>(type: "INTEGER", nullable: false),
                    updated_at = table.Column<DateTime>(type: "TEXT", nullable: true),
                    updated_by = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    last_run_at = table.Column<DateTime>(type: "TEXT", nullable: true),
                    last_deleted_count = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_question_retention_policy", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_question_submission_aggregated_into_id",
                table: "question_submission",
                column: "aggregated_into_id");

            migrationBuilder.CreateIndex(
                name: "IX_question_submission_deleted_at_created_at",
                table: "question_submission",
                columns: new[] { "deleted_at", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_question_submission_is_published_status_handled_at",
                table: "question_submission",
                columns: new[] { "is_published", "status", "handled_at" });

            migrationBuilder.AddForeignKey(
                name: "FK_question_submission_question_submission_aggregated_into_id",
                table: "question_submission",
                column: "aggregated_into_id",
                principalTable: "question_submission",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_question_submission_question_submission_aggregated_into_id",
                table: "question_submission");

            migrationBuilder.DropTable(
                name: "question_retention_policy");

            migrationBuilder.DropIndex(
                name: "IX_question_submission_aggregated_into_id",
                table: "question_submission");

            migrationBuilder.DropIndex(
                name: "IX_question_submission_deleted_at_created_at",
                table: "question_submission");

            migrationBuilder.DropIndex(
                name: "IX_question_submission_is_published_status_handled_at",
                table: "question_submission");

            migrationBuilder.DropColumn(
                name: "aggregated_into_id",
                table: "question_submission");

            migrationBuilder.DropColumn(
                name: "aggregated_source_ids",
                table: "question_submission");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "question_submission");

            migrationBuilder.DropColumn(
                name: "deleted_by",
                table: "question_submission");
        }
    }
}
