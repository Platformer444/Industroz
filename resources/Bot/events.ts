import chalk from "chalk";
import { ClientEvents } from "discord.js"
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

        client.on(Event["Event"], async (...args) => await Event.Execute(...args));

        if (Event["EndTime"]) setTimeout(() => { console.log('Hello'); client.off(Event["Event"], async (...args) => await Event.Execute(...args)) }, Event["EndTime"]);
    }
}