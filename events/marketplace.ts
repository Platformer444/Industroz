import { ButtonInteraction } from "discord.js";

import defineEvent from "./../resources/Bot/events.js";
import { MarketplaceDatabase, Marketplace } from "./../commands/marketplace.js";
import { Utils } from "./../resources/Utilities.js";
import { WorldDatabase } from "./../commands/world.js";
import { SettingsDatabase } from "./../commands/settings.js";

defineEvent(
    {
        Event: "interactionCreate",
        Name: 'Marketplace Button Interaction',
        Once: false,
        Execute: async (interaction: ButtonInteraction) => {
            if (interaction.isButton()) {

                if (!(await Utils.InteractionUserCheck(interaction))) return;
        
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
            }
        }
    }
)