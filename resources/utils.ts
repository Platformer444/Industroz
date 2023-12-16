import { ButtonInteraction, InteractionReplyOptions, InteractionUpdateOptions, StringSelectMenuInteraction, User, time } from "discord.js";
import { Biome, Biomes, Items, Tiles } from "./data.js";
import { World, WorldDatabase } from "./../commands/world.js";
import { defineComponents, Component, SelectMenuOption } from "./Bot/components.js";
import defineEvent from "./Bot/events.js";
import { stripIndent } from "common-tags";

export interface NavigationButtonData {
    User: string,
    Island: number,
    Position: [number, number]
};

class WorldUtil {
    CreateWorld(Width: number, Height: number, DefaultOutpostPosition: [number, number] = [(Height / 2) - 1, (Width / 2) - 1]): World["Islands"][0]["Tiles"] {
        const World: World["Islands"][0]["Tiles"] = [];

        const _Biomes: Biome[] = [];
        let BiomeWidth: number = 10;
        let BiomeHeight: number = 10;

        while (_Biomes["length"] < (Width * Height) / (BiomeWidth * BiomeHeight)) Biomes.forEach((Biome) => {
            if (BotUtils.RandomNumber(0, 10 - (Biome["SpawningChance"] ?? 10)) === 0) _Biomes.push(Biome);
        });

        for (let i = 0; i < Height; i++) {
            const WorldChunk: World["Islands"][0]["Tiles"][0] = [];

            for (let j = 0; j < Width; j++) {
                const Biome = _Biomes[Math.floor(j / BiomeWidth) + Math.floor(i / BiomeHeight)] ?? { Tiles: [ 2 ] };

                const Tile = Biome["Tiles"].filter((Tile) => {
                    const _Tile = Tiles.filter((_Tile) => { return _Tile["ID"] === Tile })[0];
                    return BotUtils.RandomNumber(0, 10 - (_Tile["Spawnable"] ?? 10)) === 0;
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

    async NavigateWorld(Data: NavigationButtonData, Move: [number, number]): Promise<InteractionReplyOptions & InteractionUpdateOptions> {
        return await BotUtils.BuildNavigation(
            {
                User: Data["User"],
                Island: Data["Island"],
                Position: [Data["Position"][0] + Move[0], Data["Position"][1] + Move[1]]
            }
        );
    }
};

class BotUtil {
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

    async BuildHomeScreen(User: User, Island: number, Outpost?: number): Promise<InteractionReplyOptions & InteractionUpdateOptions> {
        if (User.bot) return {
            content: 'Bots can not have an Industrial World!',
            ephemeral: true
        };

        const World = await WorldDatabase.Get(User["id"]);

        if (!World) return {
            content: 'Looks like the specified User does not have an Industrial World!',
            ephemeral: true
        };

        if(World["Visibility"] === "Private") return {
            content: 'The Specified User\'s Industrial World is Private!',
            ephemeral: true
        };

        if (Island > World["Islands"].length) Island = 1;

        Outpost = Outpost ?? 
            World["Islands"][Island - 1]["Outposts"].indexOf(
                World["Islands"][Island - 1]["Outposts"].filter((Outpost) => { return Outpost["Default"] })[0]
            ) + 1;

        return {
            content: WorldUtils.RenderWorld(
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
            ephemeral: World["Visibility"] !== "Public"
        };
    }

    async BuildNavigation(Data: NavigationButtonData): Promise<InteractionReplyOptions & InteractionUpdateOptions> {
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

        return {
            content: WorldUtils.RenderWorld(
                World["Islands"][Data["Island"] - 1]["Tiles"],
                Data["Position"]
            ),
            components: [
                defineComponents(
                    {
                        ComponentType: "Button",
                        CustomID: 'TileInfo',
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
                        Data: Data
                    },
                    {
                        ComponentType: "Button",
                        CustomID: 'ItemUse',
                        Label: 'Use Item',
                        ButtonStyle: "Primary",
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
            EmbedTitle: string,
            Page: number
        }
    ): InteractionReplyOptions & InteractionUpdateOptions {
        defineEvent({
            Event: "interactionCreate",
            Name: `${Options["EmbedTitle"]} Paginate Event`,
            Once: false,
            Execute: async (interaction: ButtonInteraction) => {
                if (interaction.isButton()) {
                    const PaginateID = interaction["customId"].split('$')[0];
                    const Page = parseInt(JSON.parse(interaction["customId"].split('$')[1])["Page"]);

                    if (PaginateID === `${Options["EmbedTitle"]}Paginate`) return await interaction.update(this.BuildListEmbed<ListItemType>(
                        List, Content, SelectInteractionExecute,
                        { ...Options, Page: Page }
                    ));
                }
            }
        });

        defineEvent({
            Event: "interactionCreate",
            Name: `${Options["EmbedTitle"]} StringSelectMenu Event`,
            Once: false,
            Execute: async (interaction: StringSelectMenuInteraction) => {
                if (interaction.isStringSelectMenu()) {
                    if (interaction["customId"].split('$')[0] === `${Options["EmbedTitle"]}StringSelect`) return await SelectInteractionExecute(interaction);
                }
            }
        });

        return {
            embeds: [
                {
                    title: Options["EmbedTitle"],
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
            ],
            
            components: [
                defineComponents(
                    {
                        ComponentType: "StringSelect",
                        CustomID: `${Options["EmbedTitle"]}StringSelect`,
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
                ),
                defineComponents(
                    {
                        ComponentType: "Button",
                        CustomID: `${Options["EmbedTitle"]}Paginate`,
                        Label: '<< Previous',
                        Disabled: false,
                        ButtonStyle: "Primary",
                        Data: { Page: Options["Page"] - 1 }
                    },
                    {
                        ComponentType: "Button",
                        CustomID: `${Options["EmbedTitle"]}Paginate`,
                        Label: 'Next >>',
                        Disabled: List.length < Options["Page"] * 25,
                        ButtonStyle: "Primary",
                        Data: { Page: Options["Page"] + 1 }
                    }
                )
            ]
        };
    }

    BuildInventoryItemEmbed(Item: number, Quantity: number): InteractionReplyOptions & InteractionUpdateOptions {
        const item = Items.filter((item) => { return item["ID"] === Item })[0];

        return {
            embeds: [
                {
                    title: `${item["Emoji"]} ${Quantity > 1 ? BotUtils.Plural(item["Name"]) : item["Name"]} (×${Quantity})`,
                    description: item["Description"],
                    footer: {
                        text: stripIndent`
                            ${!item["BuyingDetails"] ? 'Can\'t be Bought!' : this.DisplayItemCost(Item, "Buy")}
                            ${!item["SellDetails"] ? 'Can\'t be Sold!' : this.DisplayItemCost(Item, "Sell")}
                        `
                    }
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
                        Data: { Item: Item }
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

    EditInventory(InventoryList: World["Inventory"], Item: number, AddorRemove: "Add" | "Remove", Quantity: number): World["Inventory"] {
        const NewInventory: World["Inventory"] = [];
        let Done: boolean = false;

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
            if (AddorRemove === "Add") NewInventory.push({ Item: Item, Quantity: Quantity });
            else return [];
        }

        return NewInventory;
    }

    async DestroyTile(interaction: StringSelectMenuInteraction, Data: NavigationButtonData, Tool: "Axe" | "Pickaxe") {
        const AxeBreakableBlocks = [ 6, 7 ];
        const PickaxeBreakableBlocks = [ 6, 7 ];
        const World = await WorldDatabase.Get(Data["User"]);
        const CurrentTile = World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]]["Tile"];

        if ((Tool === "Axe" ? AxeBreakableBlocks : PickaxeBreakableBlocks).includes(CurrentTile as number)) {
            const Tile = Tiles.filter((Tile) => { return Tile["ID"] === CurrentTile })[0];

            World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]]["Tile"] = Tile["DestroyReplace"] ?? 2;

            Tile["DestroyGive"]?.forEach((Item) => { World["Inventory"] = BotUtils.EditInventory(World["Inventory"], Item["Item"], "Add", Item["Quantity"]); });

            await WorldDatabase.Set(Data["User"], World);
            await interaction.update(await BotUtils.BuildNavigation(Data));
        }
        else await interaction.reply({
            content: `${Tool} can't be used on that Tile!`,
            ephemeral: true
        });
    }

    BuildShopItemEmbed(Item: number): InteractionReplyOptions & InteractionUpdateOptions {
        const item = Items.filter((item) => { return item["ID"] === Item })[0];

        return {
            embeds: [
                {
                    title: `${item["Emoji"]} ${item["Name"]}`,
                    description: item["Description"],
                    footer: {
                        text: this.DisplayItemCost(Item, "Buy")
                    }
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
                        Data: { Item: Item }
                    }
                )
            ],
        };
    }

    DisplayItemCost(Item: number, Detail: "Sell" | "Buy"): string {
        const item = Items.filter((item) => { return item["ID"] === Item })[0];

        return stripIndent`
            ${
                item[Detail === "Sell" ? "SellDetails" : "BuyingDetails"]?.map((Detail) => {
                    const DetailItem = Items.filter((DetailItem) => { return DetailItem["ID"] === Detail["Item"]; })[0];

                    return `${DetailItem["Name"]} ×${Detail["Quantity"]}`
                }).join(' ')
            } → ${item["Name"]} ×1
        `;
    }

    BuildTileInfoEmbed(Tile: number, ComponentData: World["Islands"][0]["Tiles"][0][0]["Component"]): InteractionReplyOptions & InteractionUpdateOptions {
        const _Tile = Tiles.filter((tile) => { return tile["ID"] === Tile })[0];

        return {
            embeds: [
                {
                    title: _Tile["Emoji"] + " " + _Tile["Name"],
                    description: `**${_Tile["Description"]}**`,
                    fields: ComponentData ? [
                        { name: 'Level', value: String(ComponentData["Level"]), inline: true },
                        { name: 'Workers', value: String(ComponentData["Workers"]), inline: true },
                        { name: 'Last Salary Pay', value: String(time(Math.floor(ComponentData["LastSalaryPay"] / 1000), "F")), inline: true },

                        { name: 'Production', value: 'Lol' }
                    ] : undefined
                }
            ],

            components: ComponentData ? [
                defineComponents(
                    {
                        ComponentType: "Button",
                        CustomID: 'Upgrade',
                        Label: 'Upgrade',
                        ButtonStyle: "Primary"
                    },
                    {
                        ComponentType: "Button",
                        CustomID: 'Salary',
                        Label: 'Pay Salary',
                        ButtonStyle: "Primary"
                    }
                )
            ] : undefined
        };
    }
}

export const WorldUtils = new WorldUtil();
export const BotUtils = new BotUtil();