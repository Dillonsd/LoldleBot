import path from "path";
import fs from "fs";
import { Champion, ChampionSupplement } from "./types";
import {
  fetchLatestVersion,
  fetchChampions,
  normalizeResource,
  getImageUrl,
} from "./dragon";

let champions: Map<string, Champion> = new Map();
let dataVersion: string = "";

function loadSupplements(): Record<string, ChampionSupplement> {
  const filePath = path.join(
    __dirname,
    "..",
    "..",
    "data",
    "champion-supplements.json"
  );
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function saveSupplements(
  supplements: Record<string, ChampionSupplement>
): void {
  const filePath = path.join(
    __dirname,
    "..",
    "..",
    "data",
    "champion-supplements.json"
  );
  fs.writeFileSync(filePath, JSON.stringify(supplements, null, 2), "utf-8");
}

export async function loadChampions(): Promise<{
  loaded: number;
  missing: string[];
}> {
  const version = await fetchLatestVersion();
  const { champions: dragonChamps, version: ver } =
    await fetchChampions(version);
  dataVersion = ver;

  const supplements = loadSupplements();
  const newMap = new Map<string, Champion>();
  const missing: string[] = [];

  for (const [id, dragon] of Object.entries(dragonChamps)) {
    const supplement = supplements[id];
    if (!supplement) {
      missing.push(dragon.name);
      continue;
    }

    newMap.set(id, {
      id,
      name: dragon.name,
      key: parseInt(dragon.key, 10),
      gender: supplement.gender,
      positions: supplement.positions,
      species: supplement.species,
      rangeType: supplement.rangeType,
      region: supplement.region,
      resource: normalizeResource(dragon.partype),
      releaseYear: supplement.releaseYear,
      imageUrl: getImageUrl(ver, id),
    });
  }

  champions = newMap;

  if (missing.length > 0) {
    console.warn(
      `[Champions] Missing supplement data for: ${missing.join(", ")}`
    );
  }
  console.log(
    `[Champions] Loaded ${newMap.size} champions (Data Dragon v${ver})`
  );

  return { loaded: newMap.size, missing };
}

export function getChampion(id: string): Champion | undefined {
  return champions.get(id);
}

export function getChampionByName(name: string): Champion | undefined {
  const lower = name.toLowerCase();
  for (const champ of champions.values()) {
    if (champ.name.toLowerCase() === lower) {
      return champ;
    }
  }
  return undefined;
}

export function getAllChampions(): Champion[] {
  return Array.from(champions.values());
}

export function getChampionIds(): string[] {
  return Array.from(champions.keys());
}

export function getDataVersion(): string {
  return dataVersion;
}

export function addChampionSupplement(
  id: string,
  supplement: ChampionSupplement
): void {
  const supplements = loadSupplements();
  supplements[id] = supplement;
  saveSupplements(supplements);
}
