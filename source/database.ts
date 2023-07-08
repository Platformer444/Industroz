import Keyv from "keyv";

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
        lastTime: number
    }[],
    inventory: Inventory[]
}

export interface Settings {
    worldVisibility: "Public" | "Private"
}

const WorldsDB = new Keyv('sqlite://database.sqlite', { namespace: 'Worlds' });
const SettingsDB = new Keyv('sqlite://database.sqlite', { namespace: 'Settings' });

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