using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Umbraco.Plugin.Custom.Core.Data.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261111160000_ReconcileQuizAudienceMetadata")]
public sealed class ReconcileQuizAudienceMetadata : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("UPDATE quiz_topic SET type = 'organization' WHERE audience = 'enterprise' OR public_code IS NOT NULL");
        migrationBuilder.Sql("UPDATE quiz_topic SET audience = CASE WHEN type = 'organization' THEN 'enterprise' ELSE 'general' END");
    }

    protected override void Down(MigrationBuilder migrationBuilder) { }
}
