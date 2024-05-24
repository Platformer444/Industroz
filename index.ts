import { ActivityType, GatewayIntentBits } from "discord.js";

import { ClientLogin } from "./resources/Bot/client.js";
import Game from "./resources/Game.js";
import { BotUtils, WorldUtils } from "./resources/Utilities.js";

import "dotenv/config";

export const VanillaGame: Game = {
    Configuration: {
        Name: 'Vanilla Industroz',
        Description: '',
        Version: '1.0.0-beta'
    },
    Resources: {
        Data: {
            Tiles: [],
            Biomes: [],
            Items: []
        },
        Utilities: {
            CreateWorld: WorldUtils.CreateWorld,
            RenderWorld: WorldUtils.RenderWorld,
            NavigateWorld: WorldUtils.NavigateWorld,
            DestroyTile: WorldUtils.DestroyTile,
            PaySalary: WorldUtils.PaySalary,
            UpgradeBuildable: WorldUtils.UpgradeBuildable,

            Plural: BotUtils.Plural,
            Singular: BotUtils.Singular,
            RandomNumber: BotUtils.RandomNumber,

            BuildHomeScreen: BotUtils.BuildHomeScreen,
            BuildNavigation: BotUtils.BuildNavigation,
            BuildListEmbed: BotUtils.BuildListEmbed,
            BuildInventoryItemEmbed: BotUtils.BuildInventoryItemEmbed,
            BuildShopItemEmbed: BotUtils.BuildShopItemEmbed,
            BuildTileInfoEmbed: BotUtils.BuildTileInfoEmbed,
            BuildSettingEmbed: BotUtils.BuildSettingEmbed,

            EditInventory: BotUtils.EditInventory,
            DisplayItemCost: BotUtils.DisplayItemCost,
            GetUpgradeCost: BotUtils.GetUpgradeCost
        }
    }
}

await ClientLogin({
    BotToken: process.env.BOT_TOKEN ?? "",
    CommandsDir: '/commands',
    EventsDir: '/events',
    ClientOptions: {
        intents: [
            GatewayIntentBits.Guilds
        ],
        presence: {
            status: "online",
            activities: [{
                name: "Making Ever-Growing Industries!",
                type: ActivityType.Custom
            }]
        }
    }
});