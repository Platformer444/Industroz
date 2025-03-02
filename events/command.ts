import { ChatInputCommandInteraction } from "discord.js";

import defineEvent from "../resources/Bot/events.js";

import { Commands } from "../resources/Bot/commands.js";

defineEvent({
    Event: "interactionCreate",
    Name: "Command Handling",
    
    Execute: async (Utils, GameData, interaction: ChatInputCommandInteraction) => {
        if (interaction.isCommand()) await (Commands.filter((Command) => {
            return Command.Name === interaction.command?.name;
        })[0] ?? {
            Execute() {
                console.error(`There is no Command as ${interaction.command?.name}`)
            }
        }).Execute(interaction as ChatInputCommandInteraction, Utils, GameData);
    }
});