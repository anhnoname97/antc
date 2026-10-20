using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Umbraco.Plugin.Custom.Core.Data.Migrations
{
    /// <inheritdoc />
    public partial class PublishContestResults : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "contest_published_result",
                columns: table => new
                {
                    contest_id = table.Column<long>(type: "INTEGER", nullable: false),
                    revision = table.Column<long>(type: "INTEGER", nullable: false),
                    is_published = table.Column<bool>(type: "INTEGER", nullable: false),
                    published_at = table.Column<DateTime>(type: "TEXT", nullable: true),
                    published_by_key = table.Column<Guid>(type: "TEXT", nullable: true),
                    snapshot_json = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contest_published_result", x => x.contest_id);
                    table.ForeignKey(
                        name: "FK_contest_published_result_contest_contest_id",
                        column: x => x.contest_id,
                        principalTable: "contest",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "contest_published_result");
        }
    }
}
