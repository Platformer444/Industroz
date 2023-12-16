import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";
import defineEvent from "./../resources/Bot/events.js";
import { WorldDatabase } from "./../commands/world.js";
import InventoryList from "./../commands/inventory.js";
import { defineComponents, defineModal } from "./../resources/Bot/components.js";
import { Items } from "./../resources/data.js";
import { BotUtils } from "./../resources/utils.js";

defineEvent({
    Event: "interactionCreate",
    Name: 'Inventory Button Interaction',
    Once: false,
    Execute: async (interaction: ButtonInteraction) => {
        if (interaction.isButton()) {
            const CustomID = interaction["customId"].split('$')[0];
            const Data = JSON.parse(interaction["customId"].split('$')[1]);
    
            switch (CustomID) {
                case "Inventory":
                    const World = (await WorldDatabase.Get(interaction.user.id));

                    if (!World) return await interaction.reply({
                        content: 'You don\'t have an Industrial World yet!',
                        ephemeral: true
                    });

                    return await interaction.update(InventoryList(interaction, World["Inventory"]));
                case "Buy":
                    const item = Items.filter((item) => { return item["ID"] === Data["Item"] })[0];

                    return await interaction.showModal(defineModal(
                        {
                            CustomID: 'BuyModal',
                            Title: 'Buy',
                            Components: defineComponents({
                                ComponentType: "TextInput",
                                CustomID: 'BuyNum',
                                Label: `Amount of ${BotUtils.Plural(item["Name"])}`,
                                Placeholder: `How many ${BotUtils.Plural(item["Name"])} You Want to Buy?`,
                                Required: true,
                                TextStyle: "Short",
                            }),
                            Data: { Item: item["ID"] }
                        }
                    ));

                case "Sell": return;
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
            const CustomID = interaction["customId"].split('$')[0];
            const Data = JSON.parse(interaction["customId"].split('$')[1]);
            let Done: boolean = false;

            switch (CustomID) {
                case "BuyModal":
                    const World = await WorldDatabase.Get(interaction["user"]["id"]);
                    const Quantity = parseInt(interaction["fields"].getTextInputValue('BuyNum${}'));

                    if (isNaN(Quantity)) return await interaction.reply({
                        content: `${interaction["fields"].getTextInputValue('BuyNum${}')} isn't a Valid Integral Quantity!`,
                        ephemeral: true
                    });

                    if (Quantity < 0) return await interaction.reply({
                        content: `You can't Buy Negative Items!`,
                        ephemeral: true
                    });

                    const Item = Items.filter((Item) => { return Item["ID"] === parseInt(Data["Item"]) })[0];

                    Item["BuyingDetails"]?.forEach(async (BuyingDetail) => {
                        const BuyingItem = Items.filter((Item) => { return Item["ID"] === BuyingDetail["Item"]; })[0];

                        const NewInventory = BotUtils.EditInventory(World["Inventory"], BuyingDetail["Item"], "Remove", Quantity * BuyingDetail["Quantity"]);

                        if (NewInventory["length"] === 0) {
                            const Item = Items.filter((Item) => { return Item["ID"] === BuyingDetail["Item"]; })[0];
                            Done = false;

                            return await interaction.reply({
                                content: `You don't have enough ${BuyingItem["Emoji"]} ${BuyingItem["Name"]} to Buy ${Item["Emoji"]} ${Item["Name"]}`!,
                                ephemeral: true
                            });
                        }
                        else {
                            Done = true;
                            World["Inventory"] = NewInventory;
                        }
                    });

                    if (Done) {
                        World["Inventory"] = BotUtils.EditInventory(World["Inventory"], Item["ID"], "Add", Quantity);
                        await WorldDatabase.Set(interaction["user"]["id"], World);

                        return await interaction.reply({
                            content: `You Successfully Bought ${Item["Emoji"]} ${Item["Name"]} ×${Quantity}!`,
                            ephemeral: true
                        });
                    }
            }
        }
    }
})