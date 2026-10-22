using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Umbraco.Plugin.Custom.Core.Data.Migrations
{
    /// <inheritdoc />
    public partial class MovePrizeMoneyToContest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "prize_money",
                table: "contest_prize",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0L);
            migrationBuilder.Sql("UPDATE contest_prize SET prize_money = COALESCE((SELECT prize_money FROM prize WHERE prize.id = contest_prize.prize_id), 0)");
            migrationBuilder.DropColumn(name: "prize_money", table: "prize");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "prize_money",
                table: "contest_prize");

            migrationBuilder.AddColumn<long>(
                name: "prize_money",
                table: "prize",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0L);
        }
    }
}
