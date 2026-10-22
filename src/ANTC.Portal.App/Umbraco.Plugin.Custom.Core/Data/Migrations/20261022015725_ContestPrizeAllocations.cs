using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Umbraco.Plugin.Custom.Core.Data.Migrations
{
    /// <inheritdoc />
    public partial class ContestPrizeAllocations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "prize_code",
                table: "draw",
                type: "TEXT",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "prize_id",
                table: "draw",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "prize_name",
                table: "draw",
                type: "TEXT",
                maxLength: 150,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "prize",
                columns: table => new
                {
                    id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    code = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    name = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    description = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    is_active = table.Column<bool>(type: "INTEGER", nullable: false),
                    sort_order = table.Column<int>(type: "INTEGER", nullable: false),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    updated_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    revision = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_prize", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "contest_prize",
                columns: table => new
                {
                    contest_id = table.Column<long>(type: "INTEGER", nullable: false),
                    prize_id = table.Column<long>(type: "INTEGER", nullable: false),
                    quantity = table.Column<int>(type: "INTEGER", nullable: false),
                    sort_order = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contest_prize", x => new { x.contest_id, x.prize_id });
                    table.CheckConstraint("CK_contest_prize_quantity", "quantity BETWEEN 1 AND 1000");
                    table.ForeignKey(
                        name: "FK_contest_prize_contest_contest_id",
                        column: x => x.contest_id,
                        principalTable: "contest",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_contest_prize_prize_prize_id",
                        column: x => x.prize_id,
                        principalTable: "prize",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_draw_contest_id_prize_id",
                table: "draw",
                columns: new[] { "contest_id", "prize_id" });

            migrationBuilder.CreateIndex(
                name: "IX_contest_prize_prize_id",
                table: "contest_prize",
                column: "prize_id");

            migrationBuilder.CreateIndex(
                name: "IX_prize_code",
                table: "prize",
                column: "code",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_draw_contest_prize_contest_id_prize_id",
                table: "draw",
                columns: new[] { "contest_id", "prize_id" },
                principalTable: "contest_prize",
                principalColumns: new[] { "contest_id", "prize_id" },
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_draw_contest_prize_contest_id_prize_id",
                table: "draw");

            migrationBuilder.DropTable(
                name: "contest_prize");

            migrationBuilder.DropTable(
                name: "prize");

            migrationBuilder.DropIndex(
                name: "IX_draw_contest_id_prize_id",
                table: "draw");

            migrationBuilder.DropColumn(
                name: "prize_code",
                table: "draw");

            migrationBuilder.DropColumn(
                name: "prize_id",
                table: "draw");

            migrationBuilder.DropColumn(
                name: "prize_name",
                table: "draw");
        }
    }
}
