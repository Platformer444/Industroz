import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";

import defineEvent from "./../resources/Bot/events.js";
import { World, WorldDatabase } from "./../commands/world.js";
import InventoryList from "./../commands/inventory.js";
import { defineComponents, defineModal } from "./../resources/Bot/components.js";
import { Items } from "./../resources/data.js";
import { BotUtils } from "../resources/Utilities.js";

defineEvent({
    Event: "interactionCreate",
    Name: 'Inventory Button Interaction',
    Once: false,
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
                            Label: `Amount of ${BotUtils.Plural(Item["Name"])}`,
                            Placeholder: `How many ${BotUtils.Plural(Item["Name"])} You Want to Buy?`,
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
                            Label: `Amount of ${BotUtils.Plural(Item["Name"])}`,
                            Placeholder: `How many ${BotUtils.Plural(Item["Name"])} You Want to Sell?`,
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
    Once: false,
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
                    content: `There are no ${Item["Emoji"]}${BotUtils.Plural(Item["Name"])} available in the Shop!`,
                    ephemeral: true
                });

                let Done = false;
                let Message = `**Inventory Change:**\n> ${Item["Emoji"]}${Item["Name"]} +${Quantity}\n`;
                const NewInventory: World["Inventory"] = World["Inventory"];
                Item["BuyingDetails"]?.forEach(async (BuyingDetail) => {
                    const BuyingItem = Items.filter((Item) => { return Item["ID"] === BuyingDetail["Item"]; })[0];
                    const Temp = BotUtils.EditInventory(World["Inventory"], BuyingDetail["Item"], "Remove", BuyingDetail["Quantity"]);

                    if (Temp["length"] === 0) {
                        Done = false;
                        return await interaction.reply({
                            content: `You don't have enough ${BuyingItem["Emoji"]} ${BuyingItem["Name"]} to Buy ${Item["Emoji"]} ${Item["Name"]}`!,
                            ephemeral: true
                        });
                    }
                    else {
                        Temp.forEach((InvItem) => {
                            NewInventory.forEach((NewInvItem) => {
                                if (NewInvItem["Item"] === InvItem["Item"]) NewInvItem["Quantity"] = InvItem["Quantity"];
                            });
                        });
                        Done = true;
                    }
                });

                if (Done) {
                    World["Islands"][Data["Island"] - 1]["Shop"]["Items"].forEach((ShopItem) => {
                        if (ShopItem["Item"] === parseInt(Data["Item"])) ShopItem["Quantity"] -= Quantity;
                    });

                    World["Inventory"] = NewInventory;
                    World["Inventory"] = BotUtils.EditInventory(World["Inventory"], Item["ID"], "Add", Quantity);
                    
                    await WorldDatabase.Set(interaction.user.id, World);

                    return await interaction.reply({
                        content: `You Successfully Bought ${Item["Emoji"]}${Item["Name"]} ×${Quantity}!\n\n${Message}`,
                        ephemeral: true
                    });
                }
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

                    World["Inventory"] = BotUtils.EditInventory(World["Inventory"], Detail["Item"], "Add", Quantity * Detail["Quantity"]);

                    Message += `> ${SellingItem["Emoji"]}${SellingItem["Name"]} +${Quantity * Detail["Quantity"]}\n`;
                });

                World["Inventory"] = BotUtils.EditInventory(World["Inventory"], Item["ID"], "Remove", Quantity);

                await WorldDatabase.Set(interaction.user.id, World);
                return await interaction.reply({
                    content: `You Successfully Sold ${Item["Emoji"]}${Item["Name"]} ×${Quantity}\n\n${Message}`,
                    ephemeral: true
                });
            }
        }
    }
});