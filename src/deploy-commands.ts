import { REST, Routes } from "discord.js";
import { config } from "./config";
import { commands } from "./commands/index";

const rest = new REST().setToken(config.token);

async function deploy() {
  const clear = process.argv.includes("--clear");
  const commandData = clear ? [] : commands.map((c) => c.data.toJSON());

  if (clear) {
    console.log("[Deploy] Clearing commands...");
  } else {
    console.log(`[Deploy] Registering ${commandData.length} commands...`);
  }

  if (config.guildId) {
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commandData }
    );
    console.log(`[Deploy] ${clear ? "Cleared" : "Registered"} guild commands for ${config.guildId}`);
  } else {
    await rest.put(Routes.applicationCommands(config.clientId), {
      body: commandData,
    });
    console.log(`[Deploy] ${clear ? "Cleared" : "Registered"} global commands`);
  }
}

deploy().catch(console.error);
