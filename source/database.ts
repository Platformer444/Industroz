import Keyv from "keyv";
import KeyvSqlite from "@keyv/sqlite";
import sqlite3 from "sqlite3";
import { createWorld } from "./resources/utils.js";
const { Database } = sqlite3;

export interface Island {
    islandNum: number,
    islandArray: number[][],
    centralLocation: [number, number]
};

export interface Inventory {
    item: number,
    quantity: number
}

export interface World {
    worldArray: Island[],
    components: {
        component: number,
        level: number,
        location: [number, number],
        islandNum: number,
        lastTime: number
    }[],
    inventory: Inventory[]
}

export interface Settings {
    worldVisibility: "Public" | "Private"
}

const WorldsDB = new Keyv({ store: new KeyvSqlite({ uri: 'sqlite://database.sqlite', table: 'Worlds' }) });
const SettingsDB = new Keyv({ store: new KeyvSqlite({ uri: 'sqlite://database.sqlite', table: 'Settings' }) });

export class WorldClass {
    user: string;

    /**
     * Access point for the World Database
     * @param {string} user The User whose World Data is to be accessed
     */
    constructor(user: string) {
        this.user = user;
    }

    /**
     * Save World of the specified User
     * @param {World} world The World Data you want to save
     */
    async saveWorld(world: World) {
        await WorldsDB.set(this.user, world);
    }

    /**
     * Get the World of the Specified User
     * @returns {World}
     */
    async getWorld(): Promise<World> {
        return await WorldsDB.get(this.user);
    }
};

export class SettingsClass {
    user: string;

    /**
     * Access point for the Settings Database
     * @param {string} user The User whose Settings Data is to be accessed
     */
    constructor(user: string) {
        this.user = user
    }

    /**Save Settings od the specified User
     * 
     * @param {Settings} settings The Settings Data you want to save
     */
    async saveSettings(settings: Settings) {
        await SettingsDB.set(this.user, settings);
    }

    /**
     * Set the Settings of the Specified User
     * @returns {Settings}
     */
    async getSettings(): Promise<Settings> {
        return await SettingsDB.get(this.user);
    }
};

export async function updateUserDatabases() {
    const DB = new Database('database.sqlite');

    const WorldDBKeys: any[] = await new Promise((resolve, reject) => {
        DB.all('SELECT * FROM Worlds', (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
    const SettingsDBKeys: any[] = await new Promise((resolve, reject) => {
        DB.all('SELECT * FROM Settings', (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    WorldDBKeys.forEach(async (WorldDBKey) => {
        const DefaultWorldDB: World = {
            worldArray: [
                {
                    islandNum: 1,
                    islandArray: [],
                    centralLocation: [49, 49]
                }
            ],
            components: [],
            inventory: []
        };

        const Key = WorldDBKey["key"].replace('keyv:', '');
        const Value = JSON.parse(WorldDBKey["value"])["value"];
        const world = new WorldClass(Key);

        Object.keys(DefaultWorldDB).forEach((key) => {
            if (Value[key] === undefined) {
                if (key === 'worldArray') DefaultWorldDB["worldArray"][0]["islandArray"] = createWorld(100, 100);

                Value[key] = DefaultWorldDB[key];
            }
        });

        await world.saveWorld(Value);
    });

    SettingsDBKeys.forEach(async (SettingsDBKey) => {
        const DefaultSettingDB: Settings = {
            worldVisibility: "Private"
        };

        const Key = SettingsDBKey["key"].replace('keyv:', '');
        const Value = JSON.parse(SettingsDBKey["value"])["value"];
        const settings = new SettingsClass(Key);

        Object.keys(DefaultSettingDB).forEach((key) => {
            if (Value[key] === undefined) {
                Value[key] = DefaultSettingDB[key];
            }
        });

        await settings.saveSettings(Value);
    });
}