import { GameData } from "./../resources/Data.js";
import { Utils } from "./../resources/Utilities.js";
import Game from "./Game.js";

const Vanilla: Game = {
    Configuration: {
        Name: 'Vanilla Industroz',
        Description: '',
        Version: '1.0.0-beta'
    },
    Resources: {
        Data: {
            Tiles: GameData.Tiles,
            Biomes: GameData.Biomes,
            Items: GameData.Items
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
};

export default Vanilla;