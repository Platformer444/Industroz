import { APIActionRowComponent, APIEmbed, APIMessageActionRowComponent, AnySelectMenuInteraction, ButtonInteraction, ComponentType, InteractionReplyOptions, InteractionUpdateOptions, StringSelectMenuInteraction, TextChannel, User, time } from "discord.js";
import { stripIndent } from "common-tags";

import { Biome, Biomes, Item, Items, SETTINGS, Tiles } from "./Data.js";
import { World, WorldDatabase } from "../commands/world.js";
import { defineComponents, Component, SelectMenuOption } from "./Bot/components.js";
import defineEvent from "./Bot/events.js";
import { Settings, SettingsDatabase } from "../commands/settings.js";
import { MarketplaceDatabase } from "../commands/marketplace.js";

export interface NavigationButtonData {
    User: string,
    Island: number,
    Position: [number, number]
};
type InteractionResponse = InteractionReplyOptions & InteractionUpdateOptions;

class Util {
    // World Utils
    CreateWorld(Width: number, Height: number, DefaultOutpostPosition: [number, number] = [(Height / 2) - 1, (Width / 2) - 1]): World["Islands"][0]["Tiles"] {
        const World: World["Islands"][0]["Tiles"] = [];

        const _Biomes: Biome[] = [];
        let BiomeWidth: number = 10;
        let BiomeHeight: number = 10;

        while (_Biomes["length"] < (Width * Height) / (BiomeWidth * BiomeHeight)) Biomes.forEach((Biome) => {
            if (Utils.RandomNumber(0, 10 - (Biome["SpawningChance"] ?? 10)) === 0) _Biomes.push(Biome);
        });

        for (let i = 0; i < Height; i++) {
            const WorldChunk: World["Islands"][0]["Tiles"][0] = [];

            for (let j = 0; j < Width; j++) {
                const Biome = _Biomes[Math.floor(j / BiomeWidth) + Math.floor(i / BiomeHeight)] ?? { Tiles: [ 2 ] };

                const Tile = Biome["Tiles"].filter((Tile) => {
                    const _Tile = Tiles.filter((_Tile) => { return _Tile["ID"] === Tile })[0];
                    return Utils.RandomNumber(0, 10 - (_Tile["Spawnable"] ?? 10)) === 0;
                })[0];

                if (!Tile) WorldChunk.push({ Tile: 2 });
                else WorldChunk.push({ Tile: Tile });
            }

            World.push(WorldChunk);
        }

        World[DefaultOutpostPosition[0]][DefaultOutpostPosition[1]]["Tile"] = 3;

        return World;
    }

    RenderWorld(World: World["Islands"][0]["Tiles"], Position: [number, number], FOV: [number, number] = [5, 5]): string {
        let message = '';

        for (let i = Position[0] - Math.floor(FOV[0] / 2); i < (Position[0] - Math.floor(FOV[0] / 2)) + FOV[0]; i++) {
            for (let j = Position[1] - Math.floor(FOV[1] / 2); j < (Position[1] - Math.floor(FOV[1] / 2)) + FOV[1]; j++) {
                let Tile;

                if (!World[i][j]) Tile = Tiles.filter((Tile) => { return Tile["ID"] === 1 })[0];
                else Tile = Tiles.filter((Tile) => { return Tile["ID"] === World[i][j]["Tile"] })[0];

                message += Tile["Emoji"];
            }
            message += '\n';
        }

        return message;
    }

    async NavigateWorld(Data: NavigationButtonData, Interactor: User, Move: [number, number]): Promise<InteractionResponse> {
        return await Utils.BuildNavigation(
            {
                User: Data["User"],
                Island: Data["Island"],
                Position: [Data["Position"][0] + Move[0], Data["Position"][1] + Move[1]]
            },
            Interactor
        );
    }

    async DestroyTile(Data: NavigationButtonData, Interactor: User, Tool: "Axe" | "Pickaxe"): Promise<["Reply" | "Update", InteractionResponse]> {
        const AxeBreakableBlocks = [ 5, 6 ];
        const PickaxeBreakableBlocks = [ 7, 8 ];
        const World = await WorldDatabase.Get(Data["User"]);
        const CurrentTile = World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]]["Tile"];

        if ((Tool === "Axe" ? AxeBreakableBlocks : PickaxeBreakableBlocks).includes(CurrentTile as number)) {
            const Tile = Tiles.filter((Tile) => { return Tile["ID"] === CurrentTile })[0];

            World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]] = { Tile: Tile["DestroyReplace"] ?? 2 };

            Tile["DestroyGive"]?.forEach((Item) => { World["Inventory"] = Utils.EditInventory(World["Inventory"], Item["Item"], "Add", Item["Quantity"]); });

            await WorldDatabase.Set(Data["User"], World);
            return ["Update", await Utils.BuildNavigation(Data, Interactor)];
        }
        else return ["Reply", {
            content: `${Tool} can't be used on that Tile!`,
            ephemeral: true
        }];
    }

    async PaySalary(Data: NavigationButtonData): Promise<InteractionResponse> {
        const World = await WorldDatabase.Get(Data["User"]);
                
        const Tile = World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]];
        const _Tile = Tiles.filter((_Tile) => { return _Tile["ID"] === Tile["Tile"] })[0];

        if (!Tile["Component"] || !_Tile["Salary"]) return {
            content: `You can't Pay Salary to this Tile!`,
            ephemeral: true
        };

        const TimePassed = Math.floor((Date.now() - (Tile["Component"]["LastSalaryPay"])) / (1000 * 60 * 60 * 24));
        if (TimePassed === 0) return {
            content: `You can Pay Salary only Once per Day!`,
            ephemeral: true
        };

        const [NewInventory, Message] = this.Pay(World["Inventory"], _Tile["Salary"]);
        if (Message !== '') return { content: Message, ephemeral: true }

        Tile["Component"]["Hoarding"].forEach((HoardedStock) => {
            World["Inventory"] = Utils.EditInventory(
                World["Inventory"],
                HoardedStock["Item"],
                "Add",
                (HoardedStock["Quantity"] - TimePassed) > 0 ? HoardedStock["Quantity"] - TimePassed : 0
            );
        });
        World["Inventory"] = NewInventory;
        World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]]["Component"] = {
            ...Tile["Component"],
            LastSalaryPay: Date.now(),
            Hoarding: []
        };
        await WorldDatabase.Set(Data["User"], World);

        return {
            content: `Salary for ${_Tile["Emoji"]}${_Tile["Name"]}'s ${Tile["Component"]?.Workers} Workers was Paid Successfully!`,
            ephemeral: true
        };
    }

    async UpgradeBuildable(Data: NavigationButtonData): Promise<InteractionResponse> {
        const World = await WorldDatabase.Get(Data["User"]);

        const Tile = World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]];
        const _Tile = Tiles.filter((_Tile) => { return _Tile["ID"] === Tile["Tile"] })[0];

        const [NewInventory, Message] = this.Pay(World["Inventory"], Utils.GetUpgradeCost(Tile["Tile"], (Tile["Component"]?.Level as number) + 1) ?? []);
        if (Message) return { content: Message, ephemeral: true };

        if (Tile["Component"]) World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]]["Component"] = {
            ...Tile["Component"],
            Level: Tile["Component"]["Level"] + 1,
            Workers: Math.ceil(Tile["Component"]["Workers"] + Utils.RandomNumber(Math.pow(2, Tile["Component"]["Level"] - Utils.RandomNumber(1, 2)), Math.pow(2, Tile["Component"]["Level"])))
        };
        World["Inventory"] = NewInventory;
        await WorldDatabase.Set(Data["User"], World);

        return {
            content: `Your ${_Tile["Emoji"]}${_Tile["Name"]} was Successfully Upgraded to Level ${Tile["Component"]?.Level as number}!`,
            ephemeral: true
        };
    }

    // Text and Number Utills
    Plural(Word: string): string {
        if (Word.endsWith('f')) return `${Word.slice(0, Word["length"] - 1)}ves`;
        else if (Word.endsWith('o')) return `${Word}es`;
        else return `${Word}s`;
    }

    Singular(Word: string): string {
        if (Word.endsWith('ves')) return `${Word.slice(0, Word["length"] - 3)}f`;
        else if (Word.endsWith('s')) return Word.slice(0, Word["length"] - 1);
        else return Word;
    }

    RandomNumber(Min: number, Max: number): number {
        return Math.floor(Math.random() * (Max - Min + 1) ) + Min;
    }

    // Embed Utils
    async BuildHomeScreen(User: User, Interactor: User, Island: number, Outpost?: number): Promise<InteractionResponse> {
        if (User.bot) return {
            content: 'Bots can not have an Industrial World!',
            ephemeral: true
        };

        const World = await WorldDatabase.Get(User["id"]);
        const Settings = await SettingsDatabase.Get(User["id"]);

        if (!World) return {
            content: 'Looks like the specified User does not have an Industrial World!',
            ephemeral: true
        };

        if(Settings["Visibility"] === "Private") return {
            content: 'The Specified User\'s Industrial World is Private!',
            ephemeral: true
        };

        if (Island > World["Islands"].length) Island = 1;

        Outpost = Outpost ?? 
            World["Islands"][Island - 1]["Outposts"].indexOf(
                World["Islands"][Island - 1]["Outposts"].filter((Outpost) => { return Outpost["Default"] })[0]
            ) + 1;

        return {
            content: this.RenderWorld(
                World["Islands"][Island - 1]["Tiles"],
                World["Islands"][Island - 1]["Outposts"][Outpost - 1]["Location"]
            ),
            components: [
                defineComponents(
                    {
                        ComponentType: "Button",
                        CustomID: 'Explore',
                        Label: 'Explore',
                        Emoji: '🗺️',
                        ButtonStyle: "Primary",
                        Data: {
                            User: User.id,
                            Island: Island,
                            Position: World["Islands"][Island - 1]["Outposts"][Outpost - 1]["Location"]
                        }
                    },
                    {
                        ComponentType: "Button",
                        CustomID: 'GetOfflineEarnings',
                        Label: 'Get Offline Earnings',
                        Emoji: '💵',
                        ButtonStyle: "Primary",
                        Disabled: User !== Interactor,
                        Data: { Island: Island }
                    }
                ),
                defineComponents(
                    {
                        ComponentType: "StringSelect",
                        CustomID: 'IslandSelect',
                        Placeholder: 'Select an Island...',
                        Options: [
                            ...World["Islands"].map((_Island) => {
                                return {
                                    Label: `Island ${_Island["ID"]}`,
                                    Default: Island === _Island["ID"],
                                    Emoji: '🏝️'
                                }
                            }),
                            {
                                Label: 'Create an Island',
                                Description: `${(World["Islands"].length + 1) * 100000}`,
                                Emoji: '➕'
                            }
                        ],
                        Data: { User: User["id"] }
                    }
                ),
                defineComponents(
                    {
                        ComponentType: "StringSelect",
                        CustomID: 'OutpostSelect',
                        Placeholder: 'Select an Outpost...',
                        Options: World["Islands"][Island - 1]["Outposts"].map((_Outpost, Index) => {
                            return {
                                Label: `Outpost ${Index + 1}`,
                                Default: Index + 1 === Outpost,
                                Emoji: '🔭'
                            }
                        }),
                        Data: { User: User["id"], Island: Island }
                    }
                )
            ],
            ephemeral: Settings["Visibility"] !== "Public"
        };
    }

    async BuildNavigation(Data: NavigationButtonData, Interactor: User): Promise<InteractionResponse> {
        const World = await WorldDatabase.Get(Data["User"]);

        const Directions: { Direction: string, Emoji: string }[][] = [
            [
                { Direction: 'UL', Emoji: '↖️' },
                { Direction: 'U', Emoji: '⬆️' },
                { Direction: 'UR', Emoji: '↗️' }
            ],
            [
                { Direction: 'L', Emoji: '⬅️' },
                { Direction: 'N', Emoji: '⏹️' },
                { Direction: 'R', Emoji: '➡️' }
            ],
            [
                { Direction: 'DL', Emoji: '↙️' },
                { Direction: 'D', Emoji: '⬇️' },
                { Direction: 'DR', Emoji: '↘️' }
            ]
        ];

        const UsableItems = Items.filter((Item) => { return Item["Usable"]; });
        return {
            content: this.RenderWorld(
                World["Islands"][Data["Island"] - 1]["Tiles"],
                Data["Position"]
            ),
            components: [
                defineComponents(
                    {
                        ComponentType: "Button",
                        CustomID: 'TileInfo',
                        Label: `[${String(Data["Position"])}]`,
                        Emoji: Tiles.filter((Tile) => { return Tile["ID"] === World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]]["Tile"] })[0]["Emoji"],
                        ButtonStyle: "Primary",
                        Data: Data
                    },
                    {
                        ComponentType: "Button",
                        CustomID: 'Build',
                        Label: "Build",
                        Emoji: '🛠️',
                        ButtonStyle: "Primary",
                        Disabled: Data["User"] !== Interactor["id"],
                        Data: Data
                    },
                    {
                        ComponentType: "Button",
                        CustomID: 'ItemUse',
                        Label: 'Use Item',
                        Emoji: UsableItems[this.RandomNumber(1, UsableItems["length"]) - 1]["Emoji"],
                        ButtonStyle: "Primary",
                        Disabled: Data["User"] !== Interactor["id"],
                        Data: Data
                    }
                ),
                ...Directions.map((Directions) => {
                    return defineComponents(
                        ...Directions.map((Direction): Component => {
                            return {
                                ComponentType: "Button",
                                CustomID: 'Nav',
                                Emoji: Direction["Emoji"],
                                Disabled: Direction["Direction"] === "N",
                                ButtonStyle: "Secondary",
                                Data: {
                                    To: Direction["Direction"],
                                    ...Data
                                }
                            };
                        })
                    );
                }),
                defineComponents(
                    {
                        ComponentType: "Button",
                        CustomID: 'Home',
                        Label: 'Home',
                        Emoji: '🏡',
                        ButtonStyle: "Secondary",
                        Data: Data
                    }
                )
            ]
        };
    }

    BuildListEmbed<ListItemType>(
        List: ListItemType[],
        Content: (Item: ListItemType, Index?: number, List?: ListItemType[]) => [string, SelectMenuOption],
        SelectInteractionExecute: (interaction: StringSelectMenuInteraction) => any,
        Options: {
            Embed?: boolean,
            SelectMenu?: boolean,            
            Title?: string,
            Page: number
        }
    ): InteractionResponse {
        defineEvent({
            Event: "interactionCreate",
            Name: `${Options["Title"]} Paginate Event`,
            Execute: async (interaction: ButtonInteraction) => {
                if (interaction.isButton()) {
                    const PaginateID = interaction.customId.split('$')[0];
                    const Page = parseInt(JSON.parse(interaction.customId.split('$')[1])["Page"]);

                    if (PaginateID === `${Options["Title"]}Paginate`) return await interaction.update(this.BuildListEmbed<ListItemType>(
                        List, Content, SelectInteractionExecute,
                        { ...Options, Page: Page }
                    ));
                }
            }
        });

        defineEvent({
            Event: "interactionCreate",
            Name: `${Options["Title"]} StringSelectMenu Event`,
            Execute: async (interaction: StringSelectMenuInteraction) => {
                if (interaction.isStringSelectMenu()) {
                    if (interaction.customId.split('$')[0] === `${Options["Title"]}StringSelect`) return await SelectInteractionExecute(interaction);
                }
            }
        });

        return {
            embeds: (Options["Embed"] ?? true) ? [
                {
                    title: Options["Title"],
                    description: List
                        .filter((Item): ListItemType | undefined => {
                            if (
                                List.indexOf(Item) >= (Options["Page"] - 1) * 25 &&
                                List.indexOf(Item) <= (25 * Options["Page"]) - 1
                            ) return Item;
                            else return;
                        })
                        .map((Item) => { return Content(Item, List.indexOf(Item), List)[0] }).join('\n')
                }
            ] : undefined,
            
            components: [
                ...((Options["SelectMenu"] ?? true) ? [defineComponents(
                    {
                        ComponentType: "StringSelect",
                        CustomID: `${Options["Title"]}StringSelect`,
                        Placeholder: 'Select an Item...',
                        Options: List
                            .filter((Item): ListItemType | undefined => {
                                if (
                                    List.indexOf(Item) >= (Options["Page"] - 1) * 25 &&
                                    List.indexOf(Item) <= (25 * Options["Page"]) - 1
                                ) return Item;
                                else return;
                            })
                            .map((Item) => { return Content(Item, List.indexOf(Item), List)[1]; })
                    }
                )] : []),
                defineComponents(
                    {
                        ComponentType: "Button",
                        CustomID: `${Options["Title"]}Paginate`,
                        Label: '<< Previous',
                        Disabled: (Options["Page"] - 1) <= 0,
                        ButtonStyle: "Primary",
                        Data: { Page: Options["Page"] - 1 }
                    },
                    {
                        ComponentType: "Button",
                        CustomID: `${Options["Title"]}Paginate`,
                        Label: 'Next >>',
                        Disabled: List.length < Options["Page"] * 25,
                        ButtonStyle: "Primary",
                        Data: { Page: Options["Page"] + 1 }
                    }
                )
            ]
        };
    }

    async BuildInventoryItemEmbed(UserID: string, Item: number, Quantity: number): Promise<InteractionResponse> {
        const World = await WorldDatabase.Get(UserID);
        const Island = World["Islands"].filter((Island) => {
            const ShopItems = Island["Shop"]["Items"].map((Item) => { return Item["Quantity"] > 0 ? Item["Item"] : 0 });
            return ShopItems.includes(Item)
        })[0];

        const item = Items.filter((item) => { return item["ID"] === Item })[0];

        return {
            embeds: [
                {
                    title: `${item["Emoji"]} ${Quantity > 1 ? Utils.Plural(item["Name"]) : item["Name"]} (×${Quantity})`,
                    description: item["Description"],
                    footer: {
                        text: stripIndent`
                            ${!item["BuyingDetails"] ? 'Can\'t be Bought!' : this.DisplayItemCost(Item, "Items", "BuyingDetails")}
                            ${!item["SellDetails"] ? 'Can\'t be Sold!' : this.DisplayItemCost(Item, "Items", "SellDetails")}
                        `
                    }
                }
            ],
            
            components: [
                defineComponents(
                    {
                        ComponentType: "Button",
                        CustomID: 'Buy',
                        Label: `Buy ${Island ? `(Available in Island ${Island["ID"]}'s Shop)` : '(Not Available in Shops)'}`,
                        Disabled: !item["BuyingDetails"] || !Island,
                        ButtonStyle: "Primary",
                        Data: { Island: (Island ?? { ID: 0 })["ID"], Item: Item }
                    },
                    {
                        ComponentType: "Button",
                        CustomID: 'Sell',
                        Label: 'Sell',
                        Disabled: !item['SellDetails'],
                        ButtonStyle: "Primary",
                        Data: { Item: Item }
                    }
                ),
                defineComponents(
                    {
                        ComponentType: "Button",
                        CustomID: 'Inventory',
                        Label: 'Back to Inventory',
                        ButtonStyle: "Secondary"
                    }
                )
            ],
        };
    }

    async BuildShopItemEmbed(UserID: string, Island: number, Item: number): Promise<InteractionResponse> {
        const World = await WorldDatabase.Get(UserID);

        const ShopItem = World["Islands"][Island - 1]["Shop"]["Items"].filter((ShopItem) => { return ShopItem["Item"] === Item })[0];
        const item = Items.filter((item) => { return item["ID"] === Item })[0];

        return {
            embeds: [
                {
                    title: `${item["Emoji"]} ${item["Name"]} (${ShopItem["Quantity"]} Available in Island ${Island}'s Shop)`,
                    description: item["Description"],
                    footer: { text: this.DisplayItemCost(Item, "Items", "BuyingDetails") }
                }
            ],
            
            components: [
                defineComponents(
                    {
                        ComponentType: "Button",
                        CustomID: 'Buy',
                        Label: 'Buy',
                        Disabled: !item["BuyingDetails"],
                        ButtonStyle: "Primary",
                        Data: { Island: Island, Item: Item }
                    }
                ),
                defineComponents(
                    {
                        ComponentType: "Button",
                        CustomID: 'Shop',
                        Label: 'Back to Shop',
                        ButtonStyle: "Secondary",
                        Data: { Island: Island }
                    }
                )
            ],
        };
    }

    async BuildTileInfoEmbed(Data: NavigationButtonData, Interactor: User): Promise<InteractionResponse> {
        const World = await WorldDatabase.Get(Data["User"]);
        const Tile = World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]];
        const _Tile = Tiles.filter((tile) => { return tile["ID"] === Tile["Tile"] })[0];

        return {
            embeds: [
                {
                    title: _Tile["Emoji"] + " " + _Tile["Name"],
                    description: `**${_Tile["Description"]}**`,
                    fields: Tile["Component"] ? [
                        { name: 'Level', value: String(Tile["Component"]["Level"]), inline: true },
                        { name: 'Workers', value: String(Tile["Component"]["Workers"]), inline: true },
                        { name: 'Last Salary Pay', value: String(time(Math.floor(Tile["Component"]["LastSalaryPay"] / 1000), "F")), inline: true },

                        { name: 'Production', value: _Tile["Production"] ? stripIndent`${
                            _Tile["Production"]?.map((Production) => {
                                const Item = Items.filter((Item) => { return Item["ID"] === Production })[0];
                                return `${Item["Emoji"]}×${(Tile["Component"]?.Workers as number) + (Tile["Component"]?.Level as number)}`
                            }).join(' ')
                        }/worker/min` : 'No Production' },

                        { name: 'Upgrade Cost', value: String(this.DisplayItemCost(Tile["Tile"], "Tiles", "Upgrade", true, Tile["Component"]["Level"] + 1)), inline: true },
                        { name: 'Salary', value: stripIndent`${
                            _Tile["Salary"]?.map((SalaryItem) => {
                                const Item = Items.filter((Item) => { return Item["ID"] === SalaryItem["Item"] })[0];
                                return `${Item["Emoji"]}×${SalaryItem["Quantity"]}`
                            }).join(' ')
                        }/worker/day`, inline: true }
                    ] : undefined
                }
            ],

            components: Tile["Component"] ? [
                defineComponents(
                    {
                        ComponentType: "Button",
                        CustomID: 'Upgrade',
                        Label: 'Upgrade',
                        ButtonStyle: "Primary",
                        Disabled: Data["User"] !== Interactor["id"],
                        Data: Data
                    },
                    {
                        ComponentType: "Button",
                        CustomID: 'Salary',
                        Label: 'Pay Salary',
                        ButtonStyle: "Primary",
                        Disabled: Data["User"] !== Interactor["id"],
                        Data: Data
                    }
                )
            ] : undefined
        };
    }

    BuildSettingEmbed(Setting: keyof Settings, Value: string): InteractionResponse {
        const _Setting = SETTINGS.filter((_Setting) => { return _Setting["Name"] === Setting })[0];

        return {
            embeds: [
                {
                    title: _Setting["Emoji"] + ' ' + _Setting["Name"],
                    description: _Setting["Description"],
                    fields: [{ name: 'Current Value', value: Value }]
                }
            ],
            components: [
                defineComponents(
                    _Setting["Type"] === "Choice" ? {
                        ComponentType: "StringSelect",
                        CustomID: 'UpdateSettingChoice',
                        Placeholder: 'Select a Option...',
                        Options: _Setting["Choices"]?.map((Choice, Index) => {
                            return { Label: Choice, Default: Value === Choice, Value: String(Index) };
                        }),
                        Data: {
                            Setting: _Setting["Name"]
                        }
                    } :
                    {
                        ComponentType: "Button",
                        CustomID: 'UpdateSettingCustom',
                        Label: 'Edit',
                        ButtonStyle: "Primary",
                        Data: {
                            Setting: _Setting["Name"]
                        }
                    }
                ),
                defineComponents(
                    {
                        ComponentType: "Button",
                        CustomID: 'Settings',
                        Label: 'Back to Settings',
                        ButtonStyle: "Secondary"
                    }
                )
            ]
        };
    }

    async BuildMarketplaceUserEmbed(User: string): Promise<InteractionResponse> {
        const Marketplace = await MarketplaceDatabase.Get('Global');
        const Settings = await SettingsDatabase.GetAll();
        const UserOffers = Marketplace["Offers"].filter((UserOffers) => { return UserOffers["User"] === User; })[0];

        if (UserOffers === undefined) return {
            content: `The Specified User has no Offers Available!`,
            ephemeral: true
        };

        const Reply = this.BuildListEmbed<typeof UserOffers["Items"][0]>(
            UserOffers["Items"],
            (Item, Index) => {
                const OfferItem = Items.filter((OfferItem) => { return OfferItem["ID"] === Item["Item"]["Item"]; })[0];
                const BuyItem = Items.filter((BuyItem) => { return BuyItem["ID"] === Item["Cost"]["Item"]; })[0];

                return [
                    `${(Index as number) + 1}. ${BuyItem["Emoji"]} ×${Item["Cost"]["Quantity"]} → ${OfferItem["Emoji"]} ×${Item["Item"]["Quantity"]} (Ends at **${String(time(Math.floor(Item["OfferEndTime"] / 1000), "F"))}**)`,
                    {
                        Label: `${BuyItem["Name"]} ×${Item["Cost"]["Quantity"]} → ${OfferItem["Name"]} ×${Item["Item"]["Quantity"]}`,
                        Description: `Offer Ends At ${(new Date(Item["OfferEndTime"]).toUTCString())}`,
                        Value: String(Index)
                    }
                ];
            },
            async (interaction) => {
                return await interaction.update(await this.BuildMarketplaceOfferEmbed(User, interaction.user.id, Number(interaction.values[0])));
            },
            { Title: `${Settings[User]["DisplayName"]}`, Page: 1 }
        );
        (Reply["components"] as APIActionRowComponent<APIMessageActionRowComponent>[]).push(
            defineComponents(
                {
                    ComponentType: "Button",
                    CustomID: 'Marketplace',
                    Label: 'Back to Marketplace',
                    ButtonStyle: "Secondary"
                }
            )
        );

        return Reply;
    }

    async BuildMarketplaceOfferEmbed(User: string, Interactor: string, Offer: number): Promise<InteractionResponse> {
        const Marketplace = await MarketplaceDatabase.Get('Global');
        const Settings = await SettingsDatabase.GetAll();
        const UserOffer = Marketplace["Offers"].filter((UserOffers) => { return UserOffers["User"] === User; })[0];

        if (UserOffer === undefined) return {
            content: `The Specified Offer doesn't Exist!`,
            ephemeral: true
        };

        const _Offer = UserOffer["Items"][Offer];

        const OfferItem = Items.filter((OfferItem) => { return OfferItem["ID"] === _Offer["Item"]["Item"]; })[0];
        const BuyItem = Items.filter((BuyItem) => { return BuyItem["ID"] === _Offer["Cost"]["Item"]; })[0];
        return {
            embeds: [
                {
                    title: `${Settings[User]["DisplayName"]}'s Offer ${Offer + 1}`,
                    description: `Ends at **${String(time(Math.floor(_Offer["OfferEndTime"] / 1000), "F"))}** (Your Timezone)`,
                    fields: [
                        { name: 'You Give:', value: `${BuyItem["Emoji"]} ${BuyItem["Name"]} ×${_Offer["Cost"]["Quantity"]}`, inline: true },
                        { name: 'Your Receive:', value: `${OfferItem["Emoji"]} ${OfferItem["Name"]} ×${_Offer["Item"]["Quantity"]}`, inline: true }
                    ]
                }
            ],
            components: [
                defineComponents(
                    {
                        ComponentType: "Button",
                        CustomID: 'BuyOffer',
                        Label: stripIndent`Buy ${User === Interactor ? '(You can\'t Buy Your Own Offer!)': '' }`,
                        ButtonStyle: "Primary",
                        Disabled: User === Interactor,
                        Data: { User: User, Offer: Offer }
                    }
                ),
                defineComponents(
                    {
                        ComponentType: "Button",
                        CustomID: 'MarketplaceUser',
                        Label: 'Back to User Offers',
                        ButtonStyle: "Secondary",
                        Data: { User: User }
                    }
                )
            ]
        };
    }

    async BuildMarketplaceManageEmbed(User: string): Promise<InteractionResponse> {
        const Marketplace = await MarketplaceDatabase.Get('Global');
        const Settings = await SettingsDatabase.GetAll();

        let UserOffers = Marketplace["Offers"].filter((UserOffers) => { return UserOffers["User"] === User; })[0];
        if (UserOffers === undefined) UserOffers = { User: User, Items: [] };

        const Reply = this.BuildListEmbed<typeof UserOffers["Items"][0]>(
            UserOffers["Items"],
            (Item, Index) => {
                const OfferItem = Items.filter((OfferItem) => { return OfferItem["ID"] === Item["Item"]["Item"]; })[0];
                const BuyItem = Items.filter((BuyItem) => { return BuyItem["ID"] === Item["Cost"]["Item"]; })[0];

                const ItemCostString = `${BuyItem["Emoji"]} ${BuyItem["Name"]} ×${Item["Cost"]["Quantity"]} → ${OfferItem["Emoji"]} ${OfferItem["Name"]} ×${Item["Item"]["Quantity"]}`;
                const EndsAtString = `(Ends at **${String(time(Math.floor(Item["OfferEndTime"] / 1000), "F"))}**)`;
                return [
                    stripIndent`${(Index as number) + 1}. ${ItemCostString} ${EndsAtString}`,
                    { Label: 'Item' }
                ];
            },
            (interaction) => {},
            { SelectMenu: UserOffers["Items"]["length"] !== 0, Title: Settings[User]["DisplayName"], Page: 1 }
        );

        if (UserOffers["Items"].length === 0) (Reply["embeds"] as APIEmbed[])[0]["description"] = `You do not have any Offers Available in the Marketplace!`;

        (Reply["components"] as APIActionRowComponent<APIMessageActionRowComponent>[]).splice(
            0, 0,
            defineComponents(
                {
                    ComponentType: "Button",
                    CustomID: 'OfferAdd',
                    Label: 'Add New Offer',
                    ButtonStyle: "Success",
                    Data: { User: User }
                }
            )
        )

        return Reply;
    }

    // Miscellaneous Utils
    EditInventory(InventoryList: World["Inventory"], Item: number, AddorRemove: "Add" | "Remove", Quantity: number): World["Inventory"] {
        const NewInventory: World["Inventory"] = [];
        let Done = false;

        InventoryList.forEach((InventoryItem, Index) => {
            if (InventoryItem["Item"] === Item) {
                Done = true;
                
                if (AddorRemove === "Add") NewInventory.push({ Item: Item, Quantity: InventoryItem["Quantity"] + Quantity });
                else {
                    if (InventoryItem["Quantity"] - Quantity === 0) InventoryList.splice(Index, 1);
                    else if (InventoryItem["Quantity"] - Quantity < 0) Done = false;
                    else NewInventory.push({ Item: Item, Quantity: InventoryItem["Quantity"] - Quantity });
                }
            } else NewInventory.push(InventoryItem);
        });

        if (!Done) {
            if (AddorRemove === "Add" && Quantity > 0) NewInventory.push({ Item: Item, Quantity: Quantity });
            else return [];
        }

        return NewInventory;
    }

    DisplayItemCost(ID: number, List: "Tiles" | "Items", Detail: "SellDetails" | "BuyingDetails" | "Upgrade", Emoji: boolean = false, UpgradeLevel?: number): string {
        const Filtered = (List === "Tiles" ? Tiles : Items).filter((_ID) => { return _ID["ID"] === ID })[0];

        return stripIndent`
            ${
                (List === "Tiles" ? this.GetUpgradeCost(Filtered["ID"], UpgradeLevel ?? 1) : (Filtered as Item)[Detail === "Upgrade" ? "BuyingDetails" : Detail])?.map((Detail) => {
                    const DetailItem = Items.filter((DetailItem) => { return DetailItem["ID"] === Detail["Item"]; })[0];

                    return `${Emoji ? DetailItem["Emoji"] : DetailItem["Name"]} ×${Detail["Quantity"]}`
                }).join(' ')
            }${Detail === "BuyingDetails" ? ` → ${Emoji ? Filtered["Emoji"] : Filtered["Name"]} ×1` : ''}
        `;
    }

    GetUpgradeCost(Buildable: number, Level: number): { Item: number, Quantity: number }[] | undefined {
        return Tiles.filter((Tile) => { return Tile["ID"] === Buildable; })[0]
            .BuyingDetails?.map((Detail) => {
                return { Item: Detail["Item"], Quantity: Detail["Quantity"] * Math.pow(2, Level - 1) };
            });
    }

    Pay(Inventory: World["Inventory"], CostItems: { Item: number, Quantity: number }[]): [World["Inventory"], string] {
        const NewInventory: World["Inventory"] = Inventory;
        let Done = false;
        let Message: string = '';
        CostItems.forEach(async (Cost) => {
            const Temp = this.EditInventory(Inventory, Cost["Item"], "Remove", Cost["Quantity"]);

            if (Temp["length"] === 0) {
                const Item = Items.filter((Item) => { return Item["ID"] === Cost["Item"] })[0];

                Done = false;
                Message = `You don't have enough ${Item["Emoji"]} ${Item["Name"]} to Complete this Payment!`!;
                return false;
            }
            else {
                Temp.forEach((InvItem) => {
                    NewInventory.forEach((NewInvItem) => {
                        if (NewInvItem["Item"] === InvItem["Item"]) NewInvItem["Quantity"] = InvItem["Quantity"];
                    });
                });
                Done = true;
            }
        })

        return [
            Done ? NewInventory : Inventory,
            Message
        ];
    }

    async InteractionUserCheck(Interaction: ButtonInteraction | AnySelectMenuInteraction): Promise<boolean> {
        const Message = Interaction.message;
        const Reference = Interaction.message.reference;

        const UnusableResponse: InteractionResponse = {
            content: `The ${ComponentType[Interaction.componentType]} can't be Used by You!`,
            ephemeral: true
        };
        if (Interaction.isButton() || Interaction.isAnySelectMenu()) {
            if (Message === null) {
                const Guild = await Interaction.client.guilds.fetch(Reference?.guildId as string);
                const Channel = (await Guild.channels.fetch(Reference?.channelId as string)) as TextChannel;
                const RepliedMessage = await Channel.messages.fetch(Reference?.messageId as string);

                if (RepliedMessage.interaction?.user.id === Interaction.user.id) return true;
                else {
                    await Interaction.reply(UnusableResponse);
                    return false;
                }
            }
            else if (Interaction.user.id !== (Message.interaction?.user.id as string)) {
                await Interaction.reply(UnusableResponse);
                return false;
            }
            else return true;
        }
        else return true;
    }
}

export const Utils = new Util();