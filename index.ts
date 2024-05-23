import { ActivityType, GatewayIntentBits } from "discord.js";

import { ClientLogin } from "./resources/Bot/client.js";

import "dotenv/config";

await ClientLogin({
    BotToken: process.env.BOT_TOKEN ?? "",
    CommandsDir: '/commands',
    EventsDir: '/events',
    ClientOptions: {
        intents: [
            GatewayIntentBits.Guilds
        ],
        presence: {
            status: "online",
            activities: [{
                name: "Making Ever-Growing Industries!",
                type: ActivityType.Custom
            }]
        }
    }
});