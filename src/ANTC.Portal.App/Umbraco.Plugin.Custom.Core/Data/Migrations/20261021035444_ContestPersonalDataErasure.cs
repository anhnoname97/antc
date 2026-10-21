using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Umbraco.Plugin.Custom.Core.Data.Migrations
{
    /// <inheritdoc />
    public partial class ContestPersonalDataErasure : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "privacy_operation",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    actor_user_key = table.Column<Guid>(type: "TEXT", nullable: false),
                    occurred_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    scope = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    action = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    request_hash = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    counts_json = table.Column<string>(type: "TEXT", nullable: false),
                    vacuum_completed = table.Column<bool>(type: "INTEGER", nullable: false),
                    vacuum_completed_at = table.Column<DateTime>(type: "TEXT", nullable: true),
                    cleanup_error_code = table.Column<string>(type: "TEXT", maxLength: 40, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_privacy_operation", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_privacy_operation_occurred_at",
                table: "privacy_operation",
                column: "occurred_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "privacy_operation");
        }
    }
}
