import { ButtonInteraction, StringSelectMenuInteraction } from "discord.js";
import defineEvent from "../resources/Bot/events.js";
import { WorldDatabase } from "./../commands/world.js";
import { client } from "../resources/Bot/client.js";
import { BotUtils, WorldUtils } from "./../resources/utils.js";
import { defineComponents } from "./../resources/Bot/components.js";
import { Items, Tiles } from "./../resources/data.js";

defineEvent({
    Event: "interactionCreate",
    Name: "World Button Interactions",
    Once: false,
    Execute: async (interaction: ButtonInteraction) => {
        if (interaction.isButton()) {
            const CustomID = interaction["customId"].split('$')[0];
            const Data = JSON.parse(interaction["customId"].split('$')[1]);

            switch (CustomID) {
                case "WorldCreateCancel":
                    return await interaction.update({
                        content: `~~${interaction.message.content}~~`,
                        components: []
                    });

                case "WorldCreateConfirm":
                    await WorldDatabase.Set(interaction.user.id, {
                        Islands: [
                            {
                                ID: 1,
                                Tiles: WorldUtils.CreateWorld(100, 100),
                                Outposts: [{
                                    Location: [49, 49],
                                    Default: true
                                }]
                            }
                        ],
                        Inventory: [
                            {
                                Item: 1,
                                Quantity: 10
                            },
                            {
                                Item: 2,
                                Quantity: 10
                            },
                            {
                                Item: 3,
                                Quantity: 10
                            }
                        ],
                        LastOnlineTime: Date.now(),
                        Visibility: Data["Visibility"]
                    });

                    return await interaction.update({
                        content: (Data["WorldExists"] ?
                            `Your Industrial World has been Resetted successfully` : 'A New Industrial World has been Created Successfully') +
                            `\nView the New World with </world view:${
                                ((await client.application?.commands.fetch())?.filter((Command) => { return Command.name === 'world' }).at(0))?.id
                            }>`,
                        components: []
                    });

                case "Explore": return await interaction.update(await BotUtils.BuildNavigation(Data));

                case "Build": return await interaction.update({
                    components: [
                        defineComponents(
                            {
                                ComponentType: "StringSelect",
                                CustomID: 'BuildableSelect',
                                Placeholder: 'Select a Buildable...',
                                Options: Tiles.filter((Tile) => { return Tile["Buildable"] ?? false }).map((Tile) => {
                                    return {
                                        Label: Tile["Name"],
                                        Description: Tile["BuyingDetails"]?.map((BuyingDetail) => {
                                            const Item = Items.filter((Item) => { return Item["ID"] === BuyingDetail["Item"] })[0];

                                            return `${Item["Emoji"]}${BuyingDetail["Quantity"]}`;
                                        }).join(' '),
                                        Emoji: Tile["Emoji"]
                                    };
                                }),
                                Data: {
                                    User: Data["User"],
                                    Island: Data["Island"],
                                    Position: Data["Position"]
                                }
                            }
                        ),
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

                case "ItemUse":
                    const Inventory = (await WorldDatabase.Get(interaction["user"]["id"]))["Inventory"];
                    const Options = Inventory.filter((InvItem) => {
                        const Item = Items.filter((Item) => { return Item["ID"] === InvItem["Item"] })[0];
                        if (Item["Usable"]) return InvItem;
                    }).map((InvItem) => {
                        const Item = Items.filter((Item) => { return Item["ID"] === InvItem["Item"] })[0];

                        return {
                            Label: Item["Name"],
                            Description: Item["Description"],
                            Emoji: Item["Emoji"]
                        };
                    });

                    if (Options["length"] === 0) return await interaction.reply({
                        content: `You don't have any Usable Items!`,
                        ephemeral: true
                    });
                    else return await interaction.update({
                        components: [
                            defineComponents(
                                {
                                    ComponentType: "StringSelect",
                                    CustomID: 'ItemUseSelect',
                                    Placeholder: 'Select an Item...',
                                    Options: Options,
                                    Data: Data
                                }
                            ),
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

                case "Home": return await interaction.update(await BotUtils.BuildHomeScreen(await client.users.fetch(Data["User"]), Data["Island"]));

                case "Nav":
                    if (Data["To"] === "L") return await interaction.update(await WorldUtils.NavigateWorld(Data, [0, -1]));
                    else if (Data["To"] === "R") return await interaction.update(await WorldUtils.NavigateWorld(Data, [0, 1]));
                    else if (Data["To"] === "D") return await interaction.update(await WorldUtils.NavigateWorld(Data, [1, 0]));
                    else if (Data["To"] === "U") return await interaction.update(await WorldUtils.NavigateWorld(Data, [-1, 0]));
                    else if (Data["To"] === "DL") return await interaction.update(await WorldUtils.NavigateWorld(Data, [1, -1]));
                    else if (Data["To"] === "DR") return await interaction.update(await WorldUtils.NavigateWorld(Data, [1, 1]));
                    else if (Data["To"] === "UL") return await interaction.update(await WorldUtils.NavigateWorld(Data, [-1, -1]));
                    else if (Data["To"] === "UR") return await interaction.update(await WorldUtils.NavigateWorld(Data, [-1, 1]));

                case "GetOfflineEarnings":
                    const World = await WorldDatabase.Get(interaction["user"]["id"]);

                    const Productions: Array<{ Buildable: number, Location: [number, number], Production: Array<{ Item: number, Amount: number } | "Hoarded"> }> = [];
                    const TimePassed = Math.floor((Date.now() - World["LastOnlineTime"]) / (1000 * 60));

                    World["LastOnlineTime"] = Date.now();

                    World["Islands"][Data["Island"] - 1]["Tiles"].forEach((_Tiles, Index1) => {
                        _Tiles.filter((Tile) => { return Tile["Component"]; }).forEach((Tile) => {
                            const _Tile = Tiles.filter((tile) => { return tile["ID"] === Tile["Tile"] })[0];

                            _Tile["Production"]?.forEach((Production) => {
                                const SalaryPaid = (Date.now() - (Tile["Component"]?.LastSalaryPay as number)) / (1000 * 60 * 60 * 24) < 1;
                                World["Inventory"] = BotUtils.EditInventory(World["Inventory"], Production, "Add", TimePassed);

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

                                if (!SalaryPaid) Tile["Component"]?.Hoarding.push({ Item: Production, Quantity: TimePassed });
                            });
                        });
                    });

                    await WorldDatabase.Set(interaction["user"]["id"], World);

                    let Message = `**Production for Island ${Data["Island"]}**`;
                    Productions.forEach((Production) => {
                        const Buildable = Tiles.filter((Tile) => { return Tile["ID"] === Production["Buildable"] })[0];
                        let MessageLine = `${Buildable["Emoji"]} ([${Production["Location"]}]) →`;

                        if (Production["Production"][0] !== "Hoarded") Production["Production"].forEach((Produce) => {
                            const Item = Items.filter((Item) => { return Item["ID"] === (Produce as { Item: number, Amount: number })["Item"] })[0];
                            MessageLine += `${Item["Emoji"]} +${(Produce as { Item: number, Amount: number })["Amount"]}`;
                        });
                        else MessageLine += ` Stocks Hoarded! Pay Salary to the Workers to Receive!`;

                        Message += `\n> ${MessageLine}`;
                    });

                    return await interaction.reply({
                        content: Message,
                        ephemeral: true
                    });

                case "TileInfo":
                    const world = await WorldDatabase.Get(Data["User"]);
                    const tile = world["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]];

                    return await interaction.reply({
                        ephemeral: true,
                        ...BotUtils.BuildTileInfoEmbed(tile["Tile"], tile["Component"])
                    });
            }
        }
    }
});

defineEvent({
    Event: "interactionCreate",
    Name: 'World StringSelectMenu Interaction',
    Once: false,
    Execute: async (interaction: StringSelectMenuInteraction) => {
        if (interaction.isStringSelectMenu()) {
            const CustomID = interaction["customId"].split('$')[0];
            const Data = JSON.parse(interaction["customId"].split('$')[1]);

            switch (CustomID) {
                case "IslandSelect":
                    if (interaction["values"][0] === 'create_an_island') return;
                    else return await interaction.update(await BotUtils.BuildHomeScreen(await client["users"].fetch(Data["User"]), parseInt(interaction["values"][0].split('_')[1])));

                case "OutpostSelect":
                    return await interaction.update(await BotUtils.BuildHomeScreen(await client["users"].fetch(Data["User"]), Data["Island"], parseInt(interaction["values"][0].split('_')[1])));

                case "BuildableSelect":
                    const World = await WorldDatabase.Get(interaction["user"]["id"]);
                    const Buildable = Tiles.filter((Tile) => { return Tile["Name"].replaceAll(' ', '_').toLowerCase() === interaction["values"][0] })[0];
                    let Done = false;

                    if (Buildable["BuildableOn"]) if (World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]]["Tile"] !== Buildable["BuildableOn"]) {
                        const Tile = Tiles.filter((Tile) => { return Tile["ID"] === Buildable["BuildableOn"] })[0];
                        return await interaction.reply({
                            content: `${Buildable["Emoji"]} ${Buildable["Name"]} can be Build on ${Tile["Emoji"]} ${Tile["Name"]} only!`,
                            ephemeral: true
                        });
                    }

                    if (Buildable["BuyingDetails"]) Buildable["BuyingDetails"]?.forEach(async (BuyingDetail) => {
                        const NewInventory = BotUtils.EditInventory(World["Inventory"], BuyingDetail["Item"], "Remove", BuyingDetail["Quantity"]);

                        if (NewInventory["length"] === 0) {
                            const Item = Items.filter((Item) => { return Item["ID"] === BuyingDetail["Item"]; })[0];
                            Done = false;

                            return await interaction.reply({
                                content: `You don't have enough ${Item["Emoji"]} ${Item["Name"]} to Build ${Buildable["Emoji"]} ${Buildable["Name"]}`!,
                                ephemeral: true
                            });
                        }
                        else {
                            Done = true;
                            World["Inventory"] = NewInventory;
                        }
                    });
                    else Done = true;

                    if (Done) {
                        if (Buildable["ID"] === 3) World["Islands"][Data["Island"] - 1]["Outposts"].push({
                            Location: [Data["Position"][0], Data["Position"][1]],
                            Default: false
                        });

                        World["Islands"][Data["Island"] - 1]["Tiles"][Data["Position"][0]][Data["Position"][1]] = Buildable["ID"] !== 3 ? { Tile: Buildable["ID"], Component: { Level: 1, Workers: 1, LastSalaryPay: Date.now(), Hoarding: [] } } : { Tile: Buildable["ID"] };
                        await WorldDatabase.Set(interaction["user"]["id"], World);

                        return await interaction.update(await BotUtils.BuildNavigation(Data));
                    }

                case "ItemUseSelect":
                    const world = await WorldDatabase.Get(Data["User"]);
                    const Item = Items.filter((Item) => { return Item["Name"].replaceAll(' ', '_').toLowerCase() === interaction["values"][0]; })[0];

                    if (Item.Usable) {
                        await Item.Usable(interaction, Data);
                        
                        world["Inventory"] = BotUtils.EditInventory(world["Inventory"], Item["ID"], "Remove", 1);

                        return await WorldDatabase.Set(Data["User"], world);
                    }
            }
        }
    }
})