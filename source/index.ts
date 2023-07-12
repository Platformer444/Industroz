import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";
import { getEvents } from "./utils/events.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "url"

const client = new Client<true>({
    intents: [GatewayIntentBits.Guilds]
});

console.log('Define Events\n');

const eventsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), 'events');
const eventFiles = fs.readdirSync(eventsFolder);
for (const eventFile of eventFiles) (await import(pathToFileURL(path.join(eventsFolder, eventFile)).toString())).default();

console.log('Events Defined!\n\n');
console.log('Define Commands\n');

const commandsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), 'commands');
const commandFiles = fs.readdirSync(commandsFolder);
for (const commandFile of commandFiles) (await import(pathToFileURL(path.join(commandsFolder, commandFile)).toString())).default();

console.log('Comands Defined!\n\n');

const events = getEvents();

for (const event of events) {
    if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.login(process.env.BOT_TOKEN);