import { ITEMS, Item } from "../resources/data.js";
import { buildListEmbed } from "../resources/utils.js";
import { CommandBuilder } from "../utils/commands.js";

export default function shop() {
    new CommandBuilder()
        .setName('shop')
        .setDescription('Access the in-game Shop to Buy any Item You want')
        .setExecute(async function execute(interaction) {
            await interaction.reply(buildListEmbed<Item[]>(
                ITEMS.filter((item) => { return item.buyingDetails !== undefined }),
                (List, Index) => {
                    const item = ITEMS.filter((item) => {
                        return item.itemId === List[Index].itemId;
                    })[0];
                    const buyingItem = ITEMS.filter((buyingItem) => {
                        return buyingItem.itemId === item.buyingDetails.item;
                    })[0];

                    return [
                        `${item.emoji}${item.itemName} x1 (Price: ${buyingItem.emoji}${buyingItem.itemName} x${item.buyingDetails.amount})\n`,
                        { label: `${item.itemName} x1`, value: item.itemName.toLowerCase().replace(' ', '_'), emoji: item.emoji, description: `${buyingItem.emoji}x${item.buyingDetails.amount}` }
                    ]
                },
                1,
                {
                    CustomIDPrefix: 'shop',
                    EmbedTitle: '🛒 Shop',
                    SelectMenuPlaceholder: 'Select an Item to Buy...'
                }
            ));
        });
}