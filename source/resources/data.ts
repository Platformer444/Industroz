import "dotenv/config";

// Bot Data
export const BotAuthor = '953562105339056168';
export const BotVersion = '1.0.0-beta';
export const DiscordJSVersion = '14.11.0';

export interface Setting {
    settingId: string,
    settingName: string,
    settingDescription: string,
    type: "Choice" | "Custom",
    editable: boolean,
    default?: string | undefined,
    choices?: string[] | undefined
}

export const SETTINGS: Setting[] = [
    {
        settingId: 'worldVisibility',
        settingName: 'World Visibility',
        settingDescription: 'Makes your World either Visible to Others(Public) or not(Private)',
        type: "Choice",
        editable: true,
        choices: [
            "Public",
            "Private"
        ]
    }
]

// Game Data
export interface Tile {
    tileId: number,
    tileName: string,
    connections: number[],
    component?: number,
    emoji: string,
    canBuiltOn?: number | undefined,
    destroyReplace?: number | undefined,
    destroyGive?: {
        item: number,
        amount: number
    }[] | undefined
};

export interface Component {
    componentId: number,
    componentName: string,
    spawnable: boolean,
    buildable: boolean,
    buyingDetails?: {
        item: number,
        amount: number
    }[] | undefined,
    production?: {
        item: number,
        amount: number
    }[] | undefined
};

export interface Item {
    itemId: number,
    itemName: string,
    emoji: string,
    description: string,
    sellable: boolean,
    sellGive?: {
        item: number,
        amount: number
    } | undefined
}

export const TILES: Tile[] = [
    {
        tileId: 1,
        tileName: 'Water',
        connections: [1, 1, 1, 1],
        emoji: '<:Water:1096363049138524182>'
    },
    {
        tileId: 2,
        tileName: 'Land1111',
        connections: [1, 1, 1, 1],
        emoji: '<:Land1111:1096373375556911146>'
    },
    {
        tileId: 3,
        tileName: 'Land1110',
        connections: [1, 1, 1, 0],
        emoji: '<:Land1110:1097069777786257438>'
    },
    {
        tileId: 4,
        tileName: 'Land1101',
        connections: [1, 1, 0, 1],
        emoji: '<:Land1101:1097069768466497556>'
    },
    {
        tileId: 5,
        tileName: 'Land1100',
        connections: [1, 1, 0, 0],
        emoji: '<:Land1100:1097069762833567788>'
    },
    {
        tileId: 6,
        tileName: 'Land1011',
        connections: [1, 0, 1, 1],
        emoji: '<:Land1011:1097069772375601153>'
    },
    {
        tileId: 7,
        tileName: 'Land1001',
        connections: [1, 0, 0, 1],
        emoji: '<:Land1001:1097069758446317579>'
    },
    {
        tileId: 8,
        tileName: 'Land0111',
        connections: [0, 1, 1, 1],
        emoji: '<:Land0111:1096375339724312647>'
    },
    {
        tileId: 9,
        tileName: 'Land0110',
        connections: [0, 1, 1, 0],
        emoji: '<:Land0110:1097067479265718293>'
    },
    {
        tileId: 10,
        tileName: 'Land0011',
        connections: [0, 0, 1, 1],
        emoji: '<:Land0011:1097067474308055061>'
    },
    {
        tileId: 11,
        tileName: 'Land0010',
        connections: [0, 0, 1, 0],
        emoji: '<:Land0010:1097067470159872000>'
    },
    {
        tileId: 12,
        tileName: 'Land1111Trees',
        connections: [1, 1, 1, 1],
        component: 1,
        emoji: '<:Land1111Trees:1100724435452956684>',
        destroyReplace: 2,
        destroyGive: [
            {
                item: 2,
                amount: 1
            }
        ]
    },
    {
        tileId: 13,
        tileName: 'Land1111WoodcutterHut',
        connections: [1, 1, 1, 1],
        component: 2,
        emoji: '<:Land1111WoodcutterHut:1109051386257211392>',
        canBuiltOn: 12,
        destroyReplace: 2,
        destroyGive: [
            {
                item: 1,
                amount: 90
            }
        ]
    },
    {
        tileId: 14,
        tileName: 'Land1111Stone',
        connections: [1, 1, 1, 1],
        component: 3,
        emoji: '<:Land1111Stone:1123626369432178708>',
        destroyReplace: 2,
        destroyGive: [
            {
                item: 3,
                amount: 1
            }
        ]
    },
    {
        tileId: 15,
        tileName: 'Land1111StoneDriller',
        connections: [1, 1, 1, 1],
        component: 4,
        emoji: '<:Land1111StoneDriller:1123626371831320708>',
        canBuiltOn: 14,
        destroyReplace: 2,
        destroyGive: [
            {
                item: 1,
                amount: 135
            }
        ]
    }
];

export const COMPONENTS: Component[] = [
    {
        componentId: 1,
        componentName: 'Trees',
        spawnable: true,
        buildable: false
    },
    {
        componentId: 2,
        componentName: 'Woodcutter House',
        spawnable: false,
        buildable: true,
        buyingDetails: [
            {
                item: 1,
                amount: 100
            }
        ],
        production: [
            {
                item: 2,
                amount: 1
            }
        ]
    },
    {
        componentId: 3,
        componentName: 'Stone',
        spawnable: true,
        buildable: false
    },
    {
        componentId: 4,
        componentName: 'Stone Driller',
        spawnable: false,
        buildable: true,
        buyingDetails: [
            {
                item: 1,
                amount: 150
            }
        ],
        production: [
            {
                item: 3,
                amount: 1
            }
        ]
    }
];

export const ITEMS: Item[] = [
    {
        itemId: 1,
        itemName: 'Coins',
        emoji: '🪙',
        description: 'A Shiny Round Currency for Industroz',
        sellable: false
    },
    {
        itemId: 2,
        itemName: 'Wood',
        emoji: '🪵',
        description: 'The Wood obtained from the Trees cut by Wood Cutters of the Woodcutter Hut',
        sellable: true,
        sellGive: {
            item: 1,
            amount: 2
        }
    },
    {
        itemId: 3,
        itemName: 'Stone',
        emoji: '🪨',
        description: 'A Hard, Not So Spherical, Substance obtained by the Miners of Mining Co.',
        sellable: true,
        sellGive: {
            item: 1,
            amount: 3
        }
    }
];

// Miscellaneous Data
export const BotInviteLink = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=0&scope=bot%20applications.commands`;
export const SupportServer = `https://discord.gg/DuseEA4Ewh`;
export const GitHubRepository = `https://github.com/Platformer444/Industroz`;