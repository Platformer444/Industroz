import { BaseInteraction, ButtonInteraction, InteractionReplyOptions, InteractionUpdateOptions, ModalSubmitInteraction, StringSelectMenuInteraction } from "discord.js";

import defineCommand from "../resources/Bot/commands.js";
import { defineModal, defineComponents } from "./../resources/Bot/components.js";
import defineEvent from "./../resources/Bot/events.js";

import DataBase from "../databases/Database.js";

import { SETTINGS, Setting } from "../resources/Data.js";
import { Utils } from "../resources/Utilities.js";

export interface Settings {
    Visibility: "Public" | "Private" | string,
    DisplayName: string
};

export const SettingsDatabase: DataBase<Settings> = new DataBase('Settings');
await SettingsDatabase.Init();

function SettingsList(interaction: BaseInteraction, Settings: Settings): InteractionReplyOptions & InteractionUpdateOptions {
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

defineEvent({
    Event: "interactionCreate",
    Name: 'Settings Button Interaction',
    
    Execute: async (interaction: ButtonInteraction) => {
        if (interaction.isButton()) {
            const CustomID = interaction.customId.split('$')[0];
            const Data = JSON.parse(interaction.customId.split('$')[1]);

            if (CustomID === 'Settings') {
                const Settings = await SettingsDatabase.Get(interaction.user.id);
                await interaction.update(await SettingsList(interaction, Settings));
            }

            else if (CustomID === 'UpdateSettingCustom') {
                await interaction.showModal(
                    defineModal({
                        Title: 'Edit Setting',
                        CustomID: 'EditSettingCustom',
                        Components: defineComponents(
                            {
                                ComponentType: "TextInput",
                                CustomID: 'SettingValue',
                                Placeholder: 'Enter new Setting Value...',
                                Label: `Change ${Data["Setting"]} to:`,
                                Required: true,
                                TextStyle: "Short",
                            }
                        ),
                        Data: Data
                    })
                );
            }
        }
    }
});

defineEvent({
    Event: "interactionCreate",
    Name: 'Settings SelectMenu Interaction',
    
    Execute: async (interaction: StringSelectMenuInteraction) => {
        if (interaction.isStringSelectMenu()) {
            const CustomID = interaction.customId.split('$')[0];
            const Data = JSON.parse(interaction.customId.split('$')[1]);

            if (CustomID === 'UpdateSettingChoice') {
                const UserSettings = await SettingsDatabase.Get(interaction.user.id);
                const Setting = SETTINGS.filter((Setting) => { return Setting["Name"] === Data["Setting"] })[0];

                UserSettings[Setting["Name"]] = (Setting["Choices"] as string[])[Number(interaction.values[0])];

                await SettingsDatabase.Set(interaction.user.id, UserSettings);
                await interaction.reply({
                    content: `The ${Setting["Name"]} Setting was Succesfully Changed to ${UserSettings[Setting["Name"]]}!`,
                    ephemeral: true
                });
            }
        }
    }
});

defineEvent({
    Event: "interactionCreate",
    Name: 'Settings ModalSubmit Interaction',
    
    Execute: async (interaction: ModalSubmitInteraction) => {
        if (interaction.isModalSubmit()) {
            const CustomID = interaction.customId.split('$')[0];
            const Data = JSON.parse(interaction.customId.split('$')[1]);

            if (CustomID === 'EditSettingCustom') {
                const Settings = await SettingsDatabase.Get(interaction.user.id);
                
                Settings[(Data["Setting"] as Setting["Name"])] = interaction.fields.getTextInputValue('SettingValue${}');
                await SettingsDatabase.Set(interaction.user.id, Settings);
                await interaction.reply({
                    content: `${Data["Setting"]} Setting was Successfully Changed to ${interaction.fields.getTextInputValue('SettingValue${}')}`,
                    ephemeral: true
                });
            }
        }
    }
});