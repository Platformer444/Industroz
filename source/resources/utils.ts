import { EmbedBuilder } from "discord.js";
import { Inventory, SettingsClass, WorldClass } from "../database.js";
import { ActionRow, ActionRowBuilder, ButtonBuilder, SelectMenuBuilder } from "../utils/components.js";
import { COMPONENTS, ITEMS, TILES, Item } from "./data.js";

export function generateRandomNumber(rangeMin: number, rangeMax: number): number {
    return Math.floor(Math.random() * (rangeMax - rangeMin + 1) ) + rangeMin;
}

export function createWorld(worldWidth: number, worldHeight: number): number[][] {
    const world: number[][] = [];

    for (let i = 0; i < worldHeight; i++) {
        const worldChunk = [];
        for (let j = 0; j < worldWidth; j++) {
            if (i % worldHeight === 0 || (i + 1) % worldHeight === 0) worldChunk.push(1);
            else {
                if (j % worldWidth === 0 || (j + 1) % worldWidth === 0) worldChunk.push(1);
                else worldChunk.push(2);
            }
        }
        world.push(worldChunk);
    }

    for (let i = 0; i < world.length; i++) {
        for (let j = 0; j < world[i].length; j++) {
            if (world[i][j] === 2) {
                const connections: number[] = [];

                const upTile = world[i - 1] === undefined ? 1 : world[i - 1][j];
                const rightTile = world[i][j + 1] === undefined ? 1 : world[i][j + 1];
                const downTile = world[i + 1] === undefined ? 1 : world[i + 1][j];
                const leftTile = world[i][j - 1] === undefined ? 1 : world[i][j - 1];

                if (upTile === 1) connections.push(0);
                else connections.push(1);
                if (rightTile === 1) connections.push(0);
                else connections.push(1);
                if (downTile === 1) connections.push(0);
                else connections.push(1);
                if (leftTile === 1) connections.push(0);
                else connections.push(1);

                let tile = TILES.filter((tile) => {
                    return tile.tileName === `Land${connections.join('')}`;
                })[0];

                if (tile.tileId === 2) {
                    const spawnables = COMPONENTS.filter((component) => {
                        return component.spawnable;
                    });

                    spawnables.forEach((spawnable) => {
                        if (generateRandomNumber(0, Math.abs(spawnable.spawningChance - 10)) === 0) {
                            tile = TILES.filter((tile) => {
                                return tile.component === spawnable.componentId;
                            })[0];
                            return;
                        }
                    });
                }

                world[i][j] = tile.tileId;
            }
        }
    }

    return world;
}

export function renderWorld(worldArray: number[][], worldWidth: number, worldHeight: number, centreTileI: number, centreTileJ: number): string {
    let message = '';

    for (let i = centreTileI - (Math.floor(worldHeight / 2)); i < (centreTileI - (Math.floor(worldHeight / 2))) + worldHeight; i++) {
        for (let j = centreTileJ - (Math.floor(worldWidth / 2)); j < (centreTileJ - (Math.floor(worldWidth / 2))) + worldWidth; j++) {
            let tile = TILES.filter((tile) => {
                return tile.tileId === (worldArray[i][j] === undefined ? 1 : worldArray[i][j]);
            })[0];

            message += tile.emoji;
        }
        message += '\n';
    }

    return message;
}

export async function buildHomeScreen(userId: string, interactor: string, islandNum: number) {
    const world = new WorldClass(userId);
    const settings = new SettingsClass(userId);

    const worldJSON = await world.getWorld();

    if (worldJSON === undefined) return {
        content: 'Looks like the specified User doesn\'t have an Industrial World yet...',
        ephemeral: true
    };

    if ((await settings.getSettings())["worldVisibility"] === "Private" && userId !== interactor) return {
        content: 'Looks like the spcified User has a Private Industrial World',
        ephemeral: true
    };

    if (worldJSON["worldArray"][islandNum - 1] === undefined) return {
        content: 'The specified Island is Invalid!',
        ephemeral: true
    };

    const worldArray = worldJSON["worldArray"][islandNum - 1]["islandArray"];

    const worldWidth = 5;
    const worldHeight = 5;

    const centreTileI = worldJSON["worldArray"][islandNum - 1]["centralLocation"][0];
    const centreTileJ = worldJSON["worldArray"][islandNum - 1]["centralLocation"][1];

    const optionButtons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`__worldExplore$${JSON.stringify({ islandNum: islandNum })}`)
                .setLabel('Explore')
                .setEmoji('🗺️')
                .setStyle("Primary"),
            new ButtonBuilder()
                .setCustomId(`__worldBuild$${JSON.stringify({ islandNum: islandNum })}`)
                .setLabel('Build')
                .setEmoji('🛠️')
                .setStyle("Primary"),
            new ButtonBuilder()
                .setCustomId('__getOfflineEarnings')
                .setLabel('Get Offline Earnings')
                .setEmoji('🪙')
                .setStyle("Primary")
        );

    const coin = ITEMS.filter((item) => {
        return item.itemName === 'Coins';
    })[0];

    const islandOptions = worldJSON["worldArray"].map((island) => {
        return { label: `Island ${island.islandNum}`, value: `island${island.islandNum}`, emoji: '🏝️', description: undefined, default: island.islandNum === islandNum }
    });
    islandOptions.push({ label: 'Create New Island', value: 'create_island', emoji: '➕', description: `${coin.emoji}${worldJSON["worldArray"].length * 100000}`, default: false });

    const islandSelectMenu = new ActionRowBuilder()
        .addComponents(
            new SelectMenuBuilder()
                .setType("StringSelect")
                .setCustomid('__islandSelectMenu')
                .setPlaceholder('Select an Island...')
                .addOptions(...islandOptions)
        )

    return {
        content: renderWorld(worldArray, worldWidth, worldHeight, centreTileI, centreTileJ),
        components: userId === interactor ? [optionButtons["actionRow"], islandSelectMenu["actionRow"]] : []
    }
}

export function buildNavigationButtons(data, buildConfirmDisable: boolean = false, destroyConfirmDisable: boolean = false, upgradeConfirm: boolean = false): ActionRow[] {
    const optionButtons1 = new ActionRowBuilder()    
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`__currentTilePreview$${JSON.stringify(data)}`)
                .setEmoji(TILES.filter((tile) => { return tile.tileId === data["selectedTile"]; })[0].emoji)
                .setStyle("Primary"),
            new ButtonBuilder()
                .setCustomId(`__exploreUpgrade$${JSON.stringify(data)}`)
                .setLabel('Upgrade')
                .setEmoji('')
                .setDisabled(upgradeConfirm)
                .setStyle("Primary"),
            new ButtonBuilder()
                .setCustomId(`__exploreDestroy$${JSON.stringify(data)}`)
                .setLabel('Destroy')
                .setEmoji('⚒️')
                .setDisabled(destroyConfirmDisable)
                .setStyle("Primary")
        );

    const navigationButtons1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`__navigationLeft1$${JSON.stringify(data)}`)
                .setEmoji('⬅️')
                .setStyle("Secondary"),
            new ButtonBuilder()
                .setCustomId(`__navigationUp$${JSON.stringify(data)}`)
                .setEmoji('⬆️')
                .setStyle("Secondary"),
            new ButtonBuilder()
                .setCustomId(`__navigationRight1$${JSON.stringify(data)}`)
                .setEmoji('➡️')
                .setStyle("Secondary")
        );
    
    const navigationButtons2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`__navigationLeft2$${JSON.stringify(data)}`)
                .setEmoji('⬅️')
                .setStyle("Secondary"),
            new ButtonBuilder()
                .setCustomId(`__navigationDown$${JSON.stringify(data)}`)
                .setEmoji('⬇️')
                .setStyle("Secondary"),
            new ButtonBuilder()
                .setCustomId(`__navigationRight2$${JSON.stringify(data)}`)
                .setStyle("Secondary")
                .setEmoji('➡️')
        );

    const optionButtons2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`__setCentralLocation$${JSON.stringify(data)}`)
                .setLabel('Set Central Location')
                .setStyle("Primary")
        );

    const optionButtons3 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('__home')
                .setLabel(data["explore"] ? 'Done' : 'Cancel')
                .setEmoji(data["explore"] ? '✅' : undefined)
                .setStyle(data["explore"] ? "Primary" : "Danger"),
            new ButtonBuilder()
                .setCustomId(`__confirmBuild$${JSON.stringify(data)}`)
                .setLabel('Confirm')
                .setDisabled(buildConfirmDisable)
                .setStyle("Primary")
        );

    if (data["explore"]) optionButtons3["actionRow"]["components"].splice(1, 1);

    const actionRows = [
        optionButtons1["actionRow"],
        navigationButtons1["actionRow"],
        navigationButtons2["actionRow"],
        optionButtons2["actionRow"],
        optionButtons3["actionRow"]
    ];

    if (!data["explore"]) {
        actionRows.splice(0, 1);
        actionRows.splice(2, 1);
    }

    return actionRows;
}

export async function navigate(userId: string, islandNum: number, data, i: number, j: number, explore: boolean) {
    const world = new WorldClass(userId);

    const worldJSON = await world.getWorld();
    const worldArray = worldJSON["worldArray"][islandNum - 1]["islandArray"];

    data["i"] = data["i"] + i;
    data["j"] = data["j"] + j;

    if (explore) data["selectedTile"] = worldArray[data["i"]][data["j"]];

    const tile = TILES.filter((tile) => {
        return tile.tileId === data["selectedTile"];
    })[0];
    const component = COMPONENTS.filter((component) => {
        return component.componentId === tile.component;
    })[0];
    
    const buildConfirm = explore ? false : !(worldArray[data["i"]][data["j"]] === tile.canBuiltOn);
    const destroyConfirm = explore ? (tile.destroyReplace === undefined) : false;
    const upgradeConfirm = explore ? (component === undefined ? true : !component.buildable) : false;

    worldArray[data["i"]][data["j"]] = data["selectedTile"];

    return {
        content: renderWorld(worldArray, 5, 5, data["i"], data["j"]),
        components: buildNavigationButtons(data, buildConfirm, destroyConfirm, upgradeConfirm)
    }
}

export function editInventory(item: Item, addOrRemove: 'Add' | 'Remove', quantity: number, inventory: Inventory[]): Inventory[] | undefined {
    let done = false;

    inventory.forEach((invItem) => {
        if (invItem.item === item.itemId) {
            if (addOrRemove === 'Add') {
                invItem.quantity += quantity
                done = true;
            }
            else if (addOrRemove === 'Remove') {
                if (invItem.quantity - quantity < 0) done = false;
                else if (invItem.quantity - quantity === 0) {
                    inventory.splice(inventory.indexOf(invItem), 1);
                    done = true;
                }
                else {
                    invItem.quantity -= quantity;
                    done = true;
                };
            }
            return;
        }
    });

    if (!done && addOrRemove === "Add") {
        inventory.push({ item: item.itemId, quantity: quantity });
        done = true;
    }

    if (done) return inventory;
    else return undefined;
}

export async function buildInventoryEmbed(userId: string, username: string, page: number = 1) {
    let description = '';
    let done = false;
    const options = [];

    const world = new WorldClass(userId);

    const inventory = (await world.getWorld())["inventory"];

    for (let i = ((page - 1) * 25); i < ((page * 25) - 1); i++) {
        if (inventory[i] === undefined && i === ((page - 1) * 25)) {
            done = false;
            break;
        }
        
        if ((i + 1) > inventory.length) break;

        const item = ITEMS.filter((item) => {
            return item.itemId === inventory[i].item;
        })[0];

        description += `${item.emoji}${item.itemName} x${inventory[i].quantity}\n`;
        options.push({ label: item.itemName, value: item.itemName.toLowerCase().replace(' ', '_'), emoji: item.emoji, description: item.description });

        done = true;
    }

    if (!done) return undefined;

    const itemEmbed = new EmbedBuilder()
        .setTitle(`${username}'s Inventory`)
        .setDescription(description);
    
    const itemSelectMenu = new ActionRowBuilder()
        .addComponents(
            new SelectMenuBuilder()
                .setType("StringSelect")
                .setCustomid('__itemSelectMenu')
                .setPlaceholder('Select an Item...')
                .addOptions(...options)
        );
    
    const pageNavigationButtons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`__itemPageNavigate$${page - 1}`)
                .setLabel(`<< Page ${page - 1}`)
                .setDisabled((await buildInventoryEmbed(userId, username, page - 1)) === undefined)
                .setStyle("Success"),
            new ButtonBuilder()
                .setCustomId(`__itemPageNavigate$${page + 1}`)
                .setLabel(`Page ${page + 1} >>`)
                .setDisabled((await buildInventoryEmbed(userId, username, page + 1)) === undefined)
                .setStyle("Success")
        );

    return {
        components: [itemSelectMenu["actionRow"], pageNavigationButtons["actionRow"]],
        embeds: [itemEmbed]
    };
}

export async function buildItemEmbed(userId: string, itemName: string) {
    const world = new WorldClass(userId);
    const inventory = (await world.getWorld())["inventory"];

    const item = ITEMS.filter((item) => {
        return item.itemName.toLowerCase().replace(' ', '_') === itemName;
    })[0];
    const invItem = inventory.filter((invItem) => {
        return invItem.item === item.itemId;
    })[0];
    const sellItem = ITEMS.filter((sellItem) => {
        return sellItem.itemId === (item.sellable ? item.sellGive.item : undefined);
    })[0];

    const itemEmbed = new EmbedBuilder()
        .setTitle(`${item.emoji} ${item.itemName} (x${invItem.quantity})`)
        .setDescription(item.description)
        .setFooter(item.sellable ? { text: `${item.itemName} x1 -> ${sellItem.itemName} x${item.sellGive.amount}` } : { text: 'Can\'t be sold' });

    const sellButton = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`__sellItem$${item.itemId}`)
                .setLabel('Sell')
                .setDisabled(!item.sellable)
                .setStyle("Primary")
        );

    return {
        components: [sellButton["actionRow"]],
        embeds: [itemEmbed]
    };
}