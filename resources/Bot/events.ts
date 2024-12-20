import { AnySelectMenuInteraction, ButtonInteraction, ClientEvents, Interaction } from "discord.js"
import chalk from "chalk";

import { client } from "./client.js";
import { Utils } from "./../Utilities.js";

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

        if (client) client.on(Event["Event"], async (...args: any[]) => {
            let Run = true;

            if (Event["Event"] === "interactionCreate") {
                const interaction = args[0] as (ButtonInteraction | AnySelectMenuInteraction);

                if (!interaction.replied) if (interaction.type === 3) Run = await Utils.InteractionUserCheck(interaction);                
            }

            if (Run) await Event.Execute(...args, );
        });
    }
}