import { APIEmbed, ButtonInteraction, InteractionReplyOptions, InteractionUpdateOptions, StringSelectMenuInteraction, User } from "discord.js";
import { Items, Tiles } from "./data.js";
import { WorldDatabase } from "./../commands/world.js";
import defineComponents, { Component, SelectMenuOption } from "./Bot/components.js";
import defineEvent from "./Bot/events.js";

interface NavigationButtonData {
    User: string,
    Island: number,
    Position: [number, number],
    Explore: boolean,
    Tile: number
};

class WorldUtil {
    CreateWorld(Width: number, Height: number): { Tile: number, Component?: number }[][] {
        const World: { Tile: number, Component?: number }[][] = [];

        for (let i = 0; i < Height; i++) {
            const WorldChunk: typeof World[0] = [];

            for (let j = 0; j < Width; j++) {
                if (j + 1 === 1 || j + 1 === Width) WorldChunk.push({ Tile: 1 });
                else WorldChunk.push({ Tile: (j % 4) + (j % 4 === 0 ? 1 : 0) + (j % 4 === 3 ? -1 : 0) });
            }

            World.push(WorldChunk);
        }

        return World;
    }

    RenderWorld(World: { Tile: number, Component?: number }[][], Position: [number, number], FOV: [number, number] = [5, 5]): string {
        let message = '';

        for (let i = Position[0] - Math.ceil(FOV[0] / 2); i < (Position[0] + Math.ceil(FOV[0] / 2)) - 1; i++) {
            for (let j = Position[1] - Math.ceil(FOV[1] / 2); j < (Position[1] + Math.ceil(FOV[1] / 2)) - 1; j++) {
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
                Position: [Data["Position"][0] + Move[0], Data["Position"][1] + Move[1]],
                Explore: Data["Explore"],
                Tile: Data["Tile"]
            }
        );
    }
};

class BotUtil {
    async BuildHomeScreen(User: User, Island: number, Outpost?: number): Promise<InteractionReplyOptions & InteractionUpdateOptions> {
        if (User.bot) return {
            content: 'Bots can not have an Industrial World!',
            ephemeral: true
        };

        const World = await WorldDatabase.Get(User.id);

        if (!World) return {
            content: 'Looks like the specified User does not have an Industrial World!',
            ephemeral: true
        };

        if(World["Visibility"] === "Private") return {
            content: 'The Specified User\'s Industrial World is Private',
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
                        Style: "Primary",
                        Data: {
                            User: User.id,
                            Island: Island,
                            Position: World["Islands"][Island - 1]["Outposts"].filter((Outpost) => { return Outpost["Default"] })[0]["Location"],
                            Explore: true,
                            Tile: World["Islands"][Island - 1]["Tiles"]
                                [World["Islands"][Island - 1]["Outposts"][Outpost - 1]["Location"][0]]
                                [World["Islands"][Island - 1]["Outposts"][Outpost - 1]["Location"][1]]["Tile"]
                        }
                    },
                    {
                        ComponentType: "Button",
                        CustomID: 'GetOfflineEarnings',
                        Label: 'Get Offline Earnings',
                        Emoji: '💵',
                        Style: "Primary"
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
                        ]
                    }
                ),
                defineComponents(
                    
                    {
                        ComponentType: "StringSelect",
                        CustomID: 'OutpostSelect',
                        Placeholder: 'Select an Outpost...',
                        Options: World["Islands"][Island - 1]["Outposts"].map((Ouptost, Index) => {
                            return {
                                Label: `Outpost ${Index + 1}`,
                                Default: Ouptost["Default"],
                                Emoji: '🔭'
                            }
                        })
                    }
                )
            ],
            ephemeral: World["Visibility"] !== "Public"
        };
    }

    async BuildNavigation(Data: NavigationButtonData): Promise<InteractionReplyOptions & InteractionUpdateOptions> {
        let BuildInfo: { DisableConfirm: boolean, DisableReason: string } = {
            DisableConfirm: false,
            DisableReason: 'Good to Go!'
        };

        const World = await WorldDatabase.Get(Data["User"]);

        if (Data["Explore"]) Data["Tile"] = World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]]["Tile"];

        if (
            World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]]["Tile"] !==
            Tiles.filter((Tile) => { return Tile["ID"] === Data["Tile"] })[0]["BuildableOn"]
        ) BuildInfo = {
            DisableConfirm: true,
            DisableReason: 'Invalid Tile!'
        };

        World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]]["Tile"] = Data["Tile"];

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
                Data["Explore"] ? defineComponents(
                    {
                        ComponentType: "Button",
                        CustomID: 'Build',
                        Label: "Build",
                        Emoji: '🛠️',
                        Style: "Primary",
                        Data: Data
                    },
                    {
                        ComponentType: "Button",
                        CustomID: 'ItemUse',
                        Label: 'Use Item',
                        Style: "Primary"
                    }
                ) : defineComponents(
                    {
                        ComponentType: "Button",
                        Label: BuildInfo["DisableReason"],
                        Disabled: true,
                        Style: "Primary"
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
                                Style: "Secondary",
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
                        Style: "Secondary",
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
                        Style: "Primary",
                        Data: { Page: Options["Page"] - 1 }
                    },
                    {
                        ComponentType: "Button",
                        CustomID: `${Options["EmbedTitle"]}Paginate`,
                        Label: 'Next >>',
                        Disabled: List.length < Options["Page"] * 25,
                        Style: "Primary",
                        Data: { Page: Options["Page"] + 1 }
                    }
                )
            ]
        };
    }

    BuildInvenotryItemEmbed(Item: number, Quantity: number): InteractionReplyOptions & InteractionUpdateOptions {
        const item = Items.filter((item) => { return item["ID"] === Item })[0];

        return {
            embeds: [
                {
                    title: `${item["Emoji"]} ${item["Name"]} (x${Quantity})`,
                    description: item["Description"]
                }
            ],
            
            components: [
                defineComponents(
                    {
                        ComponentType: "Button",
                        CustomID: 'Inventory',
                        Label: 'Back to Inventory',
                        Style: "Secondary"
                    }
                )
            ]
        };
    }
}

export const WorldUtils = new WorldUtil();
export const BotUtils = new BotUtil();