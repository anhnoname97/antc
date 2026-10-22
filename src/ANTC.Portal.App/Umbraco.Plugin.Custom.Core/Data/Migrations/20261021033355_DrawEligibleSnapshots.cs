using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Umbraco.Plugin.Custom.Core.Data.Migrations
{
    /// <inheritdoc />
    public partial class DrawEligibleSnapshots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "eligible_snapshot_json",
                table: "draw",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "request_id",
                table: "draw",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_draw_request_id",
                table: "draw",
                column: "request_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_draw_request_id",
                table: "draw");

            migrationBuilder.DropColumn(
                name: "eligible_snapshot_json",
                table: "draw");

            migrationBuilder.DropColumn(
                name: "request_id",
                table: "draw");
        }
    }
}
