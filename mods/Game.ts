import { AnySelectMenuInteraction, ButtonInteraction, InteractionReplyOptions, InteractionUpdateOptions, StringSelectMenuInteraction, User } from "discord.js"

import { World } from "commands/world.js"
import { Biome, Item, Tile } from "../resources/Data.js"
import { NavigationButtonData } from "../resources/Utilities.js"
import { SelectMenuOption } from "../resources/Bot/components.js";
import { Settings } from "commands/settings.js";

type InteractionResponse = InteractionReplyOptions & InteractionUpdateOptions;

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
            Items: Item[],
        },
        Utilities: {
            CreateWorld: (Width: number, Height: number, DefaultOutpostPosition?: [number, number]) => World["Islands"][0]["Tiles"],
            RenderWorld: (World: World["Islands"][0]["Tiles"], Position: [number, number], FOV?: [number, number]) => string,
            NavigateWorld: (Data: NavigationButtonData, Interactor: User, Move: [number, number]) => Promise<InteractionResponse>,
            DestroyTile: (Data: NavigationButtonData, Interactor: User, Tool: "Axe" | "Pickaxe") => Promise<["Reply" | "Update", InteractionResponse]>,
            PaySalary: (Data: NavigationButtonData) => Promise<InteractionResponse>,
            UpgradeBuildable: (Data: NavigationButtonData) => Promise<InteractionResponse>

            Plural: (Word: string) => string,
            Singular: (Word: string) => string,
            RandomNumber: (Min: number, Max: number) => number,

            BuildHomeScreen: (User: User, Interactor: User, Island: number, Outpost?: number) => Promise<InteractionResponse>,
            BuildNavigation: (Data: NavigationButtonData, Interactor: User) => Promise<InteractionResponse>,
            BuildListEmbed: <ListItemType>(
                List: ListItemType[],
                Content: (Item: ListItemType, Index?: number, List?: ListItemType[]) => [string, SelectMenuOption],
                SelectInteractionExecute: (interaction: StringSelectMenuInteraction) => any,
                Options: {
                    Embed?: boolean,
                    SelectMenu?: boolean,            
                    Title?: string,
                    Page: number
                }
            ) => InteractionResponse,
            BuildInventoryItemEmbed: (UserID: string, Item: number, Quantity: number) => Promise<InteractionResponse>,
            BuildShopItemEmbed: (UserID: string, Island: number, Item: number) => Promise<InteractionResponse>,
            BuildTileInfoEmbed: (Data: NavigationButtonData, Interactor: User) => Promise<InteractionResponse>,
            BuildSettingEmbed: (Setting: keyof Settings, Value: string) => InteractionResponse,
            BuildMarketplaceUserEmbed: (User: string) => Promise<InteractionResponse>,
            BuildMarketplaceOfferEmbed: (User: string, Interactor: string, Offer: number) => Promise<InteractionResponse>,

            EditInventory: (InventoryList: World["Inventory"], Item: number, AddorRemove: "Add" | "Remove", Quantity: number) => World["Inventory"],
            DisplayItemCost: (ID: number, List: "Tiles" | "Items", Detail: "SellDetails" | "BuyingDetails" | "Upgrade", Emoji?: boolean, UpgradeLevel?: number) => string,
            GetUpgradeCost: (Buildable: number, Level: number) => { Item: number, Quantity: number }[] | undefined,
            Pay: (Inventory: World["Inventory"], Items: { Item: number, Quantity: number }[]) => [World["Inventory"], string],
            InteractionUserCheck: (Interaction: ButtonInteraction | AnySelectMenuInteraction) => Promise<boolean>,
        }
    }
};