import { ActivityType } from "discord.js";
import { BotVersion } from "../resources/data.js";
import { registerCommands } from "../utils/commands.js";
import { EventBuilder } from "../utils/events.js";
import "dotenv/config";

export default function ready() {
    new EventBuilder()
    .setName("ready")
    .setOnce(true)
    .setExecute(async function execute(client) {
        await registerCommands(process.env.BOT_TOKEN, process.env.CLIENT_ID);

        client.user.setActivity('/world view', { type: ActivityType.Playing });
        console.log(`Logged in as ${client.user.tag} at v${BotVersion}`);
    });
}