// Epoch date — the first day of the cycle
const EPOCH = "2026-03-13";

function daysSinceEpoch(date: string): number {
  const d = new Date(date + "T00:00:00Z");
  const e = new Date(EPOCH + "T00:00:00Z");
  return Math.floor((d.getTime() - e.getTime()) / (1000 * 60 * 60 * 24));
}

// Simple seeded PRNG (mulberry32)
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle with seeded RNG
function seededShuffle(arr: string[], seed: number): string[] {
  const result = [...arr];
  const rng = mulberry32(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getDailyChampionId(
  date: string,
  championIds: string[]
): string {
  const sorted = [...championIds].sort();
  const totalDays = daysSinceEpoch(date);

  // Which cycle we're in (each cycle = one full pass through all champions)
  const cycle = Math.floor(totalDays / sorted.length);

  // Position within the current cycle
  const index = ((totalDays % sorted.length) + sorted.length) % sorted.length;

  // Shuffle differently each cycle so the order isn't the same
  const shuffled = seededShuffle(sorted, cycle);
  return shuffled[index];
}
