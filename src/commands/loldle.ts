import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import {
  getActiveGame,
  getDailyPuzzle,
  setDailyPuzzle,
  completeGame,
  getGuessedChampions,
} from "../database/init";
import {
  getChampion,
  getChampionIds,
  getAllChampions,
  loadChampions,
  addChampionSupplement,
} from "../data/champions";
import { getDailyChampionId } from "../game/daily";
import { getTodayUTC } from "../utils/date";
import { compareGuess } from "../game/classic";
import { buildGuessEmbed, buildGiveUpEmbed } from "../embeds/guess-result";
import { Gender, RangeType } from "../data/types";

export const data = new SlashCommandBuilder()
  .setName("loldle")
  .setDescription("LoLdle game commands")
  .addSubcommand((sub) =>
    sub.setName("status").setDescription("Show your current game state for today")
  )
  .addSubcommand((sub) =>
    sub.setName("giveup").setDescription("Give up on today's puzzle")
  )
  .addSubcommand((sub) =>
    sub
      .setName("refresh")
      .setDescription("Re-fetch champion data from Data Dragon (admin only)")
  )
  .addSubcommand((sub) =>
    sub
      .setName("addchampion")
      .setDescription("Add supplement data for a new champion (admin only)")
      .addStringOption((opt) =>
        opt.setName("id").setDescription("Data Dragon champion ID (e.g., Aatrox)").setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("gender")
          .setDescription("Gender")
          .setRequired(true)
          .addChoices(
            { name: "Male", value: "Male" },
            { name: "Female", value: "Female" },
            { name: "Other", value: "Other" }
          )
      )
      .addStringOption((opt) =>
        opt
          .setName("positions")
          .setDescription("Positions (comma-separated: Top,Jungle,Mid,Bot,Support)")
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("species")
          .setDescription("Species (comma-separated: Human,Yordle,Vastaya, etc.)")
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("rangetype")
          .setDescription("Range type")
          .setRequired(true)
          .addChoices(
            { name: "Melee", value: "Melee" },
            { name: "Ranged", value: "Ranged" }
          )
      )
      .addStringOption((opt) =>
        opt.setName("region").setDescription("Region (e.g., Demacia, Noxus, Ionia)").setRequired(true)
      )
      .addIntegerOption((opt) =>
        opt.setName("releaseyear").setDescription("Release year").setRequired(true)
      )
  );

function getAnswer(): { answerId: string; today: string } | null {
  const today = getTodayUTC();
  let answerId = getDailyPuzzle(today);
  if (!answerId) {
    answerId = getDailyChampionId(today, getChampionIds());
    setDailyPuzzle(today, answerId);
  }
  return { answerId, today };
}

export async function execute(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const sub = interaction.options.getSubcommand();

  if (sub === "status") {
    await handleStatus(interaction);
  } else if (sub === "giveup") {
    await handleGiveUp(interaction);
  } else if (sub === "refresh") {
    await handleRefresh(interaction);
  } else if (sub === "addchampion") {
    await handleAddChampion(interaction);
  }
}

async function handleStatus(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({ content: "Use this in a server.", ephemeral: true });
    return;
  }

  const puzzle = getAnswer();
  if (!puzzle) return;

  const game = getActiveGame(guildId, interaction.user.id, puzzle.today);
  if (!game || game.guess_count === 0) {
    await interaction.reply({
      content: "You haven't started today's LoLdle yet! Use `/guess` to begin.",
      ephemeral: true,
    });
    return;
  }

  if (game.status === "won") {
    const answer = getChampion(puzzle.answerId);
    await interaction.reply({
      content: `You already solved today's LoLdle in **${game.guess_count}** guesses! The answer was **${answer?.name}**.`,
      ephemeral: true,
    });
    return;
  }

  if (game.status === "lost") {
    const answer = getChampion(puzzle.answerId);
    await interaction.reply({
      content: `You gave up on today's LoLdle. The answer was **${answer?.name}**.`,
      ephemeral: true,
    });
    return;
  }

  // Show previous guesses
  const guessedIds = getGuessedChampions(game.id);
  const answer = getChampion(puzzle.answerId)!;
  const embeds = guessedIds.map((id, i) => {
    const guess = getChampion(id)!;
    const feedback = compareGuess(guess, answer);
    return buildGuessEmbed(feedback, i + 1);
  });

  await interaction.reply({
    content: `You've made **${game.guess_count}** guesses so far.`,
    embeds: embeds.slice(-5),
    ephemeral: true,
  });
}

async function handleGiveUp(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({ content: "Use this in a server.", ephemeral: true });
    return;
  }

  const puzzle = getAnswer();
  if (!puzzle) return;

  const game = getActiveGame(guildId, interaction.user.id, puzzle.today);
  if (!game || game.status !== "active") {
    await interaction.reply({
      content: "You don't have an active game today.",
      ephemeral: true,
    });
    return;
  }

  completeGame(game.id, "lost");
  const answer = getChampion(puzzle.answerId)!;
  const embed = buildGiveUpEmbed(answer.name, answer.imageUrl);
  await interaction.reply({ embeds: [embed] });
}

async function handleRefresh(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (
    !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
  ) {
    await interaction.reply({
      content: "Only administrators can use this command.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const { loaded, missing } = await loadChampions();
  let msg = `Refreshed champion data. **${loaded}** champions loaded.`;
  if (missing.length > 0) {
    msg += `\n\nMissing supplement data for: ${missing.join(", ")}\nUse \`/loldle addchampion\` to add them.`;
  }
  await interaction.editReply({ content: msg });
}

async function handleAddChampion(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (
    !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
  ) {
    await interaction.reply({
      content: "Only administrators can use this command.",
      ephemeral: true,
    });
    return;
  }

  const id = interaction.options.getString("id", true);
  const gender = interaction.options.getString("gender", true) as Gender;
  const positions = interaction.options
    .getString("positions", true)
    .split(",")
    .map((s) => s.trim());
  const species = interaction.options
    .getString("species", true)
    .split(",")
    .map((s) => s.trim());
  const rangeType = interaction.options.getString("rangetype", true) as RangeType;
  const region = interaction.options.getString("region", true);
  const releaseYear = interaction.options.getInteger("releaseyear", true);

  addChampionSupplement(id, {
    gender,
    positions,
    species,
    rangeType,
    region,
    releaseYear,
  });

  // Reload champions to pick up the new data
  const { loaded, missing } = await loadChampions();

  await interaction.reply({
    content: `Added supplement data for **${id}**. ${loaded} champions loaded.${missing.length > 0 ? `\nStill missing: ${missing.join(", ")}` : ""}`,
    ephemeral: true,
  });
}
