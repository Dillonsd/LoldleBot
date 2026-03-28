/**
 * Backend CLI for managing trolled users.
 *
 * Usage (after building):
 *   node dist/scripts/troll.js add <userId>
 *   node dist/scripts/troll.js remove <userId>
 *   node dist/scripts/troll.js list
 */

import { initDatabase, trollUser, untrollUser, listTrolledUsers, getDailyPuzzle, clearCorrectGuessOnUntroll } from "../database/init";
import { getTodayUTC } from "../utils/date";

initDatabase();

const [, , command, userId] = process.argv;

switch (command) {
  case "add":
    if (!userId) { console.error("Usage: troll add <userId>"); process.exit(1); }
    trollUser(userId);
    console.log(`Trolled: ${userId}`);
    break;

  case "remove":
    if (!userId) { console.error("Usage: troll remove <userId>"); process.exit(1); }
    untrollUser(userId);
    console.log(`Untrolled: ${userId}`);
    const today = getTodayUTC();
    const answerId = getDailyPuzzle(today);
    if (answerId) {
      const cleared = clearCorrectGuessOnUntroll(userId, today, answerId);
      if (cleared > 0) {
        console.log(`Cleared correct guess from active game so they can guess again.`);
      }
    }
    break;

  case "list": {
    const users = listTrolledUsers();
    if (users.length === 0) {
      console.log("No trolled users.");
    } else {
      console.log("Trolled users:");
      users.forEach((id) => console.log(` - ${id}`));
    }
    break;
  }

  default:
    console.error("Commands: add <userId> | remove <userId> | list");
    process.exit(1);
}
