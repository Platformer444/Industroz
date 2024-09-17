import { ClientEvents } from "discord.js"
import chalk from "chalk";

import { client } from "./client.js";

interface Event {
    Name: string,
    Event: keyof ClientEvents,
    EndTime?: number,
    Execute: Function
}

export const Events: Event[] = []

export default function defineEvent(Event: Event) {
    if (!(Events.filter((event) => { return event["Name"] === Event["Name"] })[0])) {
        Events.push(Event);
        console.log(chalk.blueBright(`\tEvent ${chalk.cyanBright(Event["Name"])} Defined!\n`));
    }
}