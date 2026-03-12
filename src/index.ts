import { Client, Events, GatewayIntentBits } from "discord.js";
import { config } from "./config";
import { initDatabase } from "./database/init";
import { loadChampions } from "./data/champions";
import { getCommandMap } from "./commands/index";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const commandMap = getCommandMap();

client.once(Events.ClientReady, (c) => {
  console.log(`[Bot] Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isAutocomplete()) {
    const cmd = commandMap.get(interaction.commandName);
    if (cmd?.autocomplete) {
      try {
        await cmd.autocomplete(interaction);
      } catch (err) {
        console.error(`[Autocomplete] Error in ${interaction.commandName}:`, err);
      }
    }
    return;
  }

  if (interaction.isChatInputCommand()) {
    const cmd = commandMap.get(interaction.commandName);
    if (!cmd) return;

    try {
      await cmd.execute(interaction);
    } catch (err) {
      console.error(`[Command] Error in ${interaction.commandName}:`, err);
      const reply = {
        content: "Something went wrong. Please try again.",
        ephemeral: true,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  }
});

async function main() {
  console.log("[Bot] Starting...");

  initDatabase();

  const { loaded, missing } = await loadChampions();
  if (missing.length > 0) {
    console.warn(
      `[Bot] ${missing.length} champions missing supplement data. They will be excluded from the daily pool.`
    );
  }

  await client.login(config.token);
}

main().catch((err) => {
  console.error("[Bot] Fatal error:", err);
  process.exit(1);
});
