import { ClientEvents } from "discord.js"
import chalk from "chalk";

import { client } from "./client.js";

interface Event {
    Name: string,
    Event: keyof ClientEvents,
    Execute: Function
};

export const Events: Event[] = [];

export default function defineEvent(Event: Event) {
    const ExistingEvent = Events.filter((_Event) => {
            return _Event["Name"] === Event["Name"];
    })[0] === undefined;

    if (ExistingEvent) {
        Events.push(Event);
        console.log(chalk.blueBright(`\tEvent ${chalk.cyanBright(Event["Name"])} Defined!\n`));

        if (client) client.on(Event["Event"], async (...args) => { await Event.Execute(...args); });
    }
}