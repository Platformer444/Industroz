import { Biome, Item, Tile } from "./data.js"

export default interface Game {
    Configuration: {
        Name: string,
        Description: string,
        Version: string    
    },
    Resources: {
        Data: {
            Tiles: Tile[],
            Biomes: Biome[],
            Items: Item[]
        },
        Utils: {
            [ Util: string ]: () => any
        }
    }
};