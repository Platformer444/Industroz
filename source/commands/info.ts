import { EmbedBuilder } from "discord.js";
import { BotAuthor, BotVersion, DiscordJSVersion, BotInviteLink, SupportServer, GitHubRepository } from "../resources/data.js";
import { CommandBuilder } from "../utils/commands.js";
import { ActionRowBuilder, ButtonBuilder } from "../utils/components.js";

export default function info() {
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
}