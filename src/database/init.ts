import Database from "better-sqlite3";
import path from "path";

let db: Database.Database;

export function initDatabase(): void {
  const dbPath = process.env.DB_PATH ?? path.join(__dirname, "..", "..", "loldle.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_puzzles (
      date TEXT PRIMARY KEY,
      champion_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      guess_count INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      UNIQUE(guild_id, user_id, date)
    );

    CREATE TABLE IF NOT EXISTS guesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL REFERENCES games(id),
      champion_id TEXT NOT NULL,
      guess_num INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(game_id, guess_num)
    );

    CREATE INDEX IF NOT EXISTS idx_games_user ON games(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_games_guild_date ON games(guild_id, date);
  `);

  console.log("[Database] Initialized");
}

export function getDatabase(): Database.Database {
  return db;
}

// --- Daily Puzzles ---

export function getDailyPuzzle(date: string): string | undefined {
  const row = db
    .prepare("SELECT champion_id FROM daily_puzzles WHERE date = ?")
    .get(date) as { champion_id: string } | undefined;
  return row?.champion_id;
}

export function setDailyPuzzle(date: string, championId: string): void {
  db.prepare(
    "INSERT OR IGNORE INTO daily_puzzles (date, champion_id) VALUES (?, ?)"
  ).run(date, championId);
}

// --- Games ---

export interface GameRow {
  id: number;
  guild_id: string;
  user_id: string;
  date: string;
  status: string;
  guess_count: number;
  completed_at: string | null;
}

export function getActiveGame(
  guildId: string,
  userId: string,
  date: string
): GameRow | undefined {
  return db
    .prepare(
      "SELECT * FROM games WHERE guild_id = ? AND user_id = ? AND date = ?"
    )
    .get(guildId, userId, date) as GameRow | undefined;
}

export function createGame(
  guildId: string,
  userId: string,
  date: string
): GameRow {
  const result = db
    .prepare(
      "INSERT INTO games (guild_id, user_id, date) VALUES (?, ?, ?)"
    )
    .run(guildId, userId, date);
  return {
    id: result.lastInsertRowid as number,
    guild_id: guildId,
    user_id: userId,
    date,
    status: "active",
    guess_count: 0,
    completed_at: null,
  };
}

export function addGuess(gameId: number, championId: string): number {
  const game = db.prepare("SELECT guess_count FROM games WHERE id = ?").get(gameId) as {
    guess_count: number;
  };
  const guessNum = game.guess_count + 1;

  db.prepare(
    "INSERT INTO guesses (game_id, champion_id, guess_num) VALUES (?, ?, ?)"
  ).run(gameId, championId, guessNum);

  db.prepare("UPDATE games SET guess_count = ? WHERE id = ?").run(
    guessNum,
    gameId
  );

  return guessNum;
}

export function completeGame(
  gameId: number,
  status: "won" | "lost"
): void {
  db.prepare(
    "UPDATE games SET status = ?, completed_at = datetime('now') WHERE id = ?"
  ).run(status, gameId);
}

export function getGuessedChampions(gameId: number): string[] {
  const rows = db
    .prepare(
      "SELECT champion_id FROM guesses WHERE game_id = ? ORDER BY guess_num"
    )
    .all(gameId) as { champion_id: string }[];
  return rows.map((r) => r.champion_id);
}

// --- Leaderboard / Stats ---

export interface LeaderboardEntry {
  user_id: string;
  wins: number;
  avg_guesses: number;
}

export function getLeaderboard(
  guildId: string,
  period: "today" | "week" | "alltime",
  date: string
): LeaderboardEntry[] {
  let dateFilter: string;
  if (period === "today") {
    dateFilter = `AND g.date = '${date}'`;
  } else if (period === "week") {
    dateFilter = `AND g.date >= date('${date}', '-7 days')`;
  } else {
    dateFilter = "";
  }

  return db
    .prepare(
      `SELECT g.user_id, COUNT(*) as wins, ROUND(AVG(g.guess_count), 1) as avg_guesses
       FROM games g
       WHERE g.guild_id = ? AND g.status = 'won' ${dateFilter}
       GROUP BY g.user_id
       ORDER BY wins DESC, avg_guesses ASC
       LIMIT 10`
    )
    .all(guildId) as LeaderboardEntry[];
}

export interface UserStats {
  games_played: number;
  wins: number;
  avg_guesses: number;
  current_streak: number;
}

export function getUserStats(userId: string): UserStats {
  const stats = db
    .prepare(
      `SELECT
         COUNT(*) as games_played,
         SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as wins,
         ROUND(AVG(CASE WHEN status = 'won' THEN guess_count END), 1) as avg_guesses
       FROM games WHERE user_id = ?`
    )
    .get(userId) as {
    games_played: number;
    wins: number;
    avg_guesses: number | null;
  };

  // Calculate current streak
  const recentGames = db
    .prepare(
      `SELECT status FROM games WHERE user_id = ? ORDER BY date DESC`
    )
    .all(userId) as { status: string }[];

  let streak = 0;
  for (const game of recentGames) {
    if (game.status === "won") {
      streak++;
    } else {
      break;
    }
  }

  return {
    games_played: stats.games_played,
    wins: stats.wins,
    avg_guesses: stats.avg_guesses ?? 0,
    current_streak: streak,
  };
}
