import { ButtonInteraction, StringSelectMenuInteraction } from "discord.js";

import { client } from "./../resources/Bot/client.js";
import { defineComponents, SelectMenuOption } from "./../resources/Bot/components.js";
import defineEvent from "./../resources/Bot/events.js";

import { SettingsDatabase } from "../commands/settings.js";
import { WorldDatabase, World } from "../commands/world.js";
import { Items, Tile, Tiles } from "./../resources/Data.js";
import { Utils } from "./../resources/Utilities.js";

defineEvent({
    Event: "interactionCreate",
    Name: "World Button Interactions",
    
    Execute: async (interaction: ButtonInteraction) => {
        if (interaction.isButton()) {
            const CustomID = interaction.customId.split('$')[0];
            const Data = JSON.parse(interaction.customId.split('$')[1]);

            if (CustomID === "WorldCreateCancel") {
                return await interaction.update({
                    content: `~~${interaction.message.content}~~`,
                    components: []
                });
            }

            else if (CustomID === "WorldCreateConfirm") {
                await WorldDatabase.Set(interaction.user.id, {
                    Islands: [
                        {
                            ID: 1,
                            Tiles: Utils.CreateWorld(100, 100),
                            Outposts: [{
                                Location: [49, 49],
                                Default: true
                            }],
                            Shop: {
                                Items: Items.filter((Item) => { return Item["BuyingDetails"] }).map((Item) => {
                                    return {
                                        Item: Item["ID"],
                                        Quantity: 0
                                    }
                                }),
                                RestockNum: 0,
                                LastRestockTime: 0
                            }
                        }
                    ],
                    Inventory: [
                        { Item: 1, Quantity: 1000 },
                        { Item: 2, Quantity: 10 },
                        { Item: 3, Quantity: 10 }
                    ],
                    LastOnlineTime: Date.now(),
                });

                await SettingsDatabase.Set(interaction.user.id, {
                    Visibility: Data["Visibility"],
                    DisplayName: interaction.user.username
                });

                return await interaction.update({
                    content: (Data["WorldExists"] ?
                        `Your Industrial World has been Resetted successfully` : 'A New Industrial World has been Created Successfully') +
                        `\nView the New World with </world view:${
                            ((await client.application?.commands.fetch())?.filter((Command) => { return Command.name === 'world' }).at(0))?.id
                        }>`,
                    components: []
                });
            }

            else if (CustomID === "Explore") return await interaction.update(await Utils.BuildNavigation(Data, interaction.user));

            else if (CustomID === "Build") return await interaction.update({
                components: [
                    ...(Utils.BuildListEmbed<Tile>(
                        Tiles.filter((Tile) => { return Tile["Buildable"] ?? false }),
                        (Item) => {
                            const CostString = Utils.DisplayItemCost(Item["ID"], "Tiles", "BuyingDetails");
                            return [
                                '',
                                { Label: Item["Name"], Description: CostString.includes('undefined') ? Item["Description"] : CostString, Emoji: Item["Emoji"] }
                            ];
                        },
                        async (interaction, Data) => {
                            const World = await WorldDatabase.Get(interaction.user.id);
                            const Buildable = Tiles.filter((Tile) => { return Tile["Name"].replaceAll(' ', '_').toLowerCase() === interaction.values[0] })[0];

                            console.log(World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]]["Tile"]);
        
                            if (Buildable["BuildableOn"]) {
                                if (World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]]["Tile"] !== Buildable["BuildableOn"]) {
                                    const Tile = Tiles.filter((Tile) => { return Tile["ID"] === Buildable["BuildableOn"] })[0];
                                    return await interaction.reply({
                                        content: `${Buildable["Emoji"]} ${Buildable["Name"]} can be Build on ${Tile["Emoji"]} ${Tile["Name"]} only!`,
                                        ephemeral: true
                                    });
                                }
                            }

                            const [NewInventory, Message] = Utils.Pay(World["Inventory"], Buildable["BuyingDetails"] ?? []);
                            if (Message !== '') return await interaction.reply({
                                content: Message,
                                ephemeral: true
                            });

                            if (Buildable["ID"] === 3) World["Islands"][Data["Island"] - 1]["Outposts"].push({
                                Location: [Data["Position"][0], Data["Position"][1]],
                                Default: false
                            });
                            else if (Buildable["ID"] === 4) {
                                World["Islands"][Data["Island"] - 1]["Shop"]["Items"].forEach((Item) => { Item["Quantity"] += 10 });
                                World["Islands"][Data["Island"] - 1]["Shop"]["RestockNum"] += 10;
                                World["Islands"][Data["Island"] - 1]["Shop"]["LastRestockTime"] = Date.now();
                            }
                            
                            World["Inventory"] = NewInventory;
                            World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]] = ![3].includes(Buildable["ID"]) ? { Tile: Buildable["ID"], Component: { Level: 1, Workers: 1, LastSalaryPay: Date.now(), Hoarding: [] } } : { Tile: Buildable["ID"] };
                            await WorldDatabase.Set(interaction.user.id, World);
    
                            return await interaction.update(await Utils.BuildNavigation(Data, interaction.user));
                        },
                        {
                            Embed: false,
                            Title: 'BuildablesSelect',
                            Page: 1,
                            SelectMenuData: Data
                        }
                    )["components"] ?? []),
                    defineComponents(
                        {
                            ComponentType: "Button",
                            CustomID: 'Explore',
                            Label: 'Back',
                            Emoji: '↩️',
                            ButtonStyle: "Primary",
                            Data: Data
                        }
                    )
                ]
            });

            else if (CustomID === "ItemUse") {
                const Inventory = (await WorldDatabase.Get(interaction.user.id))["Inventory"];
                const UsableItems = Inventory.filter((InvItem) => {
                    const Item = Items.filter((Item) => { return Item["ID"] === InvItem["Item"] })[0];
                    if (Item["Usable"]) return InvItem;
                });

                if (UsableItems["length"] === 0) return await interaction.reply({
                    content: `You don't have any Usable Items!`,
                    ephemeral: true
                });
                else return await interaction.update({
                    components: [
                        ...(Utils.BuildListEmbed<World["Inventory"][0]>(
                            UsableItems,
                            (Item) => {
                                const _Item = Items.filter((_Item) => { return _Item["ID"] === Item["Item"] })[0];

                                return [
                                    '',
                                    { Label: _Item["Name"], Description: _Item["Description"], Emoji: _Item["Emoji"] }
                                ];
                            },
                            async (interaction, Data) => {
                                const world = await WorldDatabase.Get(Data["User"]);
                                const Item = Items.filter((Item) => { return Item["Name"].replaceAll(' ', '_').toLowerCase() === interaction.values[0]; })[0];
            
                                if (Item.Usable) {
                                    await Item.Usable(interaction, Data);
                                    
                                    world["Inventory"] = Utils.EditInventory(world["Inventory"], Item["ID"], "Remove", 1);
            
                                    return await WorldDatabase.Set(Data["User"], world);
                                }
                            },
                            {
                                Embed: false,
                                Title: 'ItemUse',
                                Page: 1,
                                SelectMenuData: Data
                            }
                        )["components"] ?? []),
                        defineComponents(
                            {
                                ComponentType: "Button",
                                CustomID: 'Explore',
                                Label: 'Back',
                                Emoji: '↩️',
                                ButtonStyle: "Primary",
                                Data: Data
                            }
                        )
                    ]
                });
            }

            else if (CustomID === "Home") return await interaction.update(await Utils.BuildHomeScreen(await client.users.fetch(Data["User"]), interaction.user, Data["Island"]));

            else if (CustomID === "Nav") {
                if (Data["To"] === "L") return await interaction.update(await Utils.NavigateWorld(Data, interaction.user, [0, -1]));
                else if (Data["To"] === "R") return await interaction.update(await Utils.NavigateWorld(Data, interaction.user, [0, 1]));
                else if (Data["To"] === "D") return await interaction.update(await Utils.NavigateWorld(Data, interaction.user, [1, 0]));
                else if (Data["To"] === "U") return await interaction.update(await Utils.NavigateWorld(Data, interaction.user, [-1, 0]));
                else if (Data["To"] === "DL") return await interaction.update(await Utils.NavigateWorld(Data, interaction.user, [1, -1]));
                else if (Data["To"] === "DR") return await interaction.update(await Utils.NavigateWorld(Data, interaction.user, [1, 1]));
                else if (Data["To"] === "UL") return await interaction.update(await Utils.NavigateWorld(Data, interaction.user, [-1, -1]));
                else if (Data["To"] === "UR") return await interaction.update(await Utils.NavigateWorld(Data, interaction.user, [-1, 1]));
            }

           else if (CustomID === "GetOfflineEarnings") {
                const World = await WorldDatabase.Get(interaction.user.id);

                const Productions: Array<{ Buildable: number, Location: [number, number], Production: Array<{ Item: number, Amount: number } | "Hoarded"> }> = [];
                const SelectMenuOptions: SelectMenuOption[] = [];

                const TimePassed = Math.floor((Date.now() - World["LastOnlineTime"]) / (1000 * 60));

                World["LastOnlineTime"] = Date.now();

                World["Islands"][Data["Island"] - 1]["Tiles"].forEach((_Tiles, Index1) => {
                    _Tiles.filter((Tile) => { return Tile["Component"]; }).forEach((Tile) => {
                        const _Tile = Tiles.filter((tile) => { return tile["ID"] === Tile["Tile"] })[0];

                        _Tile["Production"]?.forEach((Production) => {
                            const SalaryPaid = (Date.now() - (Tile["Component"]?.LastSalaryPay as number)) / (1000 * 60 * 60 * 24) < 1;
                            World["Inventory"] = Utils.EditInventory(
                                World["Inventory"],
                                Production,
                                "Add",
                                TimePassed * (Tile["Component"]?.Workers as number) + (Tile["Component"]?.Level as number)
                            );

                            const ExistingProducer = Productions.filter((Producer) => {
                                return Producer["Location"][0] === Index1 && Producer["Location"][1] === _Tiles.indexOf(Tile);
                            })[0];

                            if (!ExistingProducer) Productions.push({
                                Buildable: _Tile["ID"],
                                Location: [Index1, _Tiles.indexOf(Tile)],
                                Production: [SalaryPaid ? { Item: Production, Amount: TimePassed } : "Hoarded"]
                            });
                            else Productions.splice(
                                Productions.indexOf(ExistingProducer),
                                1,
                                {
                                    ...ExistingProducer,
                                    Production: [...ExistingProducer["Production"], SalaryPaid ? { Item: Production, Amount: TimePassed } : "Hoarded"]
                                }
                            );

                            if (!SalaryPaid) {
                                Tile["Component"]?.Hoarding.push({ Item: Production, Quantity: TimePassed });
                                SelectMenuOptions.push({
                                    Label: _Tile["Name"],
                                    Value: `${Data["Island"]}$[${[Index1, _Tiles.indexOf(Tile)]}]$${_Tile["ID"]}`,
                                    Description: `Island ${Data["Island"]} → [${[Index1, _Tiles.indexOf(Tile)]}]`,
                                    Emoji: _Tile["Emoji"]
                                });
                            }
                        });
                    });
                });

                await WorldDatabase.Set(interaction.user.id, World);

                let Message = `**Production for Island ${Data["Island"]}**`;
                Productions.forEach((Production) => {
                    const Buildable = Tiles.filter((Tile) => { return Tile["ID"] === Production["Buildable"] })[0];
                    let MessageLine = `${Buildable["Emoji"]} ([${Production["Location"]}]) →`;

                    if (Production["Production"][0] !== "Hoarded") Production["Production"].forEach((Produce) => {
                        const Item = Items.filter((Item) => { return Item["ID"] === (Produce as { Item: number, Amount: number })["Item"] })[0];
                        MessageLine += `${Item["Emoji"]} +${(Produce as { Item: number, Amount: number })["Amount"]}`;
                    });
                    else MessageLine += ` *Stocks Hoarded! Pay Salary to the Workers to Receive!*`;

                    Message += `\n> ${MessageLine}`;
                });

                return await interaction.reply({
                    content: Message,
                    components: SelectMenuOptions["length"] > 0 ? Utils.BuildListEmbed<SelectMenuOption>(
                        SelectMenuOptions,
                        (Item) => {
                            return [
                                '',
                                Item
                            ];
                        },
                        async (interaction) => {
                            const Island = parseInt(interaction.values[0].split('$')[0]);
                            const Location = JSON.parse(interaction.values[0].split('$')[1]);

                            return await interaction.reply(await Utils.PaySalary({
                                User: interaction.user.id,
                                Island: Island,
                                Position: Location
                            }));
                        },
                        {
                            Embed: false,
                            Page: 1
                        }
                    )["components"] : undefined,
                    ephemeral: true
                });
            }

            else if (CustomID === "TileInfo") {
                return await interaction.reply({
                    ephemeral: true,
                    ...(await Utils.BuildTileInfoEmbed(Data, interaction.user))
                });
            }

            else if (CustomID === "Salary") return await interaction.reply(await Utils.PaySalary(Data));

            else if (CustomID === "Upgrade") await interaction.reply(await Utils.UpgradeBuildable(Data));
        }
    }
});

defineEvent({
    Event: "interactionCreate",
    Name: 'World StringSelectMenu Interaction',
    
    Execute: async (interaction: StringSelectMenuInteraction) => {
        if (interaction.isStringSelectMenu()) {
            const CustomID = interaction.customId.split('$')[0];
            const Data = JSON.parse(interaction.customId.split('$')[1]);

            if (CustomID ==="IslandSelect") {
                if (interaction.values[0] === 'create_an_island') {
                    const World = await WorldDatabase.Get(Data["User"]);

                    const NewInventory = Utils.EditInventory(World["Inventory"], 1, "Remove", World["Inventory"]["length"] * 100000);
                    if (NewInventory["length"] === 0) {
                        const Item = Items.filter((Item) => { return Item["ID"] === 1 })[0];
                        return await interaction.reply({
                            content: `You don't have Enough ${Item["Emoji"]}${Utils.Plural(Item["Name"])} to Create a New Island!`,
                            ephemeral: true
                        });
                    }
                    else {
                        World["Islands"].push(
                            {
                                ID: World["Islands"]["length"] + 1,
                                Tiles: Utils.CreateWorld(100, 100),
                                Outposts: [{
                                    Location: [49, 49],
                                    Default: true
                                }],
                                Shop: {
                                    Items: Items.filter((Item) => { return Item["BuyingDetails"] }).map((Item) => {
                                        return {
                                            Item: Item["ID"],
                                            Quantity: 0
                                        }
                                    }),
                                    RestockNum: 0,
                                    LastRestockTime: 0
                                }
                            }
                        );
                        World["Inventory"] = NewInventory;

                        await WorldDatabase.Set(Data["User"], World);
                        return await interaction.update(await Utils.BuildHomeScreen(await client["users"].fetch(Data["User"]), interaction.user, World["Islands"]["length"]));
                    }
                }
                else return await interaction.update(await Utils.BuildHomeScreen(await client["users"].fetch(Data["User"]), interaction.user, parseInt(interaction.values[0].split('_')[1])));
            }

            else if (CustomID === "OutpostSelect") return await interaction.update(await Utils.BuildHomeScreen(await client["users"].fetch(Data["User"]), Data["Island"], parseInt(interaction.values[0].split('_')[1])));
        }
    }
});