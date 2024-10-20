import { ButtonInteraction } from "discord.js";

import defineEvent from "./../resources/Bot/events.js";

import { Marketplace, MarketplaceDatabase } from "../commands/marketplace.js";
import { SettingsDatabase } from "../commands/settings.js";
import { World, WorldDatabase } from "../commands/world.js";
import { Item, Items } from "./../resources/Data.js";
import { Utils } from "./../resources/Utilities.js";

defineEvent(
    {
        Event: "interactionCreate",
        Name: 'Marketplace Button Interaction',
        
        Execute: async (interaction: ButtonInteraction) => {
            if (interaction.isButton()) {
                const CustomID = interaction.customId.split('$')[0];
                const Data = JSON.parse(interaction.customId.split('$')[1]);

                if (CustomID === 'Marketplace') await interaction.update(await Marketplace());
                else if (CustomID === 'MarketplaceUser') await interaction.update(await Utils.BuildMarketplaceUserEmbed(Data["User"]));

                else if (CustomID === 'BuyOffer') {
                    const Marketplace = await MarketplaceDatabase.Get('Global');
                    const Settings = await SettingsDatabase.GetAll();
                    const Offer = Marketplace["Offers"].filter((Offer) => { return Offer["User"] === Data["User"] })[0]["Items"][Data["Offer"]];

                    const SellerWorld = await WorldDatabase.Get(Data["User"]);
                    const BuyerWorld = await WorldDatabase.Get(interaction.user.id);

                    const [NewInventory, Message] = Utils.Pay(BuyerWorld["Inventory"], [Offer["Cost"]]);
                    if (Message !== '') return await interaction.reply({ content: Message, ephemeral: true });

                    BuyerWorld["Inventory"] = Utils.EditInventory(NewInventory, Offer["Item"]["Item"], "Add", Offer["Item"]["Quantity"]);;
                    await WorldDatabase.Set(interaction.user.id, BuyerWorld);

                    SellerWorld["Inventory"] = Utils.EditInventory(SellerWorld["Inventory"], Offer["Cost"]["Item"], "Add", Offer["Cost"]["Quantity"]);
                    SellerWorld["Inventory"] = Utils.EditInventory(SellerWorld["Inventory"], Offer["Item"]["Item"], "Remove", Offer["Item"]["Quantity"]);
                    await WorldDatabase.Set(Data["User"], SellerWorld);

                    Marketplace["Offers"].forEach((UserOffer, Index) => {
                        if (UserOffer["User"] === Data["User"]) {
                            UserOffer["Items"].splice(Data["Offer"], 1);
                            
                            if (UserOffer["Items"].length === 0) Marketplace["Offers"].splice(Index, 1)
                        }
                    });
                    await MarketplaceDatabase.Set('Global', Marketplace);

                    return await interaction.reply({
                        content: `You have Successfully Bought the Offer of ${Settings[Data["User"]]["DisplayName"]}!`,
                        ephemeral: true
                    });
                }

                else if (CustomID === 'OfferAdd') {
                    const World = await WorldDatabase.Get(interaction.user.id);

                    const FilteredItems = World["Inventory"].filter((InvItem) => {
                        const Item = Items.filter((Item) => { return Item["ID"] === InvItem["Item"] })[0];
                        return Item["SellDetails"];
                    });
                    await interaction.reply({
                        ...(Utils.BuildListEmbed<World["Inventory"][0]>(
                            FilteredItems,
                            (InvItem) => {
                                const Item = Items.filter((Item) => { return Item["ID"] === InvItem["Item"] })[0];
                                return [
                                    '',
                                    { Label: Item["Name"], Emoji: Item["Emoji"], Description: Item["Description"], Value: JSON.stringify({ Item: Item["ID"], Quantity: InvItem["Quantity"] }) }
                                ];
                            },
                            async (interaction) => {
                                const InvItem: { Item: number, Quantity: number } = JSON.parse(interaction.values[0]);
                                const Item = Items.filter((Item) => { return InvItem["Item"] === Item["ID"] })[0];

                                await interaction.update({
                                    content: `> Item: ${Item["Emoji"]} ${Item["Name"]}`,
                                    components: Utils.BuildListEmbed<number>(
                                        new Array(InvItem["Quantity"]).fill(0).map((Value, Index) => { return Index + 1; }),
                                        (Quantity) => {
                                            return [
                                                '',
                                                { Label: String(Quantity), Value: JSON.stringify({ Item: InvItem["Item"], Quantity: Quantity }) }
                                            ]
                                        },
                                        async (interaction) => {
                                            const InvItem: { Item: number, Quantity: number } = JSON.parse(interaction.values[0]);
                                            const Item = Items.filter((Item) => { return InvItem["Item"] === Item["ID"] })[0];

                                            await interaction.update({
                                                content: 
                                                    `> Item: ${Item["Emoji"]} ${Item["Name"]}
                                                    > Quantity: ×${InvItem["Quantity"]}`,
                                                components: Utils.BuildListEmbed<Item>(
                                                    Items.filter((Item) => { return Item["ID"] !== InvItem["Item"] }),
                                                    (Item) => {
                                                        return [
                                                            '',
                                                            { Label: Item["Name"], Emoji: Item["Emoji"], Description: Item["Description"], Value: JSON.stringify({  }) }
                                                        ]
                                                    },
                                                    (interaction) => {},
                                                    { Title: 'CCCC', Embed: false, Page: 1 }
                                                )["components"]
                                            });
                                        },
                                        { Title: 'BBBB', Embed: false, Page: 1 }
                                    )["components"]
                                });
                            },
                            { Embed: false, Title: 'AAAA', Page: 1 }
                        )),
                        ephemeral: true
                    });
                }
            }
        }
    }
)