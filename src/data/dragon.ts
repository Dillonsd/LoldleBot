export interface DragonChampion {
  id: string;
  key: string;
  name: string;
  partype: string;
}

export interface DragonResponse {
  data: Record<string, DragonChampion>;
  version: string;
}

export async function fetchLatestVersion(): Promise<string> {
  const res = await fetch(
    "https://ddragon.leagueoflegends.com/api/versions.json"
  );
  const versions = (await res.json()) as string[];
  return versions[0];
}

export async function fetchChampions(
  version: string
): Promise<{ champions: Record<string, DragonChampion>; version: string }> {
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`
  );
  const data = (await res.json()) as DragonResponse;
  return { champions: data.data, version: data.version };
}

const RESOURCE_NORMALIZATION: Record<string, string> = {
  "": "Manaless",
  None: "Manaless",
  Grit: "Grit",
  Courage: "Courage",
  Ferocity: "Ferocity",
  Heat: "Heat",
  Rage: "Rage",
  Flow: "Flow",
  Shield: "Shield",
  Crimson_Rush: "Crimson Rush",
  Bloodthirst: "Bloodthirst",
  "Blood Well": "Blood Well",
  Fury: "Fury",
  Energy: "Energy",
  Mana: "Mana",
  Health: "Health",
};

export function normalizeResource(partype: string): string {
  return RESOURCE_NORMALIZATION[partype] ?? partype;
}

export function getImageUrl(version: string, championId: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championId}.png`;
}
