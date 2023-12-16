import { StringSelectMenuInteraction } from "discord.js";
import { BotUtils, NavigationButtonData } from "./utils.js";

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
    Production?: number[]
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

export const Tiles: Tile[] = [
    {
        ID: 1,
        Name: 'Water',
        Description: 'An Pool of a Covalent Chemical Compound formed when Two Atoms of Hydrogen and One Atom of Oxygen share their Electrons',
        Emoji: '<:Water:1178629196822622289>',
        Spawnable: 7
    },
    {
        ID: 2,
        Name: 'Land',
        Description: 'Just a Piece of 124×124 Pixels Big Piece of just Grass... Just Grass... (Mooooo... Bahhhh.... Don\'t let Your Livestock come Here! I made a Mistake you See)',
        Emoji: '<:Land1111:1170322862276608100>',
        Spawnable: 10
    },
    {
        ID: 3,
        Name: 'Outpost',
        Description: '',
        Emoji: '<:Outpost:1182330497288900728>',
        Buildable: true
    },
    {
        ID: 4,
        Name: 'Trees',
        Description: '',
        Emoji: '<:Land1111Trees:1170322946213036052>',
        Spawnable: 9,
        DestroyReplace: 2,
        DestroyGive: [
            {
                Item: 1,
                Quantity: 2
            }
        ]
    },
    {
        ID: 5,
        Name: 'WoodCutter Hut',
        Description: '',
        Emoji: '<:Land1111WoodcutterHut:1170322950201815091>',
        Buildable: true,
        BuildableOn: 4,
        BuyingDetails: [
            {
                Item: 1,
                Quantity: 5
            }
        ],
        DestroyReplace: 4,
        DestroyGive: [
            {
                Item: 1,
                Quantity: 2
            }
        ],
        Production: [ 4 ]
    },
    {
        ID: 6,
        Name: 'Stone',
        Description: '',
        Emoji: '<:Land1111Stone:1170322935794372608>',
        Spawnable: 9,
        DestroyReplace: 2
    },
    {
        ID: 7,
        Name: 'Coal',
        Description: '',
        Emoji: '<:Land1111Coal:1170322867473350686>',
        Spawnable: 7,
        DestroyReplace: 2
    }
];

export const Biomes: Biome[] = [
    {
        ID: 1,
        Name: 'Forest',
        Tiles: [ 1, 4 ],
        SpawningChance: 9
    },
    {
        ID: 2,
        Name: 'Stony Fields',
        Tiles: [ 6, 7 ],
        SpawningChance: 8
    }
];

export const Items: Item[] = [
    {
        ID: 1,
        Name: 'Coin',
        Description: 'A Shiny, Golden and Circular In-Game Currency for Industroz.',
        Emoji: '🪙'
    },
    {
        ID: 2,
        Name: 'Axe',
        Description: 'A Sharp Piece of Metal attached to a Wooden Stick used to Destroy Wooden Things.',
        Emoji: '🪓',
        BuyingDetails: [
            {
                Item: 1,
                Quantity: 1
            }
        ],
        Usable: async (interaction, Data) => { await BotUtils.DestroyTile(interaction, Data, "Axe"); }
    },
    {
        ID: 3,
        Name: 'Pickaxe',
        Description: 'A Hard Piece of Metal attached to a Wooden Stick used to Destroy Stone-Like Materials.',
        Emoji: '⛏️',
        Usable: async (interaction, Data) => { await BotUtils.DestroyTile(interaction, Data, "Pickaxe"); }
    },
    {
        ID: 4,
        Name: 'Wood',
        Description: 'A Long and Thick Piece of Material obtained by Destroying Trees.',
        Emoji: '🪵'
    }
];