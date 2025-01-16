import { APIActionRowComponent, APIEmbed, APIMessageActionRowComponent, InteractionReplyOptions, InteractionUpdateOptions, time, User } from "discord.js";

import defineCommand from "../resources/Bot/commands.js";
import { defineComponents } from "../resources/Bot/components.js";

import DataBase from "../databases/Database.js";
import { SettingsDatabase } from "./settings.js";

import { Utils } from "../resources/Utilities.js";
import { GameData } from "../resources/Data.js";

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

export async function MarketplaceEmbed(): Promise<InteractionReplyOptions & InteractionUpdateOptions> {
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
                const item = GameData.Items.filter((item) => { return item["ID"] === _Item["Item"]["Item"] })[0];
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
        if (interaction.options.getSubcommand(true) === 'view') {
            const User = interaction.options.getUser('user');

            const Marketplace = await MarketplaceDatabase.Get('Global');

            Marketplace["Offers"].forEach((Offer, Index) => {
                Offer["Items"].forEach((Item, Index) => {
                    if (Date.now() >= Item["OfferEndTime"]) Offer["Items"].splice(Index, 1);
                });

                if (Offer["Items"].length === 0) Marketplace["Offers"].splice(Index, 1);
            });

            await MarketplaceDatabase.Set('Global', Marketplace);

            if (User === null) return await interaction.reply(await MarketplaceEmbed());
            else return await interaction.reply(await Utils.BuildMarketplaceUserEmbed(User.id));
        }
        else if (interaction.options.getSubcommand(true) === 'manage') {
            const Marketplace = await MarketplaceDatabase.Get('Global');
            const Settings = await SettingsDatabase.GetAll();

            let UserOffers = Marketplace["Offers"].filter((UserOffers) => { return UserOffers["User"] === interaction.user.id; })[0];
            if (UserOffers === undefined) UserOffers = { User: interaction.user.id, Items: [] };

            const Reply = Utils.BuildListEmbed<typeof UserOffers["Items"][0]>(
                UserOffers["Items"],
                (Item, Index) => {
                    const OfferItem = GameData.Items.filter((OfferItem) => { return OfferItem["ID"] === Item["Item"]["Item"]; })[0];
                    const BuyItem = GameData.Items.filter((BuyItem) => { return BuyItem["ID"] === Item["Cost"]["Item"]; })[0];

                    const ItemCostString = {
                        Emoji: `${BuyItem["Emoji"]} ${BuyItem["Name"]} ×${Item["Cost"]["Quantity"]} → ${OfferItem["Emoji"]} ${OfferItem["Name"]} ×${Item["Item"]["Quantity"]}`,
                        NoEmoji: `${BuyItem["Name"]} ×${Item["Cost"]["Quantity"]} → ${OfferItem["Name"]} ×${Item["Item"]["Quantity"]}`
                    };
                    const EndsAtString = `(Ends at **${String(time(Math.floor(Item["OfferEndTime"] / 1000), "F"))}**)`;
                    return [
                        `${(Index as number) + 1}. ${ItemCostString["Emoji"]} ${EndsAtString}`,
                        { Label: ItemCostString["NoEmoji"], Value: (Index as number).toString(), Description: `Ends at ${new Date(Item["OfferEndTime"]).toUTCString()}`, Emoji: OfferItem["Emoji"] }
                    ];
                },
                async (interaction) => {
                    const UserOffer = UserOffers.Items[parseInt(interaction.values[0])];

                    const OfferItem = GameData.Items.filter((Item) => { return Item["ID"] === UserOffer["Item"]["Item"]; })[0];
                    const BuyItem = GameData.Items.filter((Item) => { return Item["ID"] === UserOffer["Cost"]["Item"]; })[0];

                    await interaction.reply({
                        embeds: [
                            {
                                title: `Offer ${parseInt(interaction.values[0]) + 1}`,
                                description: `Ends at **${String(time(Math.floor(UserOffer["OfferEndTime"] / 1000), "F"))}** (Your Timezone)`,
                                fields: [
                                    { name: 'You Give:', value: `${BuyItem["Emoji"]} ${BuyItem["Name"]} ×${UserOffer["Cost"]["Quantity"]}`, inline: true },
                                    { name: 'Your Receive:', value: `${OfferItem["Emoji"]} ${OfferItem["Name"]} ×${UserOffer["Item"]["Quantity"]}`, inline: true }
                                ]
                            }
                        ],
                        components: [
                            defineComponents(
                                {
                                    ComponentType: "Button",
                                    CustomID: 'DeleteOffer',
                                    Label: 'Delete Offer',
                                    ButtonStyle: 'Danger',
                                    Data: { Offer: parseInt(interaction.values[0]) }
                                }
                            )
                        ],
                        ephemeral: true
                    })
                },
                { SelectMenu: UserOffers["Items"]["length"] !== 0, Title: Settings[interaction.user.id]["DisplayName"], Page: 1 }
            );

            if (UserOffers["Items"].length === 0) (Reply["embeds"] as APIEmbed[])[0]["description"] = `You do not have any Offers Available in the Marketplace!`;

            (Reply["components"] as APIActionRowComponent<APIMessageActionRowComponent>[]).splice(
                0, 0,
                defineComponents(
                    {
                        ComponentType: "Button",
                        CustomID: 'OfferAdd',
                        Label: 'Add New Offer',
                        ButtonStyle: "Success"
                    }
                )
            );

            await interaction.reply(Reply);
        }
    }
});