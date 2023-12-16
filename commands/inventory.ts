import { Items } from "./../resources/data.js";
import defineCommand from "../resources/Bot/commands.js";
import { BotUtils } from "./../resources/utils.js";
import { World, WorldDatabase } from "./world.js";
import { BaseInteraction } from "discord.js";

export default function InventoryList(interaction: BaseInteraction, Inventory: World["Inventory"]) {
    return BotUtils.BuildListEmbed<World["Inventory"][0]>(
        Inventory,
        (Item) => {
            const item = Items.filter((item) => { return item["ID"] === Item["Item"] })[0];
            return [
                `${item["Emoji"]} ${Item["Quantity"] > 1 ? BotUtils.Plural(item["Name"]) : item["Name"]} ×${Item["Quantity"]}`,
                {
                    Label: `${Item["Quantity"] > 1 ? BotUtils.Plural(item["Name"]) : item["Name"]}(×${Item["Quantity"]})`,
                    Description: item["Description"],
                    Emoji: item["Emoji"]
                }
            ];
        },
        async (interaction) => {
            const Item = Items.filter((Item) => { return Item["Name"].replaceAll(' ', '_').toLowerCase() === BotUtils.Singular(interaction["values"][0].split('(')[0]) })[0];
            return await interaction.update(BotUtils.BuildInventoryItemEmbed(Item["ID"], parseInt(interaction["values"][0].split('(')[1].replace('×', '').replace(')', ''))));
        },
        {
            EmbedTitle: `${interaction.user.displayName}'s Inventory`,
            Page: 1
        }
    )
}

defineCommand({
    Name: 'inventory',
    Description: 'Manage Your Industrial Inventory',
    Options: [
        {
            Type: "String",
            Name: 'item',
            Description: 'The Item You Want to View',
            Autocomplete: async (interaction) => {
                return (await WorldDatabase.Get(interaction["user"]["id"]))["Inventory"].map((Item) => {
                    const item = Items.filter((item) => { return item["ID"] === Item["Item"] })[0];
                    return `${BotUtils.Plural(item["Name"])} (×${Item["Quantity"]})`
                });
            }
        }
    ],
    Execute: async (interaction) => {
        let Item = interaction["options"].getString('item');
        const World = (await WorldDatabase.Get(interaction["user"]["id"]));

        if (!World) return await interaction.reply({
            content: 'You don\'t have an Industrial World yet!',
            ephemeral: true
        });

        if (!Item) {
            if (World["Inventory"]["length"] === 0) return await interaction.reply({
                content:`Your Inventory is Empty!`,
                ephemeral: true
            });
            else return await interaction.reply(InventoryList(interaction, World["Inventory"]));
        }
        else {
            const item = Items.filter((item) => { return item["Name"] === BotUtils.Singular((Item as string).split(' ')[0]) })[0];
            return await interaction.reply(BotUtils.BuildInventoryItemEmbed(item["ID"], parseInt(Item.split('(')[1].replace('×', '').replace(')', ''))));
        }
    }
});