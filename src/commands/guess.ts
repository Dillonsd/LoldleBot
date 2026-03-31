import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
} from "discord.js";
import { getAllChampions, getChampion, getChampionIds } from "../data/champions";
import { Champion, Gender, RangeType } from "../data/types";
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
  isUserTrolled,
} from "../database/init";
import { buildGuessEmbed, buildVictoryEmbed, buildPublicVictoryEmbed } from "../embeds/guess-result";
import { getUserStats } from "../database/init";

function isAllCorrect(champion: Champion, answer: Champion): boolean {
  const sameArrays = (a: string[], b: string[]) => {
    const sa = new Set(a.map((s) => s.toLowerCase()));
    const sb = new Set(b.map((s) => s.toLowerCase()));
    return sa.size === sb.size && [...sa].every((v) => sb.has(v));
  };
  return (
    champion.gender.toLowerCase() === answer.gender.toLowerCase() &&
    champion.rangeType.toLowerCase() === answer.rangeType.toLowerCase() &&
    champion.region.toLowerCase() === answer.region.toLowerCase() &&
    champion.resource.toLowerCase() === answer.resource.toLowerCase() &&
    champion.releaseYear === answer.releaseYear &&
    sameArrays(champion.positions, answer.positions) &&
    sameArrays(champion.species, answer.species)
  );
}

function buildTrollAnswer(answer: Champion, allChampions: Champion[]): Champion {
  const flipGender = (g: Gender): Gender =>
    g === "Male" ? "Female" : g === "Female" ? "Male" : "Female";
  const flipRange = (r: RangeType): RangeType =>
    r === "Melee" ? "Ranged" : "Melee";
  const shiftYear = (y: number) => (y > 2015 ? y - 2 : y + 2);

  let fake: Champion = {
    ...answer,
    gender: flipGender(answer.gender),
    releaseYear: shiftYear(answer.releaseYear),
  };

  // Ensure no real champion would show all-correct against this fake answer
  if (allChampions.some((c) => isAllCorrect(c, fake))) {
    fake = { ...fake, rangeType: flipRange(fake.rangeType) };
  }

  return fake;
}

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

  // Troll logic: same feedback as real answer except year is shifted so they can never win
  const trolled = isUserTrolled(interaction.user.id);
  const effectiveAnswer = trolled
    ? buildTrollAnswer(answer, getAllChampions())
    : answer;

  // Record guess
  const guessNum = addGuess(game.id, championId);
  const feedback = compareGuess(guess, effectiveAnswer);
  const embed = buildGuessEmbed(feedback, guessNum);

  const isCorrect = !trolled && championId === answerId;

  if (isCorrect) {
    completeGame(game.id, "won");
    const victoryEmbed = buildVictoryEmbed(answer.name, guessNum, answer.imageUrl);
    await interaction.reply({ embeds: [embed, victoryEmbed], ephemeral: true });

    // Public announcement in the channel
    const stats = getUserStats(guildId, interaction.user.id);
    const publicEmbed = buildPublicVictoryEmbed(interaction.user.id, guessNum, stats);
    const channel = interaction.channel;
    if (channel && "send" in channel) {
      await channel.send({ embeds: [publicEmbed] });
    }
  } else {
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
