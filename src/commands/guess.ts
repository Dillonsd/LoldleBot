import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
} from "discord.js";
import { getAllChampions, getChampion, getChampionIds } from "../data/champions";
import { compareGuess } from "../game/classic";
import { getDailyChampionId } from "../game/daily";
import { getTodayUTC } from "../utils/date";
import {
  getDailyPuzzle,
  setDailyPuzzle,
  getActiveGame,
  createGame,
  addGuess,
  completeGame,
  getGuessedChampions,
} from "../database/init";
import { buildGuessEmbed, buildVictoryEmbed, buildPublicVictoryEmbed } from "../embeds/guess-result";
import { getUserStats } from "../database/init";

export const data = new SlashCommandBuilder()
  .setName("guess")
  .setDescription("Guess a champion in today's LoLdle")
  .addStringOption((opt) =>
    opt
      .setName("champion")
      .setDescription("Champion name")
      .setRequired(true)
      .setAutocomplete(true)
  );

export async function autocomplete(
  interaction: AutocompleteInteraction
): Promise<void> {
  const focused = interaction.options.getFocused().toLowerCase();
  const matches = getAllChampions()
    .filter((c) => c.name.toLowerCase().startsWith(focused))
    .slice(0, 25)
    .map((c) => ({ name: c.name, value: c.id }));
  await interaction.respond(matches);
}

export async function execute(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const championId = interaction.options.getString("champion", true);
  const guildId = interaction.guildId;

  if (!guildId) {
    await interaction.reply({
      content: "This command can only be used in a server.",
      ephemeral: true,
    });
    return;
  }

  const guess = getChampion(championId);
  if (!guess) {
    await interaction.reply({
      content: "Invalid champion. Use the autocomplete to select a champion.",
      ephemeral: true,
    });
    return;
  }

  const today = getTodayUTC();

  // Get or create daily puzzle
  let answerId = getDailyPuzzle(today);
  if (!answerId) {
    answerId = getDailyChampionId(today, getChampionIds());
    setDailyPuzzle(today, answerId);
  }

  const answer = getChampion(answerId);
  if (!answer) {
    await interaction.reply({
      content: "Something went wrong with today's puzzle. Please try again later.",
      ephemeral: true,
    });
    return;
  }

  // Get or create game
  let game = getActiveGame(guildId, interaction.user.id, today);
  if (!game) {
    game = createGame(guildId, interaction.user.id, today);
  }

  if (game.status !== "active") {
    await interaction.reply({
      content:
        game.status === "won"
          ? "You already solved today's LoLdle! Come back tomorrow."
          : "You already gave up on today's LoLdle. Come back tomorrow.",
      ephemeral: true,
    });
    return;
  }

  // Check for duplicate guess
  const previousGuesses = getGuessedChampions(game.id);
  if (previousGuesses.includes(championId)) {
    await interaction.reply({
      content: `You already guessed **${guess.name}**! Try a different champion.`,
      ephemeral: true,
    });
    return;
  }

  // Record guess
  const guessNum = addGuess(game.id, championId);
  const feedback = compareGuess(guess, answer);
  const embed = buildGuessEmbed(feedback, guessNum);

  const isCorrect = championId === answerId;

  if (isCorrect) {
    completeGame(game.id, "won");
    const victoryEmbed = buildVictoryEmbed(answer.name, guessNum, answer.imageUrl);
    await interaction.reply({ embeds: [embed, victoryEmbed], ephemeral: true });

    // Public announcement in the channel
    const stats = getUserStats(interaction.user.id);
    const publicEmbed = buildPublicVictoryEmbed(interaction.user.id, guessNum, stats);
    const channel = interaction.channel;
    if (channel && "send" in channel) {
      await channel.send({ embeds: [publicEmbed] });
    }
  } else {
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
