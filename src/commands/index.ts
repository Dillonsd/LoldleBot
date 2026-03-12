import {
  ChatInputCommandInteraction,
  AutocompleteInteraction,
} from "discord.js";
import * as guess from "./guess";
import * as loldle from "./loldle";
import * as leaderboard from "./leaderboard";
import * as stats from "./stats";

interface Command {
  data: { name: string; toJSON: () => unknown };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

export const commands: Command[] = [guess, loldle, leaderboard, stats];

export function getCommandMap(): Map<string, Command> {
  const map = new Map<string, Command>();
  for (const cmd of commands) {
    map.set(cmd.data.name, cmd);
  }
  return map;
}
