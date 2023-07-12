import { EmbedBuilder } from "discord.js";
import { SettingsClass } from "../database.js";
import { SETTINGS } from "../resources/data.js";
import { CommandBuilder, OptionBuilder } from "../utils/commands.js";
import { ActionRowBuilder, ButtonBuilder, SelectMenuBuilder } from "../utils/components.js";

export default function settings() {
    new CommandBuilder()
    .setName('settings')
    .setDescription('Manage Your Industrial World Settings')
    .addOption(
        new OptionBuilder()
            .setType("String")
            .setName('setting')
            .setDescription('The Setting You want to Change')
            .setRequired(true)
            .setAutocomplete(true)
    )
    .setAutocomplete(async function execute(interaction) {
		const focusedOption = interaction.options.getFocused(true);
		let choices = [];

		if (focusedOption.name === 'setting') {
            SETTINGS.forEach((setting) => {
                choices.push(setting.settingName)
            });
		}

		const filtered = choices.filter((choice) => choice.startsWith(focusedOption.value));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
    })
    .setExecute(async function execute(interaction) {
        const settings = new SettingsClass(interaction.user.id);
        const setting = SETTINGS.filter((setting) => {
            return setting.settingName === interaction.options.getString('setting');
        })[0];

        const settingsJSON = await settings.getSettings();

        if (settingsJSON === undefined) {
            await interaction.reply({
                content: 'Looks like You don\'t have an Industrial World yet...',
                ephemeral: true
            });
            return;
        }

        const settingEmbed = new EmbedBuilder()
            .setTitle(setting.settingName)
            .setDescription(setting.settingDescription)
            .addFields({ name: 'Current Value', value: JSON.stringify(settingsJSON[setting.settingId]) })
            .setFooter({ text: setting.type })

        if (setting.type === "Choice") {
            const choicesSelectMenu = new ActionRowBuilder()
                .addComponents(
                    new SelectMenuBuilder()
                        .setType("StringSelect")
                        .setCustomid(`__settingChoicesMenu$${setting.settingId}`)
                        .setPlaceholder(`Select a Choice to Change ${setting.settingName} to...`)
                        .addOptions(...setting.choices.map((choice) => { return { label: choice, value: choice }; }))
                        .setDisabled(!setting.editable)
                );
            
            await interaction.reply({
                embeds: [settingEmbed],
                components: [choicesSelectMenu["actionRow"]]
            });
            return;
        } else {
            const settingValueChangeButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`__settingChangeValue$${setting.settingId}`)
                        .setLabel('Change Value')
                        .setDisabled(!setting.editable)
                        .setStyle("Success")
                );

            await interaction.reply({
                embeds: [settingEmbed],
                components: [settingValueChangeButton["actionRow"]]
            });
            return;
        }
    });
}