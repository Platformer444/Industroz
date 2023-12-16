import { BotUtils } from "./../resources/utils.js";
import defineCommand from "./../resources/Bot/commands.js";
import { Item, Items } from "./../resources/data.js";

defineCommand({
    Name: 'shop',
    Description: 'Use the In-Game Shop of Industroz',
    Execute: async (interaction) => {
        return await interaction.reply(BotUtils.BuildListEmbed<Item>(
            Items.filter((Item) => { return Item["BuyingDetails"] }),
            (Item) => {
                return [
                    `${Item["Emoji"]} ${Item["Name"]}`,
                    {
                        Label: Item["Name"],
                        Description: Item["Description"],
                        Emoji: Item["Emoji"]
                    }
                ];
            },
            async (interaction) => {
                await interaction.reply(BotUtils.BuildShopItemEmbed(Items.filter((Item) => { return Item["Name"].replaceAll(' ', '_').toLowerCase() === interaction["values"][0] })[0]["ID"]));
            },
            {
                EmbedTitle: 'Shop',
                Page: 1
            }
        ));
    }
});