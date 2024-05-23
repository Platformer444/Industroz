import { AutocompleteInteraction } from "discord.js";

import defineEvent from "../resources/Bot/events.js";
import { Commands } from "../resources/Bot/commands.js";

defineEvent({
    Event: "interactionCreate",
    Name: "AutoComplete Handling",
    Once: false,
    Execute: async (interaction: AutocompleteInteraction) => {
        if (interaction.isAutocomplete()) {
            const FilteredCommand = Commands.filter((Command) => { return Command.Name === interaction.command?.name })[0]
            if (!FilteredCommand) return console.error(`No Command matching the Name ${interaction.command?.name}`);

            const FilteredOption =
                FilteredCommand["Options"]?.filter((Option) => { return Option["Name"] === interaction.options.getFocused(true)["name"]; })[0] ??
                FilteredCommand["SubCommandGroups"]
                    ?.filter((SubCommandGroup) => { return SubCommandGroup["Name"] === interaction.options.getSubcommandGroup(true); })[0]["SubCommands"]
                    .filter((SubCommand) => { return SubCommand["Name"] === interaction.options.getSubcommand(true); })[0]["Options"]
                    ?.filter((Option) => { return Option["Name"] === interaction.options.getFocused(true)["name"]; })[0] ??
                FilteredCommand["SubCommands"]
                    ?.filter((SubCommand) => { return SubCommand["Name"] === interaction.options.getSubcommand(true); })[0]["Options"]
                    ?.filter((Option) => { return Option["Name"] === interaction.options.getFocused(true)["name"]; })[0];

            if (!FilteredOption) return console.error(`No Option matching the Name ${interaction.options.getFocused(true)["name"]}`);

            if (FilteredOption?.Autocomplete instanceof Function) {
                const Choices = await FilteredOption.Autocomplete(interaction)
                interaction.respond(
                    Choices.map((Choice) => {
                        return { name: Choice, value: Choice };
                    })
                );
            }
        }
    }
})