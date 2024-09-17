import { BaseInteraction, ButtonInteraction, ModalSubmitInteraction } from "discord.js";

import defineCommand from "../resources/Bot/commands.js";
import { defineModal, defineComponents } from "./../resources/Bot/components.js";
import defineEvent from "./../resources/Bot/events.js";

import { SettingsDatabase } from "./settings.js";
import { World, WorldDatabase } from "./world.js";

import { Items } from "../resources/Data.js";
import { Utils } from "../resources/Utilities.js";

async function InventoryList(interaction: BaseInteraction, Inventory: World["Inventory"]) {
    const Settings = await SettingsDatabase.Get(interaction.user.id);

    return Utils.BuildListEmbed<World["Inventory"][0]>(
        Inventory,
        (Item) => {
            const item = Items.filter((item) => { return item["ID"] === Item["Item"] })[0];
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
            const Item = Items.filter((Item) => { return Item["Name"].replaceAll(' ', '_').toLowerCase() === Utils.Singular(interaction.values[0].split('(')[0]) })[0];
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
                    const item = Items.filter((item) => { return item["ID"] === Item["Item"] })[0];
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
            const _Item = Items.filter((_Item) => { return _Item["ID"] === Item })[0];

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

defineEvent({
    Event: "interactionCreate",
    Name: 'Inventory Button Interaction',
    
    Execute: async (interaction: ButtonInteraction) => {
        if (interaction.isButton()) {
            const CustomID = interaction.customId.split('$')[0];
            const Data = JSON.parse(interaction.customId.split('$')[1]);
    
            if (CustomID === "Inventory") {
                const World = (await WorldDatabase.Get(interaction.user.id));

                if (!World) return await interaction.reply({
                    content: 'You don\'t have an Industrial World yet!',
                    ephemeral: true
                });

                return await interaction.update(await InventoryList(interaction, World["Inventory"]));
            }

            else if (CustomID === "Buy") {
                const Item = Items.filter((item) => { return item["ID"] === Data["Item"] })[0];

                return await interaction.showModal(defineModal(
                    {
                        CustomID: 'BuyModal',
                        Title: 'Buy',
                        Components: defineComponents({
                            ComponentType: "TextInput",
                            CustomID: 'BuyNum',
                            Label: `Amount of ${Utils.Plural(Item["Name"])}`,
                            Placeholder: `How many ${Utils.Plural(Item["Name"])} You Want to Buy?`,
                            Required: true,
                            TextStyle: "Short",
                        }),
                        Data: Data
                    }
                ));
            }

            else if (CustomID === "Sell") {
                const Item = Items.filter((item) => { return item["ID"] === Data["Item"] })[0];

                return await interaction.showModal(defineModal(
                    {
                        CustomID: 'SellModal',
                        Title: 'Sell',
                        Components: defineComponents({
                            ComponentType: "TextInput",
                            CustomID: 'SellNum',
                            Label: `Amount of ${Utils.Plural(Item["Name"])}`,
                            Placeholder: `How many ${Utils.Plural(Item["Name"])} You Want to Sell?`,
                            Required: true,
                            TextStyle: "Short",
                        }),
                        Data: Data
                    }
                ));
            }
        }
    }
});

defineEvent({
    Event: "interactionCreate",
    Name: 'Inventory Modal Submit',
    
    Execute: async (interaction: ModalSubmitInteraction) => {
        if (interaction.isModalSubmit()) {
            const CustomID = interaction.customId.split('$')[0];
            const Data = JSON.parse(interaction.customId.split('$')[1]);

            const Item = Items.filter((Item) => { return Item["ID"] === parseInt(Data["Item"]) })[0];

            if (CustomID === "BuyModal") {
                const World = await WorldDatabase.Get(interaction.user.id);
                let Quantity = parseInt(interaction.fields.getTextInputValue('BuyNum${}'));

                if (isNaN(Quantity)) return await interaction.reply({
                    content: `${interaction.fields.getTextInputValue('BuyNum${}')} isn't a Valid Integral Quantity!`,
                    ephemeral: true
                });

                if (Quantity < 0) return await interaction.reply({
                    content: `You can't Buy Negative Items!`,
                    ephemeral: true
                });
                
                const ShopItem = World["Islands"][Data["Island"] - 1]["Shop"]["Items"].filter((ShopItem) => { return ShopItem["Item"] === parseInt(Data["Item"]) })[0];
                if (Quantity > ShopItem["Quantity"]) Quantity = ShopItem["Quantity"];
                if (Quantity === 0) return interaction.reply({
                    content: `There are no ${Item["Emoji"]}${Utils.Plural(Item["Name"])} available in the Shop!`,
                    ephemeral: true
                });

                let Message = `**Inventory Change:**\n> ${Item["Emoji"]}${Item["Name"]} +${Quantity}\n`;
                const [NewInventory, ResultMessage] = Utils.Pay(
                    World["Inventory"],
                    (Item["BuyingDetails"]?.map((BuyingDetail) => {
                        return { Item: BuyingDetail["Item"], Quantity: Quantity * BuyingDetail["Quantity"] };
                    })) ?? []
                );

                if (ResultMessage !== '') return await interaction.reply({
                    content: ResultMessage,
                    ephemeral: true
                });

                World["Islands"][Data["Island"] - 1]["Shop"]["Items"].forEach((ShopItem) => {
                    if (ShopItem["Item"] === parseInt(Data["Item"])) ShopItem["Quantity"] -= Quantity;
                });
                World["Inventory"] = NewInventory;
                World["Inventory"] = Utils.EditInventory(World["Inventory"], Item["ID"], "Add", Quantity);
                await WorldDatabase.Set(interaction.user.id, World);

                return await interaction.reply({
                    content: `You Successfully Bought ${Item["Emoji"]}${Item["Name"]} ×${Quantity}!\n\n${Message}`,
                    ephemeral: true
                });
            }

            else if (CustomID === "SellModal") {
                const World = await WorldDatabase.Get(interaction.user.id);
                let Quantity = parseInt(interaction.fields.getTextInputValue('SellNum${}'));

                if (isNaN(Quantity)) return await interaction.reply({
                    content: `${interaction.fields.getTextInputValue('SellNum${}')} isn't a Valid Integral Quantity!`,
                    ephemeral: true
                });

                if (Quantity < 0) return await interaction.reply({
                    content: `You can't Sell Negative Items!`,
                    ephemeral: true
                });

                const FilteredInvItem = World["Inventory"].filter((InvItem) => { return InvItem["Item"] === parseInt(Data["Item"]); })[0];
                if (Quantity > FilteredInvItem["Quantity"]) Quantity = FilteredInvItem["Quantity"];

                const Item = Items.filter((Item) => { return Item["ID"] === FilteredInvItem["Item"] })[0];
                let Message = `**Inventory Change:**\n> ${Item["Emoji"]}${Item["Name"]} -${Quantity} (Sold)\n`;

                Item["SellDetails"]?.forEach((Detail) => {
                    const SellingItem = Items.filter((SellingItem) => { return SellingItem["ID"] === Detail["Item"] })[0];

                    World["Inventory"] = Utils.EditInventory(World["Inventory"], Detail["Item"], "Add", Quantity * Detail["Quantity"]);

                    Message += `> ${SellingItem["Emoji"]}${SellingItem["Name"]} +${Quantity * Detail["Quantity"]}\n`;
                });

                World["Inventory"] = Utils.EditInventory(World["Inventory"], Item["ID"], "Remove", Quantity);

                await WorldDatabase.Set(interaction.user.id, World);
                return await interaction.reply({
                    content: `You Successfully Sold ${Item["Emoji"]}${Item["Name"]} ×${Quantity}\n\n${Message}`,
                    ephemeral: true
                });
            }
        }
    }
});