import { EmbedBuilder } from "discord.js";
import { LeaderboardEntry, UserStats } from "../database/init";

export function buildLeaderboardEmbed(
  entries: LeaderboardEntry[],
  period: string,
  guildName: string
): EmbedBuilder {
  const periodLabel =
    period === "today" ? "Today" : period === "week" ? "This Week" : "All Time";

  if (entries.length === 0) {
    return new EmbedBuilder()
      .setTitle(`${guildName} — LoLdle Leaderboard (${periodLabel})`)
      .setDescription("No games played yet!")
      .setColor(0x5865f2);
  }

  const lines = entries.map((e, i) => {
    const medal = i === 0 ? "\u{1F947}" : i === 1 ? "\u{1F948}" : i === 2 ? "\u{1F949}" : `${i + 1}.`;
    return `${medal} <@${e.user_id}> — **${e.wins}** wins (avg ${e.avg_guesses} guesses)`;
  });

  return new EmbedBuilder()
    .setTitle(`${guildName} — LoLdle Leaderboard (${periodLabel})`)
    .setDescription(lines.join("\n"))
    .setColor(0x5865f2);
}

export function buildStatsEmbed(
  userId: string,
  stats: UserStats
): EmbedBuilder {
  const winRate =
    stats.games_played > 0
      ? ((stats.wins / stats.games_played) * 100).toFixed(0)
      : "0";

  return new EmbedBuilder()
    .setTitle("LoLdle Stats")
    .setDescription(`<@${userId}>`)
    .addFields(
      { name: "Games Played", value: `${stats.games_played}`, inline: true },
      { name: "Wins", value: `${stats.wins}`, inline: true },
      { name: "Win Rate", value: `${winRate}%`, inline: true },
      { name: "Avg Guesses", value: `${stats.avg_guesses}`, inline: true },
      { name: "Current Streak", value: `${stats.current_streak}`, inline: true }
    )
    .setColor(0x5865f2);
}
