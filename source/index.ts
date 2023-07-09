import { Client, GatewayIntentBits, ActivityType, EmbedBuilder, ComponentType } from "discord.js";
import "dotenv/config";
import { EventBuilder, getEvents } from "./utils/events.js";
import { getCommands, registerCommands, CommandBuilder, SubCommandBuilder, OptionBuilder } from "./utils/commands.js";
import { SettingsClass, WorldClass } from "./database.js";
import { ActionRowBuilder, ButtonBuilder, ModalBuilder, SelectMenuBuilder, TextInputBuilder } from "./utils/components.js";
import { buildHomeScreen, renderWorld, createWorld, buildNavigationButtons, editInventory, navigate, buildInventoryEmbed, buildItemEmbed } from "./resources/utils.js";
import { TILES, COMPONENTS, ITEMS, BotAuthor, BotVersion, DiscordJSVersion, SETTINGS, BotInviteLink, SupportServer, GitHubRepository } from "./resources/data.js";

const client = new Client<true>({
    intents: [GatewayIntentBits.Guilds]
});

console.log('Define Events\n');

new EventBuilder()
    .setName("ready")
    .setOnce(true)
    .setExecute(async function execute(client) {
        await registerCommands();

        client.user.setActivity('/world view', { type: ActivityType.Playing });
        console.log(`Logged in as ${client.user.tag}`);
    })
    .defineEvent();

new EventBuilder()
    .setName("interactionCreate")
    .setOnce(false)
    .setExecute(async function execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const commands = getCommands()[0];
            const command = commands.filter((command) => {
                return command["data"]["name"] === interaction.commandName;
            })[0];

            if (command === undefined) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
            return;
        } else if (interaction.isAutocomplete()) {
            const commands = getCommands()[0];
            const command = commands.filter((command) => {
                return command["data"]["name"] === interaction.commandName;
            })[0];

            if (command === undefined) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                command.autocomplete(interaction);
            } catch (error) {
                console.log(error);
            }
            return;
        }
        
        if (interaction.user.id === interaction.message.interaction.user.id) {
            if (interaction.isButton()) {
                const world = new WorldClass(interaction.user.id);
                const settings = new SettingsClass(interaction.user.id);

                if (interaction.customId === '__worldCreationCancel') { await interaction.update({ content: `~~${interaction.message.content}~~`, components: [] }); }
                else if (interaction.customId.includes('__worldCreationConfirm')) {
                    const data = JSON.parse(interaction.customId.split('$')[1]);

                    const worldArray = createWorld(100, 100);

                    await world.saveWorld({
                        worldArray: [{ islandNum: 1, islandArray: worldArray, centralLocation: [Math.ceil(worldArray.length / 2) - 1, Math.ceil(worldArray[0].length / 2) - 1] }],
                        components: [],
                        inventory: [{ item: 1, quantity: 1000 }]
                    });

                    await settings.saveSettings({
                        worldVisibility: data.visibility
                    });

                    await interaction.update({
                        content: (data.worldExists ? 'Your Industrial World was successfully resetted' : 'Your New Industrial World was successfully created') + '\nView Your Industrial World by </world view:1118465851834765442>',
                        components: [],
                        ephemeral: data.visibility === 'Private'
                    });
                }
                else if (interaction.customId.includes('__worldExplore')) {
                    const data = JSON.parse(interaction.customId.split('$')[1]);

                    const worldJSON = await world.getWorld();
                    const settingsJSON = await settings.getSettings();

                    const worldArray = worldJSON["worldArray"][data["islandNum"] - 1]["islandArray"];

                    const centreTileI = worldJSON["worldArray"][data["islandNum"] - 1]["centralLocation"][0];
                    const centreTileJ = worldJSON["worldArray"][data["islandNum"] - 1]["centralLocation"][1];

                    const tile = TILES.filter((tile) => {
                        return tile.tileId === worldArray[centreTileI][centreTileJ];
                    })[0];
                    const component = COMPONENTS.filter((component) => {
                        return component.componentId === tile.component;
                    })[0];

                    const destroyConfirm = (tile.destroyReplace === undefined);

                    const upgradeConfirm = component === undefined ? true : !component.buildable;
                    
                    await interaction.update({ components: buildNavigationButtons({ i: centreTileI, j: centreTileJ, island: data["islandNum"], explore: true, selectedTile: worldArray[centreTileI][centreTileJ] }, false, destroyConfirm, upgradeConfirm)});
                }
                else if (interaction.customId.includes('__worldBuild')) {
                    const data = interaction.customId.split('$')[1];

                    const buildables = COMPONENTS.filter((component) => {
                        return component.buildable;
                    });

                    const buildableSelectMenu = new ActionRowBuilder()
                        .addComponents(
                            new SelectMenuBuilder()
                                .setType("StringSelect")
                                .setCustomid(`__buildableSelectMenu$${data}`)
                                .setPlaceholder('Select a Buildable to Build with...')
                                .addOptions(
                                    ...buildables.map((buildable) => {
                                        const emoji = TILES.filter((tile) => {
                                            return tile.component === buildable.componentId;
                                        })[0].emoji;

                                        let description = '';

                                        buildable.buyingDetails.forEach((buyingDetail) => {
                                            const item = ITEMS.filter((item) => {
                                                return item.itemId === buyingDetail.item;
                                            })[0];

                                            description += `${item.emoji}${buyingDetail.amount} `;
                                        });

                                        return { label: buildable.componentName, value: buildable.componentName.toLowerCase().replace(' ', '_'), description: description, emoji: emoji };
                                    })
                                )
                        );
                    
                    const homeButton = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('__home')
                                .setLabel('Home')
                                .setStyle("Secondary")
                        );
        
                    await interaction.update({ components: [buildableSelectMenu["actionRow"], homeButton["actionRow"]] });
                }
                else if (interaction.customId === '__home') { await interaction.update(await buildHomeScreen(interaction.user.id, interaction.user.id, 1)); }
                else if (interaction.customId.includes('__navigation')) {
                    const data = JSON.parse(interaction.customId.split('$')[1]);

                    if (interaction.customId.includes('Left')) await interaction.update(await navigate(interaction.user.id, data["island"], data, 0, -1, data["explore"]));
                    else if (interaction.customId.includes('Right')) await interaction.update(await navigate(interaction.user.id, data["island"], data, 0, 1, data["explore"]));
                    else if (interaction.customId.includes('Up')) await interaction.update(await navigate(interaction.user.id, data["island"], data, -1, 0, data["explore"]));
                    else if (interaction.customId.includes('Down')) await interaction.update(await navigate(interaction.user.id, data["island"], data, 1, 0, data["explore"]));
                }
                else if (interaction.customId.includes('__exploreDestroy')) {
                    const data = JSON.parse(interaction.customId.split('$')[1]);

                    const worldJSON = await world.getWorld();
                    const worldArray = worldJSON["worldArray"][data["island"] - 1]["islandArray"];
                    const worldComponents = worldJSON["components"];
                    let inventory = worldJSON["inventory"];

                    const selectedTile = TILES.filter((tile) => {
                        return tile.tileId === data["selectedTile"];
                    })[0];

                    selectedTile.destroyGive.forEach((destroyGive) => {
                        const item = ITEMS.filter((item) => {
                            return item.itemId === destroyGive.item
                        })[0];

                        inventory = editInventory(item, "Add", destroyGive.amount, inventory);
                    });

                    if (selectedTile.component !== undefined) {
                        const toDelete = worldComponents.filter((worldComponent) => {
                            return worldComponent.location[0] === data["i"] && worldComponent.location[1] === data["j"];
                        })[0];

                        worldComponents.splice(worldComponents.indexOf(toDelete), 1);
                    }

                    worldArray[data["i"]][data["j"]] = selectedTile.destroyReplace;

                    await world.saveWorld(worldJSON);

                    await interaction.update({ content: renderWorld(worldArray, 5, 5, data["i"], data["j"]), components: buildNavigationButtons(data, false, TILES.filter((tile) => { return tile.tileId === selectedTile.destroyReplace })[0].component === undefined) });
                }
                else if(interaction.customId.includes('__confirmBuild')) {
                    const data = JSON.parse(interaction.customId.split('$')[1]);
                    let done = false;
        
                    const worldJSON = await world.getWorld();
                    const worldArray = worldJSON["worldArray"][data["island"] - 1]["islandArray"];
                    let inventory = worldJSON["inventory"];
        
                    const buildable = COMPONENTS.filter((component) => {
                        return component.componentId === TILES.filter((tile) => {
                            return tile.tileId === data["selectedTile"];
                        })[0].component;
                    })[0];
        
                    buildable.buyingDetails.forEach((buyingItem) => {
                        const item = ITEMS.filter((item) => {
                            return item.itemId === buyingItem.item;
                        })[0];
        
                        const newInv = editInventory(item, "Remove", buyingItem.amount, inventory);
                        
                        if (newInv !== undefined) {
                            inventory = newInv;
                            done = true;
                        } else {
                            done = false;
                            return;
                        }
                    });
        
                    if (done) {
                        worldArray[data["i"]][data["j"]] = data["selectedTile"];
                        worldJSON["components"].push({ component: buildable.componentId, level: 1, location: [data["i"], data["j"]], lastTime: Date.now() });
                        await world.saveWorld(worldJSON);
                        await interaction.update(await buildHomeScreen(interaction.user.id, interaction.user.id, data["island"]));
                        return;
                    } else {
                        await interaction.reply('You don\'t have enough Items to Build that!');
                    }
                }
                else if (interaction.customId === '__getOfflineEarnings') {
                    let message = 'You Got:\n';

                    const worldJSON = await world.getWorld();
                    const worldComponents = worldJSON["components"];
                    let inventory = worldJSON["inventory"];

                    worldComponents.forEach((worldComponent) => {
                        const component = COMPONENTS.filter((component) => {
                            return component.componentId === worldComponent.component;
                        })[0];

                        component.production.forEach((productionItem) => {
                            const item = ITEMS.filter((item) => {
                                return item.itemId === productionItem.item;
                            })[0];

                            const timeElapsed = Math.ceil((Date.now() - worldComponent.lastTime) / 1000);
                            const production = ((productionItem.amount * worldComponent.level) + (worldComponent.level - 1)) * timeElapsed;

                            inventory = editInventory(item, "Add", production, inventory);

                            message += `> ${item.emoji} x${production}\n`

                            worldComponent.lastTime = Date.now();
                        });
                    });

                    if (message === 'You Got:\n') message += '> Nothing';

                    await world.saveWorld(worldJSON);
                    await interaction.reply(message);
                }
                else if (interaction.customId.includes('__itemPageNavigate')) {
                    const page = Number(interaction.customId.split('$')[1]);
                    await interaction.update(await buildInventoryEmbed(interaction.user.id, interaction.user.username, page))
                }
                else if (interaction.customId.includes('__sellItem')) {
                    const item = ITEMS.filter((item) => {
                        return item.itemId === Number(interaction.customId.split('$')[1]);
                    })[0];

                    const sellModal = new ModalBuilder()
                        .setCustomid(`__sellModal$${item.itemId}`)
                        .setTitle(`Sell ${item.emoji}${item.itemName}`)
                        .addComponents(
                            new ActionRowBuilder()
                                .addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('__itemNumberSell')
                                        .setLabel(`How many ${item.itemName} do you want to sell?`)
                                        .setRequired(true)
                                        .setType("Short")
                                )["actionRow"]
                        );
                    
                    await interaction.showModal(sellModal["modal"]);
                }
                else if (interaction.customId.includes('__exploreUpgrade')) {
                    const data = JSON.parse(interaction.customId.split('$')[1]);
                    let done = false;

                    const worldJSON = await world.getWorld()
                    let inventory = worldJSON["inventory"];
                    const worldComponents = worldJSON["components"];
                    const worldComponent = worldComponents.filter((worldComponent) => { return worldComponent.location[0] === data["i"] && worldComponent.location[1] === data["j"] })[0];

                    const component = COMPONENTS.filter((commponent) => { return commponent.componentId === worldComponent.component })[0];

                    component.buyingDetails.forEach((buyingDetail) => {
                        const item = ITEMS.filter((item) => {
                            return item.itemId === buyingDetail.item;
                        })[0];

                        const cost = Math.ceil(((worldComponent.level + 1) * buyingDetail.amount) + (0.5 * buyingDetail.amount));

                        const newInv = editInventory(item, "Remove", cost, inventory);
                        
                        if (newInv !== undefined) {
                            inventory = newInv;
                            done = true;
                        } else {
                            done = false;
                            return;
                        }
                    });

                    if (done) {
                        worldComponent.level += 1;
                        await world.saveWorld(worldJSON);
                        await interaction.reply(`Your ${component.componentName} was successfully Upgraded to Level ${worldComponent.level}!`);
                    } else await interaction.reply(`You need more Materials to Upgrade Your ${component.componentName} to Level ${worldComponent.level + 1}!`);
                }
                else if (interaction.customId.includes('__setCentralLocation')) {
                    const data = JSON.parse(interaction.customId.split('$')[1]);

                    const worldJSON = await world.getWorld();
                    worldJSON["worldArray"][data["island"] - 1]["centralLocation"] = [data["i"], data["j"]];

                    await world.saveWorld(worldJSON);
                    await interaction.reply({
                        content: `Your Central Location was successfully set to [${data["i"]}, ${data["j"]}]!`,
                        ephemeral: true
                    });
                }
                else if (interaction.customId.includes('__currentTilePreview')) {
                    const data = JSON.parse(interaction.customId.split('$')[1]);

                    await interaction.reply({
                        content: `You have ${TILES.filter((tile) => { return tile.tileId === data["selectedTile"] })[0].tileName} selected currently!`,
                        ephemeral: true
                    });
                }
            }
            else if (interaction.isStringSelectMenu()) {
                const world = new WorldClass(interaction.user.id);
                const settings = new SettingsClass(interaction.user.id);

                if (interaction.customId === '__islandSelectMenu') {
                    const worldJSON = await world.getWorld();

                    const coin = ITEMS.filter((item) => {
                        return item.itemName === 'Coins';
                    })[0];

                    const islandNum = interaction.values[0] === 'create_island' ? worldJSON["worldArray"].length + 1 : interaction.values[0].replace('island', '');
            
                    if (islandNum > worldJSON["worldArray"].length) {
                        const newInv = editInventory(coin, "Remove", worldJSON["worldArray"].length * 100000, worldJSON["inventory"]);
        
                        if (newInv === undefined) {
                            await interaction.reply({
                                content: 'You don\'t have enough Money to Create a new Island!',
                                ephemeral: true
                            });
                            return;
                        } else {
                            const worldArray = createWorld(100, 100)
                            worldJSON["worldArray"].push({
                                islandNum: islandNum,
                                islandArray: worldArray,
                                centralLocation: [Math.ceil(worldArray.length / 2) - 1, Math.ceil(worldArray[0].length / 2) - 1]
                            });
                            worldJSON["inventory"] = newInv;
                        }
                        await world.saveWorld(worldJSON);
                    }
                    await interaction.update(await buildHomeScreen(interaction.user.id, interaction.user.id, islandNum));
                }
                else if (interaction.customId.includes('__buildableSelectMenu')) {
                    const data = JSON.parse(interaction.customId.split('$')[1]);

                    const worldJSON = await world.getWorld();

                    const worldArray = worldJSON["worldArray"][data["islandNum"] - 1]["islandArray"];

                    const centreTileI = worldJSON["worldArray"][data["islandNum"] - 1]["centralLocation"][0];
                    const centreTileJ = worldJSON["worldArray"][data["islandNum"] - 1]["centralLocation"][1];

                    const selectedBuildableComponent = COMPONENTS.filter((component) => {
                        return component.componentName.toLowerCase().replace(' ', '_') === interaction.values[0];
                    })[0];
                    const selectedBuildableTile = TILES.filter((tile) => {
                        return tile.component === selectedBuildableComponent.componentId;
                    })[0];

                    let buildConfirm = !(worldArray[centreTileI][centreTileJ] === selectedBuildableTile.canBuiltOn);

                    worldArray[centreTileI][centreTileJ] = selectedBuildableTile.tileId;
                    
                    await interaction.update({
                        content: renderWorld(worldArray, 5, 5, centreTileI, centreTileJ),
                        components: buildNavigationButtons({ i: centreTileI, j: centreTileJ, island: data["islandNum"], explore: false, selectedTile: selectedBuildableTile.tileId }, buildConfirm)
                    });
                }
                else if (interaction.customId === '__itemSelectMenu') {
                    interaction.reply(await buildItemEmbed(interaction.user.id, interaction.values[0]));
                }
                else if (interaction.customId.includes('__settingChoicesMenu')) {
                    const settingsJSON = await settings.getSettings();
                    const setting = SETTINGS.filter((setting) => {
                        return setting.settingId === interaction.customId.split('$')[1];
                    })[0];

                    settingsJSON[setting.settingId] = interaction.values[0];

                    await settings.saveSettings(settingsJSON);
                    await interaction.reply(`${setting.settingName} was successfully set to ${interaction.values[0]}!`);
                }
            }
            else if (interaction.isModalSubmit()) {
                const world = new WorldClass(interaction.user.id);

                if (interaction.customId.includes('__sellModal')) {
                    let amount = Number(interaction.fields.getTextInputValue('__itemNumberSell'));

                    const worldJSON = await world.getWorld();
                    let inventory = worldJSON["inventory"];

                    const item = ITEMS.filter((item) => {
                        return item.itemId === Number(interaction.customId.split('$')[1]);
                    })[0];
                    const sellItem = ITEMS.filter((sellItem) => {
                        return sellItem.itemId === item.sellGive.item;
                    })[0];

                    if (amount > inventory.filter((invItem) => { return invItem.item === item.itemId })[0].quantity) amount = inventory.filter((invItem) => { return invItem.item === item.itemId })[0].quantity;

                    inventory = editInventory(item, "Remove", amount, inventory);
                    inventory = editInventory(sellItem, "Add", amount * item.sellGive.amount, inventory);

                    await world.saveWorld(worldJSON);
                    await interaction.reply(`You sold your ${item.emoji}${item.itemName} x${amount} and got ${sellItem.emoji}${sellItem.itemName} x ${amount * item.sellGive.amount}`);
                }
            }
        } else {
            await interaction.reply({
                content: `You can\`t Use Someone Else\'s ${ComponentType[interaction.componentType]}!`,
                ephemeral: true
            });
        }
    })
    .defineEvent();

console.log('Events Defined!\n\n');
console.log('Define Commands\n');

new CommandBuilder()
    .setName('world')
    .setDescription('Manage Your Industrial World')
    .addSubCommand(
        new SubCommandBuilder()
            .setName('create')
            .setDescription('Create a new Industrial World or Reset Your current one')
            .addOption(
                new OptionBuilder()
                    .setType("String")
                    .setName('visibility')
                    .setDescription('Make Your Industrial World either Public or Private')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Public', value: 'Public' },
                        { name: 'Private', value: 'Private' }
                    )
            )
    )
    .addSubCommand(
        new SubCommandBuilder()
            .setName('view')
            .setDescription('View Your or Someone Else\'s Industrial World')
            .addOption(
                new OptionBuilder()
                    .setType("String")
                    .setName('island')
                    .setDescription('The Island You want to View(defaults to 1)')
                    .setAutocomplete(true)
            )
            .addOption(
                new OptionBuilder()
                    .setType("User")
                    .setName('user')
                    .setDescription('User whose World You want to View')
            )
    )
    .setAutocomplete(async function autocomplete(interaction) {
		const focusedOption = interaction.options.getFocused(true);
		let choices: string[] = [];

		if (focusedOption.name === 'island') {
            const world = new WorldClass(interaction.user.id);

            const worldJSON = await world.getWorld();

            worldJSON["worldArray"].forEach((island) => {
                choices.push(`Island ${worldJSON["worldArray"].indexOf(island) + 1}`);
            });
		}

		const filtered = choices.filter((choice) => choice.startsWith(focusedOption.value));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
    })
    .setExecute(async function execute(interaction) {
        if (interaction.options.getSubcommand() === 'create') {
            const world = new WorldClass(interaction.user.id);
            const worldExists: boolean = await world.getWorld() !== undefined;

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('__worldCreationCancel')
                        .setLabel('Cancel')
                        .setStyle("Danger"),
                    new ButtonBuilder()
                        .setCustomId(`__worldCreationConfirm$${JSON.stringify({ worldExists: worldExists, visibility: interaction.options.getString('visibility') })}`)
                        .setLabel('Confirm')
                        .setStyle("Primary")
                );

            await interaction.reply({
                content: worldExists ? 'Are You sure Resetting Your Current Industrial World?' : 'Are You sure Creating a New Industrial World?',
                components: [buttons["actionRow"]],
                ephemeral: interaction.options.getString('visibility') === 'Private'
            });
        } else if (interaction.options.getSubcommand() === 'view') {
            const island: number = interaction.options.getString('island') !== null ? Number(interaction.options.getString('island').replace('Island ', '')) : 1;
            let user = interaction.options.getUser('user') || interaction.user.id;

            if (user.bot) {
                await interaction.reply({
                    content: 'Bots can\'t make Worlds!',
                    ephemeral: true
                });
                return;
            } else if (user.id !== undefined) user = user.id;

            await interaction.reply(await buildHomeScreen(user, interaction.user.id, island));
        }
    })
    .defineCommand();

new CommandBuilder()
    .setName('inventory')
    .setDescription('View and Manage your inventory')
    .addOption(
        new OptionBuilder()
            .setType("String")
            .setName('item')
            .setDescription('The Item you want to view')
            .setAutocomplete(true)
    )
    .setAutocomplete(async function autocomplete(interaction) {
		const focusedOption = interaction.options.getFocused(true);
		let choices = [];

		if (focusedOption.name === 'item') {
            const world = new WorldClass(interaction.user.id);

            const worldJSON = await world.getWorld();

            worldJSON["inventory"].forEach((invItem) => {
                const item = ITEMS.filter((item) => {
                    return item.itemId === invItem.item;
                })[0];

                choices.push(`${item.emoji}${item.itemName} x${invItem.quantity}`);
            });
		}

		const filtered = choices.filter((choice) => choice.startsWith(focusedOption.value));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
    })
    .setExecute(async function execute(interaction) {
        const item = interaction.options.getString('item');

        if (item !== null) await interaction.reply(await buildItemEmbed(interaction.user.id, ITEMS.filter((itemFilter) => { return item.includes(itemFilter.itemName) })[0].itemName.toLowerCase().replace(' ', '_')));
        else await interaction.reply(await buildInventoryEmbed(interaction.user.id, interaction.user.username));
    })
    .defineCommand();

new CommandBuilder()
    .setName('info')
    .setDescription('Display information on this bot')
    .setExecute(async function execute(interaction) {
        const informationEmbed = new EmbedBuilder()
            .setTitle('About Industroz')
            .setDescription(`Industroz is a fun to play Discord Game Bot made by <@${BotAuthor}> in which you make a Spectacular and Ever Growing Industrial World!`)
            .addFields(
                { name: 'Bot Version', value: BotVersion },
                { name: 'Discord.js Version', value: DiscordJSVersion, inline: true },
                { name: 'Node.js Version', value: process.version, inline: true }
            );
        
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setStyle("Link")
                    .setLabel('Invite Bot')
                    .setUrl(BotInviteLink),
                new ButtonBuilder()
                    .setStyle("Link")
                    .setLabel('Support Server')
                    .setUrl(SupportServer),
                new ButtonBuilder()
                    .setStyle("Link")
                    .setLabel('GitHub Repository')
                    .setUrl(GitHubRepository)
            )

        await interaction.reply({
            components: [buttons["actionRow"]],
            embeds: [informationEmbed]
        });
    })
    .defineCommand();

new CommandBuilder()
    .setName('settings')
    .setDescription('Manage Your Industrial World Settings')
    .addOption(
        new OptionBuilder()
            .setType("String")
            .setName('setting')
            .setDescription('The Setting You want to Change')
            .setRequired(true)
            .setAutocomplete(true)
    )
    .setAutocomplete(async function execute(interaction) {
		const focusedOption = interaction.options.getFocused(true);
		let choices = [];

		if (focusedOption.name === 'setting') {
            SETTINGS.forEach((setting) => {
                choices.push(setting.settingName)
            });
		}

		const filtered = choices.filter((choice) => choice.startsWith(focusedOption.value));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
    })
    .setExecute(async function execute(interaction) {
        const settings = new SettingsClass(interaction.user.id);
        const setting = SETTINGS.filter((setting) => {
            return setting.settingName === interaction.options.getString('setting');
        })[0];

        const settingsJSON = await settings.getSettings();

        if (settingsJSON === undefined) {
            await interaction.reply({
                content: 'Looks like You don\'t have an Industrial World yet...',
                ephemeral: true
            });
            return;
        }

        const settingEmbed = new EmbedBuilder()
            .setTitle(setting.settingName)
            .setDescription(setting.settingDescription)
            .addFields({ name: 'Current Value', value: JSON.stringify(settingsJSON[setting.settingId]) })
            .setFooter({ text: setting.type })

        if (setting.type === "Choice") {
            const choicesSelectMenu = new ActionRowBuilder()
                .addComponents(
                    new SelectMenuBuilder()
                        .setType("StringSelect")
                        .setCustomid(`__settingChoicesMenu$${setting.settingId}`)
                        .setPlaceholder(`Select a Choice to Change ${setting.settingName} to...`)
                        .addOptions(...setting.choices.map((choice) => { return { label: choice, value: choice }; }))
                        .setDisabled(!setting.editable)
                );
            
            await interaction.reply({
                embeds: [settingEmbed],
                components: [choicesSelectMenu["actionRow"]]
            });
            return;
        } else {
            const settingValueChangeButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`__settingChangeValue$${setting.settingId}`)
                        .setLabel('Change Value')
                        .setDisabled(!setting.editable)
                        .setStyle("Success")
                );

            await interaction.reply({
                embeds: [settingEmbed],
                components: [settingValueChangeButton["actionRow"]]
            });
            return;
        }
    })
    .defineCommand();

console.log('Comands Defined!\n\n');

const events = getEvents();

for (const event of events) {
    if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.login(process.env.BOT_TOKEN);