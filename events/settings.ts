import { ButtonInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from "discord.js";

import defineEvent from "./../resources/Bot/events.js";
import { SettingsDatabase } from "./../commands/settings.js";
import { SETTINGS } from "./../resources/data.js";
import { defineComponents, defineModal } from "./../resources/Bot/components.js";

defineEvent({
    Event: "interactionCreate",
    Name: 'Settings Button Interaction',
    Once: false,
    Execute: async (interaction: ButtonInteraction) => {
        if (interaction.isButton()) {
            const CustomID = interaction["customId"].split('$')[0];
            const Data = JSON.parse(interaction["customId"].split('$')[1]);

            if (CustomID === 'UpdateSettingCustom') {
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
    Once: false,
    Execute: async (interaction: StringSelectMenuInteraction) => {
        if (interaction.isStringSelectMenu()) {
            const CustomID = interaction["customId"].split('$')[0];
            const Data = JSON.parse(interaction["customId"].split('$')[1]);

            if (CustomID === 'UpdateSettingChoice') {
                const UserSettings = await SettingsDatabase.Get(interaction["user"]["id"]);
                const Setting = SETTINGS.filter((Setting) => { return Setting["Name"] === Data["Setting"] })[0];

                UserSettings[Setting["Name"]] = (Setting["Choices"] as string[])[Number(interaction.values[0])];

                await SettingsDatabase.Set(interaction["user"]["id"], UserSettings);
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
    Once: false,
    Execute: async (interaction: ModalSubmitInteraction) => {
        if (interaction.isModalSubmit()) {
            const CustomID = interaction["customId"].split('$')[0];
            const Data = JSON.parse(interaction["customId"].split('$')[1]);

            if (CustomID === 'EditSettingCustom') {
                
            }
        }
    }
});