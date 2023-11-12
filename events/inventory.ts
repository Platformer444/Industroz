import { ButtonInteraction } from "discord.js";
import defineEvent from "./../resources/Bot/events.js";
import { WorldDatabase, World } from "./../commands/world.js";
import { Items } from "./../resources/data.js";
import { BotUtils } from "./../resources/utils.js";

defineEvent({
    Event: "interactionCreate",
    Name: '',
    Once: false,
    Execute: async (interaction: ButtonInteraction) => {
        if (interaction.isButton()) {
            const CustomID = interaction["customId"].split('$')[0];
            const Data = JSON.parse(interaction["customId"].split('$')[1]);
    
            switch (CustomID) {
                case "Inventory":
                    const Inventory = (await WorldDatabase.Get(interaction.user.id))["Inventory"];

                    await interaction.update(BotUtils.BuildListEmbed<World["Inventory"][0]>(
                        Inventory,
                        (Item) => {
                            const item = Items.filter((item) => { return item["ID"] === Item["Item"] })[0];
                            return [
                                `${item["Emoji"]} ${item["Name"]} x${Item["Quantity"]}`,
                                {
                                    Label: `${item["Name"]}(x${Item["Quantity"]})`,
                                    Emoji: item["Emoji"]
                                }
                            ];
                        },
                        async (interaction) => {
                            const Item = Items.filter((Item) => { return Item["Name"].replaceAll(' ', '_').toLowerCase() === interaction["values"][0].split('(')[0]; })[0];
                            await interaction.update(BotUtils.BuildInvenotryItemEmbed(Item["ID"], parseInt(interaction["values"][0].split('x')[1].replace(')', ''))));
                        },
                        {
                            EmbedTitle: `${interaction.user.displayName}'s Inventory`,
                            Page: 1
                        }
                    ));
            }
        }
    }
})