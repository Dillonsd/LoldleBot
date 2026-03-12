import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getLeaderboard } from "../database/init";
import { getTodayUTC } from "../utils/date";
import { buildLeaderboardEmbed } from "../embeds/leaderboard";

export const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("Show the server LoLdle leaderboard")
  .addStringOption((opt) =>
    opt
      .setName("period")
      .setDescription("Time period")
      .addChoices(
        { name: "Today", value: "today" },
        { name: "This Week", value: "week" },
        { name: "All Time", value: "alltime" }
      )
  );

export async function execute(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({ content: "Use this in a server.", ephemeral: true });
    return;
  }

  const period = (interaction.options.getString("period") ?? "today") as
    | "today"
    | "week"
    | "alltime";

  const entries = getLeaderboard(guildId, period, getTodayUTC());
  const guildName = interaction.guild?.name ?? "Server";
  const embed = buildLeaderboardEmbed(entries, period, guildName);

  await interaction.reply({ embeds: [embed] });
}
