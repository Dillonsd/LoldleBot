import { REST, Routes } from "discord.js";
import { config } from "./config";
import { commands } from "./commands/index";

const rest = new REST().setToken(config.token);

async function deploy() {
  const commandData = commands.map((c) => c.data.toJSON());

  console.log(`[Deploy] Registering ${commandData.length} commands...`);

  if (config.guildId) {
    // Guild commands (instant, for development)
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commandData }
    );
    console.log(`[Deploy] Registered guild commands for ${config.guildId}`);
  } else {
    // Global commands (can take up to 1 hour to propagate)
    await rest.put(Routes.applicationCommands(config.clientId), {
      body: commandData,
    });
    console.log("[Deploy] Registered global commands");
  }
}

deploy().catch(console.error);
