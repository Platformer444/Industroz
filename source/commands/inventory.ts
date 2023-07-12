import { WorldClass } from "../database.js";
import { ITEMS } from "../resources/data.js";
import { buildItemEmbed, buildInventoryEmbed } from "../resources/utils.js";
import { CommandBuilder, OptionBuilder } from "../utils/commands.js";

export default function inventory() {
    new CommandBuilder()
    .setName('inventory')
    .setDescription('View and Manage your inventory')
    .addOption(
        new OptionBuilder()
            .setType("String")
            .setName('item')
            .setDescription('The Item you want to view')
            .setAutocomplete(true)
    )
    .setAutocomplete(async function autocomplete(interaction) {
		const focusedOption = interaction.options.getFocused(true);
		let choices = [];

		if (focusedOption.name === 'item') {
            const world = new WorldClass(interaction.user.id);

            const worldJSON = await world.getWorld();

            worldJSON["inventory"].forEach((invItem) => {
                const item = ITEMS.filter((item) => {
                    return item.itemId === invItem.item;
                })[0];

                choices.push(`${item.itemName} x${invItem.quantity}`);
            });
		}

		const filtered = choices.filter((choice) => choice.startsWith(focusedOption.value));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
    })
    .setExecute(async function execute(interaction) {
        const item = interaction.options.getString('item');

        if (item !== null) await interaction.reply(await buildItemEmbed(interaction.user.id, ITEMS.filter((itemFilter) => { return itemFilter.itemName === item.split('x')[0].trim() })[0].itemName.toLowerCase().replace(' ', '_')));
        else await interaction.reply(await buildInventoryEmbed(interaction.user.id, interaction.user.username));
    });
}