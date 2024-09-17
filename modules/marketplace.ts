import { ButtonInteraction, InteractionReplyOptions, InteractionUpdateOptions } from "discord.js";

import defineCommand from "../resources/Bot/commands.js";
import defineEvent from "./../resources/Bot/events.js";

import DataBase from "../databases/Database.js";
import { SettingsDatabase } from "./settings.js";
import { WorldDatabase, World } from "./world.js";

import { Utils } from "../resources/Utilities.js";
import { Items, Item } from "../resources/Data.js";

interface Marketplace {
    Offers: {
        User: string,
        Items: {
            Item: { Item: number, Quantity: number },
            Cost: { Item: number, Quantity: number },
            OfferEndTime: number
        }[]
    }[]
};

export const MarketplaceDatabase: DataBase<Marketplace> = new DataBase('Marketplace');
await MarketplaceDatabase.Init();

async function Marketplace(): Promise<InteractionReplyOptions & InteractionUpdateOptions> {
    const Marketplace = await MarketplaceDatabase.Get('Global');
    const Settings = await SettingsDatabase.GetAll();

    if (Marketplace["Offers"].length === 0) return {
        content: `There are no Offers Available in the Marketplace Currently!`,
        ephemeral: true
    };

    return Utils.BuildListEmbed<Marketplace["Offers"][0]>(
        Marketplace["Offers"],
        (Item) => {
            const OfferItemsString = Item["Items"].map((_Item) => {
                const item = Items.filter((item) => { return item["ID"] === _Item["Item"]["Item"] })[0];
                return item["Emoji"];
            }).join(', ');

            return [
                `**${Settings[Item["User"]]["DisplayName"]}**: ${Item["Items"].length} ${Item["Items"].length > 1 ? 'Offers' : 'Offer'} Available (${OfferItemsString})`,
                {
                    Label: Settings[Item["User"]]["DisplayName"],
                    Description: `${Item["Items"].length} ${
                        Item["Items"].length > 1 ? 'Offers' : 'Offer'
                    } Available`,
                    Value: Item["User"]
                }
            ];
        },
        async (interaction) => {
            await interaction.update(await Utils.BuildMarketplaceUserEmbed(interaction.values[0]));
        },
        { Title: 'Marketplace', Page: 1 }
    );
}

defineCommand({
    Name: 'marketplace',
    Description: 'Marketplace',
    SubCommands: [
        {
            Name: 'view',
            Description: 'View the Current Marketplace Offers Available',
            Options: [
                {
                    Type: "User",
                    Name: 'user',
                    Description: 'View the Offers from a Particular User'
                }
            ]
        },
        {
            Name: 'manage',
            Description: 'Manage Your Marketplace Offers',
        }
    ],
    Execute: async (interaction) => {
        switch (interaction.options.getSubcommand(true)) {
                    case 'view':
                        const User = interaction.options.getUser('user');

                        if (User === null) return await interaction.reply(await Marketplace());
                        else return await interaction.reply(await Utils.BuildMarketplaceUserEmbed(User.id));

            case 'manage':
                return await interaction.reply(await Utils.BuildMarketplaceManageEmbed(interaction.user.id));
        }
    }
});

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