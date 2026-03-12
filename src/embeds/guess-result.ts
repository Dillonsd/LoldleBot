import { EmbedBuilder } from "discord.js";
import { ClassicFeedback, MatchResult } from "../data/types";
import { CORRECT, PARTIAL, INCORRECT, HIGHER, LOWER } from "../utils/emoji";

function emoji(result: MatchResult): string {
  switch (result) {
    case "correct":
      return CORRECT;
    case "partial":
      return PARTIAL;
    case "incorrect":
      return INCORRECT;
    case "higher":
      return HIGHER;
    case "lower":
      return LOWER;
  }
}

function field(
  label: string,
  value: string,
  result: MatchResult
): { name: string; value: string; inline: boolean } {
  return { name: `${emoji(result)} ${label}`, value, inline: true };
}

function isAllCorrect(feedback: ClassicFeedback): boolean {
  return (
    feedback.gender === "correct" &&
    feedback.positions === "correct" &&
    feedback.species === "correct" &&
    feedback.rangeType === "correct" &&
    feedback.region === "correct" &&
    feedback.resource === "correct" &&
    feedback.releaseYear === "correct"
  );
}

export function buildGuessEmbed(
  feedback: ClassicFeedback,
  guessNum: number
): EmbedBuilder {
  const c = feedback.champion;

  const yearLabel =
    feedback.releaseYear === "higher"
      ? "Year (too low)"
      : feedback.releaseYear === "lower"
        ? "Year (too high)"
        : "Year";

  return new EmbedBuilder()
    .setTitle(`Guess #${guessNum} — ${c.name}`)
    .setThumbnail(c.imageUrl)
    .addFields(
      field("Gender", c.gender, feedback.gender),
      field("Position", c.positions.join(", "), feedback.positions),
      field("Species", c.species.join(", "), feedback.species),
      field("Range", c.rangeType, feedback.rangeType),
      field("Region", c.region, feedback.region),
      field("Resource", c.resource, feedback.resource),
      field(yearLabel, `${c.releaseYear}`, feedback.releaseYear)
    )
    .setColor(isAllCorrect(feedback) ? 0x00ff00 : 0xff4444);
}

export function buildVictoryEmbed(
  championName: string,
  guessCount: number,
  imageUrl: string
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("You got it!")
    .setDescription(
      `The answer was **${championName}**!\nYou guessed it in **${guessCount}** ${guessCount === 1 ? "guess" : "guesses"}.`
    )
    .setThumbnail(imageUrl)
    .setColor(0x00ff00);
}

export function buildPublicVictoryEmbed(
  userId: string,
  guessCount: number,
  stats: { wins: number; current_streak: number; avg_guesses: number }
): EmbedBuilder {
  const lines = [
    `<@${userId}> solved today's LoLdle in **${guessCount}** ${guessCount === 1 ? "guess" : "guesses"}!`,
    "",
    `**${stats.wins}** lifetime wins | **${stats.current_streak}** win streak | avg **${stats.avg_guesses}** guesses`,
  ];

  return new EmbedBuilder()
    .setTitle("\u{1F3C6} LoLdle Solved!")
    .setDescription(lines.join("\n"))
    .setColor(0xffd700);
}

export function buildGiveUpEmbed(
  championName: string,
  imageUrl: string
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("Better luck tomorrow!")
    .setDescription(`The answer was **${championName}**.`)
    .setThumbnail(imageUrl)
    .setColor(0xff4444);
}
