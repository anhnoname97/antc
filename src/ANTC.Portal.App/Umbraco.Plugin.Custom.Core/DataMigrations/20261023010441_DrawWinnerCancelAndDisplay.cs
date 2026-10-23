using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Umbraco.Plugin.Custom.Core.DataMigrations
{
    /// <inheritdoc />
    public partial class DrawWinnerCancelAndDisplay : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "cancel_reason_code",
                table: "draw_winner",
                type: "TEXT",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "cancel_reason_text",
                table: "draw_winner",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "cancelled_at",
                table: "draw_winner",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "cancelled_by",
                table: "draw_winner",
                type: "TEXT",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "contest_draw_display",
                columns: table => new
                {
                    contest_id = table.Column<long>(type: "INTEGER", nullable: false),
                    show_live_badge = table.Column<bool>(type: "INTEGER", nullable: false),
                    show_anti_scam_ticker = table.Column<bool>(type: "INTEGER", nullable: false),
                    transparent_background = table.Column<bool>(type: "INTEGER", nullable: false),
                    updated_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    updated_by = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contest_draw_display", x => x.contest_id);
                    table.ForeignKey(
                        name: "FK_contest_draw_display_contest_contest_id",
                        column: x => x.contest_id,
                        principalTable: "contest",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "contest_draw_display");

            migrationBuilder.DropColumn(
                name: "cancel_reason_code",
                table: "draw_winner");

            migrationBuilder.DropColumn(
                name: "cancel_reason_text",
                table: "draw_winner");

            migrationBuilder.DropColumn(
                name: "cancelled_at",
                table: "draw_winner");

            migrationBuilder.DropColumn(
                name: "cancelled_by",
                table: "draw_winner");
        }
    }
}
