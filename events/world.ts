import { ButtonInteraction, StringSelectMenuInteraction } from "discord.js";
import defineEvent from "../resources/Bot/events.js";
import { WorldDatabase } from "./../commands/world.js";
import { client } from "../resources/Bot/client.js";
import { BotUtils, WorldUtils } from "./../resources/utils.js";
import defineComponents from "./../resources/Bot/components.js";
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
                    await interaction.update({
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
                                    Position: Data["Position"],
                                    Explore: false
                                }
                            }
                        ),
                        defineComponents(
                            {
                                ComponentType: "Button",
                                CustomID: 'Explore',
                                Label: 'Back',
                                Emoji: '↩️',
                                Style: "Primary",
                                Data: Data
                            }
                        )
                    ]
                });

                case "Home": return await interaction.update(await BotUtils.BuildHomeScreen(await client.users.fetch(Data["User"]), Data["Island"]));

                case "Nav":
                    if (Data["To"] === "L") return await interaction.update(await WorldUtils.NavigateWorld(Data, [0, -1]));
                    else if (Data["To"] === "R") return await interaction.update(await WorldUtils.NavigateWorld(Data, [0, 1]));
                    else if (Data["To"] === "D") return await interaction.update(await WorldUtils.NavigateWorld(Data, [-1, 0]));
                    else if (Data["To"] === "U") return await interaction.update(await WorldUtils.NavigateWorld(Data, [1, 0]));
                    else if (Data["To"] === "DL") return await interaction.update(await WorldUtils.NavigateWorld(Data, [-1, -1]));
                    else if (Data["To"] === "DR") return await interaction.update(await WorldUtils.NavigateWorld(Data, [-1, 1]));
                    else if (Data["To"] === "UL") return await interaction.update(await WorldUtils.NavigateWorld(Data, [1, -1]));
                    else if (Data["To"] === "UR") return await interaction.update(await WorldUtils.NavigateWorld(Data, [1, 1]));
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
                case "IslandSelect": return;

                case "OutpostSelect": return;

                case "BuildableSelect":
                    Data["Tile"] = Tiles.filter((Tile) => { return Tile["Name"].replaceAll(' ', '_').toLowerCase() === interaction.values[0] })[0]["ID"];

                    return await interaction.update(await BotUtils.BuildNavigation(Data));
            }
        }
    }
})