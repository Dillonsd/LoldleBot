import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getUserStats } from "../database/init";
import { buildStatsEmbed } from "../embeds/leaderboard";

export const data = new SlashCommandBuilder()
  .setName("stats")
  .setDescription("Show LoLdle stats for a user")
  .addUserOption((opt) =>
    opt.setName("user").setDescription("User to check (defaults to you)")
  );

export async function execute(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const target = interaction.options.getUser("user") ?? interaction.user;
  const stats = getUserStats(target.id);
  const embed = buildStatsEmbed(target.id, stats);

  await interaction.reply({ embeds: [embed] });
}
