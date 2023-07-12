import { ButtonBuilder, ActionRowBuilder } from "../utils/components.js";
import { WorldClass } from "../database.js";
import { buildHomeScreen } from "../resources/utils.js";
import { CommandBuilder, OptionBuilder, SubCommandBuilder } from "../utils/commands.js";


export default function world() {
    new CommandBuilder()
    .setName('world')
    .setDescription('Manage Your Industrial World')
    .addSubCommand(
        new SubCommandBuilder()
            .setName('create')
            .setDescription('Create a new Industrial World or Reset Your current one')
            .addOption(
                new OptionBuilder()
                    .setType("String")
                    .setName('visibility')
                    .setDescription('Make Your Industrial World either Public or Private')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Public', value: 'Public' },
                        { name: 'Private', value: 'Private' }
                    )
            )
    )
    .addSubCommand(
        new SubCommandBuilder()
            .setName('view')
            .setDescription('View Your or Someone Else\'s Industrial World')
            .addOption(
                new OptionBuilder()
                    .setType("String")
                    .setName('island')
                    .setDescription('The Island You want to View(defaults to 1)')
                    .setAutocomplete(true)
            )
            .addOption(
                new OptionBuilder()
                    .setType("User")
                    .setName('user')
                    .setDescription('User whose World You want to View')
            )
    )
    .setAutocomplete(async function autocomplete(interaction) {
		const focusedOption = interaction.options.getFocused(true);
		let choices: string[] = [];

		if (focusedOption.name === 'island') {
            const world = new WorldClass(interaction.user.id);

            const worldJSON = await world.getWorld();

            worldJSON["worldArray"].forEach((island) => {
                choices.push(`Island ${worldJSON["worldArray"].indexOf(island) + 1}`);
            });
		}

		const filtered = choices.filter((choice) => choice.startsWith(focusedOption.value));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
    })
    .setExecute(async function execute(interaction) {
        if (interaction.options.getSubcommand() === 'create') {
            const world = new WorldClass(interaction.user.id);
            const worldExists = await world.getWorld() !== undefined;

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('__worldCreationCancel')
                        .setLabel('Cancel')
                        .setStyle("Danger"),
                    new ButtonBuilder()
                        .setCustomId(`__worldCreationConfirm$${JSON.stringify({ worldExists: worldExists, visibility: interaction.options.getString('visibility') })}`)
                        .setLabel('Confirm')
                        .setStyle("Primary")
                );

            await interaction.reply({
                content: worldExists ? 'Are You sure Resetting Your Current Industrial World?' : 'Are You sure Creating a New Industrial World?',
                components: [buttons["actionRow"]],
                ephemeral: interaction.options.getString('visibility') === 'Private'
            });
        } else if (interaction.options.getSubcommand() === 'view') {
            const island: number = interaction.options.getString('island') !== null ? Number(interaction.options.getString('island').replace('Island ', '')) : 1;
            let user = interaction.options.getUser('user') || interaction.user.id;

            if (user.bot) {
                await interaction.reply({
                    content: 'Bots can\'t make Worlds!',
                    ephemeral: true
                });
                return;
            } else if (user.id !== undefined) user = user.id;

            await interaction.reply(await buildHomeScreen(user, interaction.user.id, island));
        }
    })
    .defineCommand();
}