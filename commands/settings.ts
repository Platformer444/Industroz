import { BaseInteraction, InteractionReplyOptions, InteractionUpdateOptions } from "discord.js";

import { SETTINGS, Setting } from "../resources/Data.js";
import defineCommand from "./../resources/Bot/commands.js";
import DataBase from "../resources/Database.js";
import { Utils } from "../resources/Utilities.js";

export interface Settings {
    Visibility: "Public" | "Private" | string,
    DisplayName: string
};

export const SettingsDatabase: DataBase<Settings> = new DataBase('Settings');

export function SettingsList(interaction: BaseInteraction, Settings: Settings): InteractionReplyOptions & InteractionUpdateOptions {
    return Utils.BuildListEmbed<Setting>(
        SETTINGS,
        (Item) => {
            return [
                `${Item["Emoji"]} ${Item["Name"]}: ${Settings[Item["Name"]]}`,
                { Label: Item["Name"], Description: Settings[Item["Name"]], Emoji: Item["Emoji"] }
            ];
        },
        async (interaction) => {
            const Setting = SETTINGS.filter((Setting) => { return Setting["Name"].replaceAll(' ', '_').toLowerCase() === interaction.values[0] })[0]
            await interaction.update(Utils.BuildSettingEmbed(Setting["Name"], Settings[Setting["Name"]]));
        },
        {
            Title: `${Settings["DisplayName"]}'s Settings`,
            Page: 1
        }
    );
}

defineCommand({
    Name: 'settings',
    Description: 'Manage Your Industrial World Settings',
    Options: [
        {
            Type: "String",
            Name: 'setting',
            Description: 'The Setting You want to View',
            Autocomplete: async (interaction) => {
                const Settings = await SettingsDatabase.Get(interaction.user.id);
                return SETTINGS.map((Setting, Index) => { return { Name: `${Setting["Name"]}: ${Settings[Setting["Name"]]}`, Value: String(Index) } });
            },
        }
    ],
    Execute: async (interaction) => {
        const Setting = parseInt(interaction.options.getString('setting') ?? "");
        const UserSettings = await SettingsDatabase.Get(interaction.user.id);

        if (!Setting) return await interaction.reply(SettingsList(interaction, UserSettings));
        else {
            if (!SETTINGS[Setting]) return await interaction.reply({
                content: `The Specified Setting ${Setting} is Invalid!`,
                ephemeral: true
            });
            else return await interaction.reply(Utils.BuildSettingEmbed(SETTINGS[Setting]["Name"], UserSettings[SETTINGS[Setting]["Name"]]));
        }
    }
});