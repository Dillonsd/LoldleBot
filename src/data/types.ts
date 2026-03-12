export type Gender = "Male" | "Female" | "Other";
export type RangeType = "Melee" | "Ranged";

export interface Champion {
  id: string;
  name: string;
  key: number;
  gender: Gender;
  positions: string[];
  species: string[];
  rangeType: RangeType;
  region: string;
  resource: string;
  releaseYear: number;
  imageUrl: string;
}

export interface ChampionSupplement {
  gender: Gender;
  positions: string[];
  species: string[];
  rangeType: RangeType;
  region: string;
  releaseYear: number;
}

export type MatchResult =
  | "correct"
  | "partial"
  | "incorrect"
  | "higher"
  | "lower";

export interface ClassicFeedback {
  champion: Champion;
  gender: MatchResult;
  positions: MatchResult;
  species: MatchResult;
  rangeType: MatchResult;
  region: MatchResult;
  resource: MatchResult;
  releaseYear: MatchResult;
}
