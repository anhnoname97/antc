using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Umbraco.Plugin.Custom.Core.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddEntryContestAndContestSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "contest_id",
                table: "entry",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "focus_area",
                table: "contest",
                type: "TEXT",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "read_timer_factor",
                table: "contest",
                type: "TEXT",
                precision: 4,
                scale: 2,
                nullable: false,
                defaultValue: 1m);

            migrationBuilder.AddColumn<int>(
                name: "submit_grace_hours",
                table: "contest",
                type: "INTEGER",
                nullable: false,
                defaultValue: 24);

            migrationBuilder.CreateIndex(
                name: "IX_entry_contest_id_phone",
                table: "entry",
                columns: new[] { "contest_id", "phone" });

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
                name: "FK_entry_contest_contest_id",
                table: "entry");

            migrationBuilder.DropIndex(
                name: "IX_entry_contest_id_phone",
                table: "entry");

            migrationBuilder.DropColumn(
                name: "contest_id",
                table: "entry");

            migrationBuilder.DropColumn(
                name: "focus_area",
                table: "contest");

            migrationBuilder.DropColumn(
                name: "read_timer_factor",
                table: "contest");

            migrationBuilder.DropColumn(
                name: "submit_grace_hours",
                table: "contest");
        }
    }
}
