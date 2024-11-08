import { BaseInteraction } from "discord.js";

import defineCommand from "../resources/Bot/commands.js";

import { SettingsDatabase } from "./settings.js";
import { World, WorldDatabase } from "./world.js";

import { GameData } from "../resources/Data.js";
import { Utils } from "../resources/Utilities.js";

export async function InventoryList(interaction: BaseInteraction, Inventory: World["Inventory"]) {
    const Settings = await SettingsDatabase.Get(interaction.user.id);

    return Utils.BuildListEmbed<World["Inventory"][0]>(
        Inventory,
        (Item) => {
            const item = GameData.Items.filter((item) => { return item["ID"] === Item["Item"] })[0];
            return [
                `${item["Emoji"]} ${Item["Quantity"] > 1 ? Utils.Plural(item["Name"]) : item["Name"]} ×${Item["Quantity"]}`,
                {
                    Label: `${Item["Quantity"] > 1 ? Utils.Plural(item["Name"]) : item["Name"]}(×${Item["Quantity"]})`,
                    Description: item["Description"],
                    Emoji: item["Emoji"]
                }
            ];
        },
        async (interaction) => {
            const Item = GameData.Items.filter((Item) => { return Item["Name"].replaceAll(' ', '_').toLowerCase() === Utils.Singular(interaction.values[0].split('(')[0]) })[0];
            return await interaction.update(await Utils.BuildInventoryItemEmbed(interaction.user.id, Item["ID"], parseInt(interaction.values[0].split('(')[1].replace('×', '').replace(')', ''))));
        },
        {
            Title: `${Settings["DisplayName"]}'s Inventory`,
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
                const World = await WorldDatabase.Get(interaction.user.id);

                if (World["Inventory"].length === 0) return [{ Name: 'Your Inventory is Empty!' }];
                else return World["Inventory"].map((Item) => {
                    const item = GameData.Items.filter((item) => { return item["ID"] === Item["Item"] })[0];
                    return { Name: `${Utils.Plural(item["Name"])} (×${Item["Quantity"]})`, Value: String(Item["Item"]) }
                });
            }
        }
    ],
    Execute: async (interaction) => {
        let Item = parseInt(interaction["options"].getString('item') ?? '');
        const World = await WorldDatabase.Get(interaction.user.id);

        if (!World) return await interaction.reply({
            content: 'You don\'t have an Industrial World yet!',
            ephemeral: true
        });

        if (!Item) {
            if (World["Inventory"]["length"] === 0) return await interaction.reply({
                content:`Your Inventory is Empty!`,
                ephemeral: true
            });
            else return await interaction.reply(await InventoryList(interaction, World["Inventory"]));
        }
        else {
            const _Item = GameData.Items.filter((_Item) => { return _Item["ID"] === Item })[0];

            if (_Item === undefined) return await interaction.reply({
                content: `The Specified Item ${Item} is Invalid!`,
                ephemeral: true
            });
            else return await interaction.reply(await Utils.BuildInventoryItemEmbed(
                interaction.user.id,
                Item,
                World["Inventory"].filter((InvItem) => { return InvItem["Item"] === Item })[0]["Quantity"]
            ));
        }
    }
});