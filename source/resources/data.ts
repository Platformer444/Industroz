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
];

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
    }[] | undefined,
    spawningChance?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
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
    }[] | undefined,
    consumption?: {
        item: number,
        amount: number
    }[] | undefined,
};

export interface Item {
    itemId: number,
    itemName: string,
    emoji: string,
    description: string,
    sellGive?: {
        item: number,
        amount: number
    } | undefined,
    buyingDetails?: {
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
        ],
        spawningChance: 9
    },
    {
        tileId: 13,
        tileName: 'Land1111WoodcutterHut',
        connections: [1, 1, 1, 1],
        component: 2,
        emoji: '<:Land1111WoodcutterHut:1109051386257211392>',
        canBuiltOn: 12,
        destroyReplace: 12,
        destroyGive: [
            {
                item: 1,
                amount: 9
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
        ],
        spawningChance: 9
    },
    {
        tileId: 15,
        tileName: 'Land1111StoneDriller',
        connections: [1, 1, 1, 1],
        component: 4,
        emoji: '<:Land1111StoneDriller:1123626371831320708>',
        canBuiltOn: 14,
        destroyReplace: 14,
        destroyGive: [
            {
                item: 1,
                amount: 13
            }
        ]
    },
    {
        tileId: 16,
        tileName: 'PlankCutter',
        connections: [1, 1, 1, 1],
        component: 5,
        emoji: '<:PlankCutter:1129707631066480670>',
        canBuiltOn: 2,
        destroyReplace: 2,
        destroyGive: [
            {
                item: 1,
                amount: 9
            }
        ]
    },
    {
        tileId: 17,
        tileName: 'Land1111Coal',
        connections: [1, 1, 1, 1],
        component: 6,
        emoji: '<:Land1111Coal:1129720124425900093>',
        destroyReplace: 2,
        destroyGive: [
            {
                item: 5,
                amount: 1
            }
        ],
        spawningChance: 8
    },
    {
        tileId: 18,
        tileName: 'Land1111CoalDriller',
        connections: [1, 1, 1, 1],
        component: 7,
        emoji: '<:Land1111CoalDriller:1134413116336259112>',
        canBuiltOn: 17,
        destroyReplace: 17,
        destroyGive: [
            {
                item: 1,
                amount: 16
            }
        ]
    },
    {
        tileId: 19,
        tileName: 'Land1111Iron',
        connections: [1, 1, 1, 1],
        component: 8,
        emoji: '<:Land1111Iron:1134413118940917800>',
        spawningChance: 8
    },
    {
        tileId: 20,
        tileName: 'Land1111IronDriller',
        connections: [1, 1, 1, 1],
        component: 9,
        emoji: '<:Land1111IronDriller:1134413123860832287>',
        canBuiltOn: 19,
        destroyReplace: 19,
        destroyGive: [
            {
                item: 1,
                amount: 16
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
        componentName: 'Woodcutter Hut',
        spawnable: false,
        buildable: true,
        buyingDetails: [
            {
                item: 1,
                amount: 10
            },
            {
                item: 2,
                amount: 5
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
                amount: 15
            },
            {
                item: 3,
                amount: 5
            }
        ],
        production: [
            {
                item: 3,
                amount: 1
            }
        ]
    },
    {
        componentId: 5,
        componentName: 'Plank Cutter',
        spawnable: false,
        buildable: true,
        buyingDetails: [
            {
                item: 1,
                amount: 10
            },
            {
                item: 2,
                amount: 3
            }
        ],
        production: [
            {
                item: 4,
                amount: 1
            }
        ],
        consumption: [
            {
                item: 2,
                amount: 2
            }
        ]
    },
    {
        componentId: 6,
        componentName: 'Coal',
        spawnable: true,
        buildable: false
    },
    {
        componentId: 7,
        componentName: 'Coal Driller',
        spawnable: false,
        buildable: true,
        buyingDetails: [
            {
                item: 1,
                amount: 18
            },
            {
                item: 3,
                amount: 8
            }
        ],
        production: [
            {
                item: 5,
                amount: 1
            }
        ]
    },
    {
        componentId: 8,
        componentName: 'Iron',
        spawnable: true,
        buildable: false
    },
    {
        componentId: 9,
        componentName: 'IronDriller',
        spawnable: false,
        buildable: true,
        buyingDetails: [
            {
                item: 1,
                amount: 18
            },
            {
                item: 3,
                amount: 8
            }
        ],
        production: [
            {
                item: 6,
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
    },
    {
        itemId: 2,
        itemName: 'Wood',
        emoji: '🪵',
        description: 'The Wood obtained from the Trees cut by Wood Cutters of the Woodcutter Hut',
        sellGive: {
            item: 1,
            amount: 2
        },
        buyingDetails: {
            item: 1,
            amount: 3
        }
    },
    {
        itemId: 3,
        itemName: 'Stone',
        emoji: '🪨',
        description: 'A Hard, Not So Spherical, Substance obtained by the Miners of Mining Co.',
        sellGive: {
            item: 1,
            amount: 3
        },
        buyingDetails: {
            item: 1,
            amount: 4
        }
    },
    {
        itemId: 4,
        itemName: 'Wooden Plank',
        emoji: '<:WoodenPlanks:1127539636718293134>',
        description: 'A Cuboidal Piece of Usable Material made by cutting and poilishing Wood cut from forests.',
        sellGive: {
            item: 1,
            amount: 2
        },
        buyingDetails: {
            item: 1,
            amount: 4
        }
    },
    {
        itemId: 5,
        itemName: 'Coal',
        emoji: '<:Coal:1145277460322205718>',
        description: 'A Rough Piece of Blackish, Not so Spherical Substance Obtained by the Miners of Mining Co.',
        sellGive: {
            item: 1,
            amount: 3
        },
        buyingDetails: {
            item: 1,
            amount: 5
        }
    },
    {
        itemId: 6,
        itemName: 'Iron',
        emoji: '<:Iron:1145280325602263080>',
        description: 'A Rustable, Hard, Reddish Metal Obtained by the Miners of Mining Co.',
        sellGive: {
            item: 1,
            amount: 3
        },
        buyingDetails: {
            item: 1,
            amount: 5
        }
    }
];

// Miscellaneous Data
export const BotInviteLink = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=0&scope=bot%20applications.commands`;
export const SupportServer = `https://discord.gg/DuseEA4Ewh`;
export const GitHubRepository = `https://github.com/Platformer444/Industroz`;