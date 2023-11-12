import { Items } from "./../resources/data.js";
import defineCommand from "../resources/Bot/commands.js";
import { BotUtils } from "./../resources/utils.js";
import { World, WorldDatabase } from "./world.js";

await defineCommand({
    Name: 'inventory',
    Description: 'Manage Your Industrial Inventory',
    Execute: async (interaction) => {
        const Inventory = (await WorldDatabase.Get(interaction.user.id))["Inventory"];

        await interaction.reply(BotUtils.BuildListEmbed<World["Inventory"][0]>(
            Inventory,
            (Item) => {
                const item = Items.filter((item) => { return item["ID"] === Item["Item"] })[0];
                return [
                    `${item["Emoji"]} ${item["Name"]} x${Item["Quantity"]}`,
                    {
                        Label: `${item["Name"]}(x${Item["Quantity"]})`,
                        Emoji: item["Emoji"]
                    }
                ];
            },
            async (interaction) => {
                const Item = Items.filter((Item) => { return Item["Name"].replaceAll(' ', '_').toLowerCase() === interaction["values"][0].split('(')[0]; })[0];
                await interaction.update(BotUtils.BuildInvenotryItemEmbed(Item["ID"], parseInt(interaction["values"][0].split('x')[1].replace(')', ''))));
            },
            {
                EmbedTitle: `${interaction.user.displayName}'s Inventory`,
                Page: 1
            }
        ));
    }
});