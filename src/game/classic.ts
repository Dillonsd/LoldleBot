import { Champion, ClassicFeedback, MatchResult } from "../data/types";

function compareArrays(guess: string[], answer: string[]): MatchResult {
  const guessSet = new Set(guess.map((s) => s.toLowerCase()));
  const answerSet = new Set(answer.map((s) => s.toLowerCase()));

  if (
    guessSet.size === answerSet.size &&
    [...guessSet].every((v) => answerSet.has(v))
  ) {
    return "correct";
  }

  for (const v of guessSet) {
    if (answerSet.has(v)) return "partial";
  }

  return "incorrect";
}

function compareString(guess: string, answer: string): MatchResult {
  return guess.toLowerCase() === answer.toLowerCase()
    ? "correct"
    : "incorrect";
}

function compareYear(guess: number, answer: number): MatchResult {
  if (guess === answer) return "correct";
  return guess < answer ? "higher" : "lower";
}

export function compareGuess(
  guess: Champion,
  answer: Champion
): ClassicFeedback {
  return {
    champion: guess,
    gender: compareString(guess.gender, answer.gender),
    positions: compareArrays(guess.positions, answer.positions),
    species: compareArrays(guess.species, answer.species),
    rangeType: compareString(guess.rangeType, answer.rangeType),
    region: compareString(guess.region, answer.region),
    resource: compareString(guess.resource, answer.resource),
    releaseYear: compareYear(guess.releaseYear, answer.releaseYear),
  };
}
