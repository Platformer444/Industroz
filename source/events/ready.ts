import { ActivityType } from "discord.js";
import { BotVersion } from "../resources/data.js";
import { getCommands } from "../utils/commands.js";
import { EventBuilder } from "../utils/events.js";
import { updateUserDatabases } from "../database.js";
import "dotenv/config";

export default function ready() {
    new EventBuilder()
    .setName("ready")
    .setOnce(true)
    .setExecute(async function execute(client) {
        await updateUserDatabases();

        client.user.setActivity('/world view', { type: ActivityType.Playing });
        client.application.commands.set(getCommands(process.env.NODE_ENV)[1]);
        console.log(`Logged in as ${client.user.tag} at v${BotVersion}(${process.env.NODE_ENV})`);
    });
}