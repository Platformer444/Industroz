import { BaseInteraction, InteractionReplyOptions, InteractionUpdateOptions } from "discord.js";

import { SETTINGS, Setting } from "./../resources/data.js";
import defineCommand from "./../resources/Bot/commands.js";
import DataBase from "./../resources/database.js";
import { BotUtils } from "../resources/Utilities.js";

export interface Settings {
    Visibility: "Public" | "Private" | string,
    DisplayName: string
};

export const SettingsDatabase: DataBase<Settings> = new DataBase('Settings');

export async function SettingsList(interaction: BaseInteraction, Settings: Settings): Promise<InteractionReplyOptions & InteractionUpdateOptions> {
    return await BotUtils.BuildListEmbed<Setting>(
        SETTINGS,
        (Item) => {
            return [
                `${Item["Emoji"]} ${Item["Name"]}: ${Settings[Item["Name"]]}`,
                { Label: Item["Name"], Description: Settings[Item["Name"]], Emoji: Item["Emoji"] }
            ];
        },
        async (interaction) => {
            const Setting = SETTINGS.filter((Setting) => { return Setting["Name"].replaceAll(' ', '_').toLowerCase() === interaction.values[0] })[0]
            await interaction.update(BotUtils.BuildSettingEmbed(Setting["Name"], Settings[Setting["Name"]]));
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
    Execute: async (interaction) => {
        const UserSettings = await SettingsDatabase.Get(interaction.user.id);
        return interaction.reply(await SettingsList(interaction, UserSettings));
    }
});