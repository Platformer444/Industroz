import { ActivityType, GatewayIntentBits } from "discord.js";

import { ClientLogin } from "./resources/Bot/client.js";
import Game from "./resources/Game.js";
import { Utils } from "./resources/Utilities.js";

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
            CreateWorld: Utils.CreateWorld,
            RenderWorld: Utils.RenderWorld,
            NavigateWorld: Utils.NavigateWorld,
            DestroyTile: Utils.DestroyTile,
            PaySalary: Utils.PaySalary,
            UpgradeBuildable: Utils.UpgradeBuildable,

            Plural: Utils.Plural,
            Singular: Utils.Singular,
            RandomNumber: Utils.RandomNumber,

            BuildHomeScreen: Utils.BuildHomeScreen,
            BuildNavigation: Utils.BuildNavigation,
            BuildListEmbed: Utils.BuildListEmbed,
            BuildInventoryItemEmbed: Utils.BuildInventoryItemEmbed,
            BuildShopItemEmbed: Utils.BuildShopItemEmbed,
            BuildTileInfoEmbed: Utils.BuildTileInfoEmbed,
            BuildSettingEmbed: Utils.BuildSettingEmbed,
            BuildMarketplaceUserEmbed: Utils.BuildMarketplaceUserEmbed,
            BuildMarketplaceOfferEmbed: Utils.BuildMarketplaceOfferEmbed,

            EditInventory: Utils.EditInventory,
            DisplayItemCost: Utils.DisplayItemCost,
            GetUpgradeCost: Utils.GetUpgradeCost,
            Pay: Utils.Pay,
            InteractionUserCheck: Utils.InteractionUserCheck
        }
    }
}

await ClientLogin({
    BotToken: process.env.BOT_TOKEN ?? "",
    ModulesDir: ['/commands', '/events'],
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