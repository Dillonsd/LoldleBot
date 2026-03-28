/**
 * Backend CLI for inspecting and managing player games.
 *
 * Usage (after building):
 *   node dist/scripts/games.js list-all
 *   node dist/scripts/games.js list <userId>
 *   node dist/scripts/games.js delete <gameId>
 */

import { initDatabase, listGamesForUser, listAllGames, deleteGame, GameSummary } from "../database/init";

initDatabase();

const [, , command, arg] = process.argv;

function printGames(games: GameSummary[]): void {
  console.log(
    ["ID", "Date", "User", "Guild", "Status", "Guesses", "Trolled"]
      .map((h) => h.padEnd(20))
      .join("")
  );
  console.log("-".repeat(140));
  for (const g of games) {
    console.log(
      [
        String(g.id),
        g.date,
        g.user_id,
        g.guild_id,
        g.status,
        String(g.guess_count),
        g.troll_target ? `yes (${g.troll_target})` : "no",
      ]
        .map((v) => v.padEnd(20))
        .join("")
    );
  }
}

switch (command) {
  case "list-all": {
    const games = listAllGames();
    if (games.length === 0) { console.log("No games found."); break; }
    printGames(games);
    break;
  }

  case "list": {
    if (!arg) { console.error("Usage: games list <userId>"); process.exit(1); }
    const games = listGamesForUser(arg);
    if (games.length === 0) { console.log("No games found for that user."); break; }
    console.log(`Games for ${arg}:\n`);
    printGames(games);
    break;
  }

  case "delete": {
    if (!arg) { console.error("Usage: games delete <gameId>"); process.exit(1); }
    const gameId = parseInt(arg, 10);
    if (isNaN(gameId)) { console.error("gameId must be a number."); process.exit(1); }
    const deleted = deleteGame(gameId);
    if (deleted === 0) {
      console.log(`No game found with id ${gameId}.`);
    } else {
      console.log(`Deleted game ${gameId} (and its guesses).`);
    }
    break;
  }

  default:
    console.error("Commands: list-all | list <userId> | delete <gameId>");
    process.exit(1);
}
