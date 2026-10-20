using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Umbraco.Plugin.Custom.Core.Data.Migrations
{
    /// <inheritdoc />
    public partial class ContestAdministrationAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "contest_access_audit",
                columns: table => new
                {
                    id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    actor_user_key = table.Column<Guid>(type: "TEXT", nullable: false),
                    action = table.Column<string>(type: "TEXT", maxLength: 40, nullable: false),
                    entry_code = table.Column<string>(type: "TEXT", maxLength: 9, nullable: true),
                    occurred_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    protected_filters = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contest_access_audit", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_entry_created_at",
                table: "entry",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_contest_access_audit_occurred_at",
                table: "contest_access_audit",
                column: "occurred_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "contest_access_audit");

            migrationBuilder.DropIndex(
                name: "IX_entry_created_at",
                table: "entry");
        }
    }
}
