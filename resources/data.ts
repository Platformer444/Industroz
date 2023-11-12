type ItemQuantityPair = { Item: number, Quantity: number };

export interface Tile {
    ID: number,
    Name: string,
    Connections: [number, number, number, number],
    Emoji: string,
    Spawnable?: boolean,
    Buildable?: boolean,
    BuildableOn?: number,
    BuyingDetails?: ItemQuantityPair[]
};

export interface Item {
    ID: number,
    Name: string,
    Description: string,
    Emoji: string
};

export const Tiles: Tile[] = [
    {
        ID: 1,
        Name: 'Water',
        Connections: [1, 1, 1, 1],
        Emoji: '<:Water:1170322959232143420>'
    },
    {
        ID: 2,
        Name: 'Land1111',
        Connections: [1, 1, 1, 1],
        Emoji: '<:Land1111:1170322862276608100>'
    },
    {
        ID: 3,
        Name: 'Land1111Trees',
        Connections: [1, 1, 1, 1],
        Emoji: '<:Land1111Trees:1170322946213036052>',
        Spawnable: true
    },
    {
        ID: 4,
        Name: 'WoodCutter Hut',
        Connections: [1, 1, 1, 1],
        Emoji: '<:Land1111WoodcutterHut:1170322950201815091>',
        Buildable: true,
        BuildableOn: 2,
        BuyingDetails: [
            {
                Item: 1,
                Quantity: 5
            }
        ]
    }
];

export const Items: Item[] = [
    {
        ID: 1,
        Name: 'Coin',
        Description: '',
        Emoji: '🪙'
    }
];