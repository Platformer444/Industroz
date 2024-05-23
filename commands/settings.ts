import { SETTINGS, Setting } from "./../resources/data.js";
import defineCommand from "./../resources/Bot/commands.js";
import DataBase from "./../resources/database.js";
import { BotUtils } from "./../resources/utils.js";

export interface Settings {
    Visibility: "Public" | "Private" | string
};

export const SettingsDatabase: DataBase<Settings> = new DataBase('Settings');

defineCommand({
    Name: 'settings',
    Description: 'Manage Your Industrial World Settings',
    Execute: async (interaction) => {
        const UserSettings = await SettingsDatabase.Get(interaction["user"]["id"]);

        return await interaction.reply(BotUtils.BuildListEmbed<Setting>(
            SETTINGS,
            (Item) => {
                return [
                    `${Item["Emoji"]} ${Item["Name"]}: ${UserSettings[Item["Name"]]}`,
                    { Label: Item["Name"], Description: UserSettings[Item["Name"]], Emoji: Item["Emoji"] }
                ];
            },
            async (interaction) => {
                const Setting = SETTINGS.filter((Setting) => { return Setting["Name"].replaceAll(' ', '_').toLowerCase() === interaction.values[0] })[0]

                await interaction.reply(BotUtils.BuildSettingEmbed(Setting["Name"], UserSettings[Setting["Name"]]));
            },
            {
                Title: `${interaction["user"]["username"]}'s Settings`,
                Page: 1
            }
        ));
    }
});