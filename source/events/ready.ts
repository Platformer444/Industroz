import { ActivityType } from "discord.js";
import { BotVersion } from "../resources/data.js";
import { registerCommands } from "../utils/commands.js";
import { EventBuilder } from "../utils/events.js";

export default function ready() {
    new EventBuilder()
    .setName("ready")
    .setOnce(true)
    .setExecute(async function execute(client) {
        await registerCommands();

        client.user.setActivity('/world view', { type: ActivityType.Playing });
        console.log(`Logged in as ${client.user.tag} at v${BotVersion}`);
    })
    .defineEvent();
}