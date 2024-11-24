import { StringSelectMenuInteraction } from "discord.js";

import { NavigationButtonData, Utils } from "./Utilities.js";
import { Settings } from "commands/settings.js";

type ItemQuantityPair = { Item: number, Quantity: number };

export interface Tile {
    ID: number,
    Name: string,
    Description: string,
    Emoji: string,
    Spawnable?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
    Buildable?: boolean,
    BuildableOn?: number,
    BuyingDetails?: ItemQuantityPair[],
    DestroyReplace?: number,
    DestroyGive?: ItemQuantityPair[],
    Salary?: ItemQuantityPair[],
    Production?: { Item: number, Consumption?: ItemQuantityPair }[]
};

export interface Biome {
    ID: number,
    Name: string,
    Tiles: number[],
    SpawningChance: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
}

export interface Item {
    ID: number,
    Name: string,
    Description: string,
    Emoji: string,
    SellDetails?: ItemQuantityPair[],
    BuyingDetails?: ItemQuantityPair[],
    Usable?: (interaction: StringSelectMenuInteraction, Data: NavigationButtonData) => Promise<void>
};

export const GameData: { Tiles: Tile[], Biomes: Biome[], Items: Item[], Settings: Setting[] } = {
    Tiles: [
        {
            ID: 1,
            Name: 'Water',
            Description: 'A Pool of a Covalent Chemical Compound formed when Two Atoms of Hydrogen and One Atom of Oxygen share their Electrons',
            Emoji: '<:Water:1302578527329320960>',
            Spawnable: 7
        },
        {
            ID: 2,
            Name: 'Land',
            Description: 'Just a Piece of 124×124 Pixels Big Piece of Just Grass... Just Grass... (Mooooo... Bahhhh.... Don\'t let Your Livestock come Here! I made a Mistake You See)',
            Emoji: '<:Land:1170322862276608100>',
            Spawnable: 10
        },
        {
            ID: 3,
            Name: 'Outpost',
            Description: '',
            Emoji: '<:Outpost:1182330497288900728>',
            Buildable: true,
            BuildableOn: 2
        },
        {
            ID: 4,
            Name: 'Shop',
            Description: '',
            Emoji: '<:Shop:1306904457216262224>',
            Buildable: true,
            BuildableOn: 2,
            DestroyReplace: 2,
            BuyingDetails: [
                { Item: 1, Quantity: 100 },
                { Item: 4, Quantity: 10 }
            ],
            Salary: [
                { Item: 1, Quantity: 10 }
            ]
        },
        {
            ID: 5,
            Name: 'Port',
            Description: '',
            Emoji: '<:Land:1170322862276608100>',
            Buildable: true,
            BuildableOn: 1,
            DestroyReplace: 1,
            BuyingDetails: [
                { Item: 1, Quantity: 100 },
                { Item: 4, Quantity: 10 }
            ],
            Salary: [
                { Item: 1, Quantity: 10 }
            ]
        },
        {
            ID: 6,
            Name: 'Trees',
            Description: '',
            Emoji: '<:Trees:1170322946213036052>',
            Spawnable: 9,
            DestroyReplace: 2,
            DestroyGive: [
                { Item: 4, Quantity: 2 }
            ]
        },
        {
            ID: 7,
            Name: 'WoodCutter Hut',
            Description: '',
            Emoji: '<:WoodcutterHut:1170322950201815091>',
            Buildable: true,
            BuildableOn: 6,
            BuyingDetails: [
                { Item: 1, Quantity: 5 },
                { Item: 4, Quantity: 5 }
            ],
            DestroyReplace: 4,
            DestroyGive: [
                { Item: 1,  Quantity: 2 }
            ],
            Salary: [
                { Item: 1, Quantity: 5 }
            ],
            Production: [ { Item: 4 } ]
        },
        {
            ID: 8,
            Name: 'Stone',
            Description: '',
            Emoji: '<:Stone:1170322935794372608>',
            Spawnable: 9,
            DestroyReplace: 2
        },
        {
            ID: 9,
            Name: 'Coal',
            Description: '',
            Emoji: '<:Coal:1170322867473350686>',
            Spawnable: 7,
            DestroyReplace: 2
        },
        {
            ID: 10,
            Name: 'Plank Cutter',
            Description: '',
            Emoji: '<:PlankCutter:1306904454855000094>',
            Buildable: true,
            BuildableOn: 2,
            BuyingDetails: [
                { Item: 1, Quantity: 5 },
                { Item: 4, Quantity: 5 }
            ],
            DestroyReplace: 2,
            DestroyGive: [
                { Item: 1,  Quantity: 2 }
            ],
            Salary: [
                { Item: 1, Quantity: 5 }
            ],
            Production: [ { Item: 5, Consumption: { Item: 4, Quantity: 2 } } ]
        }
    ],

    Biomes: [
        {
            ID: 1,
            Name: 'Plains',
            Tiles: [ 2 ],
            SpawningChance: 1
        },
        {
            ID: 2,
            Name: 'Forest',
            Tiles: [ 1, 6 ],
            SpawningChance: 9
        },
        {
            ID: 3,
            Name: 'Stony Fields',
            Tiles: [ 8, 9 ],
            SpawningChance: 8
        }
    ],

    Items: [
        {
            ID: 1,
            Name: 'Coin',
            Description: 'A Shiny, Golden and Circular In-Game Currency for Industroz.',
            Emoji: '🪙',
            Usable: async (interaction, Data) => {
                await interaction.reply(await Utils.PaySalary(Data));
            }
        },
        {
            ID: 2,
            Name: 'Axe',
            Description: 'A Sharp Piece of Metal attached to a Wooden Stick used to Destroy Wooden Things.',
            Emoji: '🪓',
            BuyingDetails: [
                { Item: 1, Quantity: 1 }
            ],
            SellDetails: [
                { Item: 1, Quantity: 2 }
            ],
            Usable: async (interaction, Data) => {
                const Reply = await Utils.DestroyTile(Data, interaction.user, "Axe");
                if (Reply[0] === "Reply") await interaction.reply(Reply[1]);
                else if (Reply[0] === "Update") await interaction.update(Reply[1]);
            }
        },
        {
            ID: 3,
            Name: 'Pickaxe',
            Description: 'A Hard Piece of Metal attached to a Wooden Stick used to Destroy Stone-Like Materials.',
            Emoji: '⛏️',
            Usable: async (interaction, Data) => {
                const Reply = await Utils.DestroyTile(Data, interaction.user, "Pickaxe");
                if (Reply[0] === "Reply") await interaction.reply(Reply[1]);
                else if (Reply[0] === "Update") await interaction.update(Reply[1]);
            }
        },
        {
            ID: 4,
            Name: 'Wood',
            Description: 'A Long and Thick Piece of Material obtained by Destroying Trees.',
            Emoji: '🪵'
        },
        {
            ID: 5,
            Name: 'Wood Planks',
            Description: '',
            Emoji: '<:WoodenPlanks:1306904459929976892>'
        }
    ],

    Settings: [
        {
            Name: 'Visibility',
            Description: 'Makes your Industrial World either Visible (Public) or Hidden (Private) to Others',
            Emoji: '👀',
            Type: "Choice",
            Choices: ["Public", "Private"],
        },
        {
            Name: 'DisplayName',
            Description: 'Changes your Industroz Display Name that shows up in Embeds',
            Emoji: '🪪',
            Type: "Custom"
        }
    ]
}

export interface Setting {
    Name: keyof Settings,
    Description: string,
    Emoji: string,
    Type: "Custom" | "Choice",
    Choices?: string[]
};