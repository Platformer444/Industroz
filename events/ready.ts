import { client } from "./../resources/Bot/client.js";
import { MarketplaceDatabase } from "./../commands/marketplace.js";
import defineEvent from "./../resources/Bot/events.js";

import { CategoryChannel, ChannelType } from "discord.js";
import "dotenv/config.js";

defineEvent(
    {
        Event: "ready",
        Name: 'Client Ready',
        Execute: async () => {
            const DevServer = await client.guilds.fetch(process.env.DEV_SERVER ?? "");
            const ManageChannels = ['errors', 'adminpanel'];
            const Channels = await DevServer.channels.fetch();

            const BotCategory = Channels.filter((Channel) => {
                if (Channel) if (Channel.type === ChannelType.GuildCategory) return Channel.name === 'Industroz Management';
            }).at(0) ?? DevServer.channels.create({ name: 'Industroz Managment', type: ChannelType.GuildCategory });

            const ManagementChannels = Channels.filter((Channel) => {
                if (Channel) if (Channel.type === ChannelType.GuildText) return ManageChannels.includes(Channel.name);
            });
            if (ManagementChannels.size !== ManageChannels.length) {
                const Names = ManagementChannels.map((Channel) => { if (Channel) return Channel.name; });
                ManageChannels.forEach(async (ChannelName) => {
                    if (!Names.includes(ChannelName)) {
                        const Channel = await DevServer.channels.create({ name: ChannelName, type: ChannelType.GuildText })
                            .then(async (Channel) => {
                                await Channel.setParent(BotCategory as CategoryChannel);
                                return Channel;
                            });
                        ManagementChannels.set(Channel.id, Channel);
                    }
                });
            }

            await MarketplaceDatabase.Set('Global', { Offers: [{ User: '1150357997491593247', Items: [{ Item: { Item: 1, Quantity: 1 }, Cost: { Item: 1, Quantity: 1 }, OfferEndTime: Date.now() + (3 * 24 * 60 * 60 * 1000) }] }] }, true);
        }
    }
);