using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Umbraco.Plugin.Custom.Core.Data.Migrations
{
    /// <inheritdoc />
    public partial class QuestionModerationApproval : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "answer",
                table: "question_submission",
                type: "TEXT",
                maxLength: 10000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "approved_at",
                table: "question_submission",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "approved_by",
                table: "question_submission",
                type: "TEXT",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_published",
                table: "question_submission",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "published_answer",
                table: "question_submission",
                type: "TEXT",
                maxLength: 10000,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "review_version",
                table: "question_submission",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.CreateIndex(
                name: "IX_question_submission_is_published_approved_at",
                table: "question_submission",
                columns: new[] { "is_published", "approved_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_question_submission_is_published_approved_at",
                table: "question_submission");

            migrationBuilder.DropColumn(
                name: "answer",
                table: "question_submission");

            migrationBuilder.DropColumn(
                name: "approved_at",
                table: "question_submission");

            migrationBuilder.DropColumn(
                name: "approved_by",
                table: "question_submission");

            migrationBuilder.DropColumn(
                name: "is_published",
                table: "question_submission");

            migrationBuilder.DropColumn(
                name: "published_answer",
                table: "question_submission");

            migrationBuilder.DropColumn(
                name: "review_version",
                table: "question_submission");
        }
    }
}
