import { ClientLogin } from "./resources/Bot/client.js";
import "dotenv/config";
import { ActivityType, GatewayIntentBits } from "discord.js";

await ClientLogin({
    BotToken: process.env.BOT_TOKEN ?? "",
    CommandsDir: '/commands',
    EventsDir: '/events',
    EmojiImagesDir: '../resources/Emoji Images',
    ClientOptions: {
        intents: [
            GatewayIntentBits.Guilds
        ],
        presence: {
            status: "online",
            activities: [{
                name: "/world view",
                type: ActivityType.Playing
            }]
        }
    }
});