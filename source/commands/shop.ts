import { buildShopEmbed } from "../resources/utils.js";
import { CommandBuilder } from "../utils/commands.js";

export default function shop() {
    new CommandBuilder()
        .setName('shop')
        .setDescription('Access the in-game Shop to Buy any Item You want')
        .setExecute(async function execute(interaction) {
            await interaction.reply(buildShopEmbed(1));
        });
}