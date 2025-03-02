import { TextChannel } from "discord.js";

import { client } from "../resources/Bot/client.js";
import defineEvent from "../resources/Bot/events.js";

import "dotenv/config";

defineEvent({
    Event: "error",
    Name: 'Error Handling',
    
    Execute: async (Utils, GameData, Error: Error) => {
        const DevServer = await client.guilds.fetch(process.env.DEV_SERVER ?? "");
        
        if (!DevServer) {
            console.log(`Please specify the ID of the Dev Server to Log Errors!`);
            process.exit(1);
        }

        const Channel = await DevServer.channels.fetch()
            .then(Channels => {
                const Channel = Channels.filter((Channel) => { return Channel?.name === "errors" }).at(0);
                return Channel;
            });

        await (Channel as TextChannel).send({
            content: `**${Error.name}**: ${Error.message}`,
            files: [
                {
                    name: "Error.json",
                    attachment: Buffer.from(JSON.stringify({
                        ErrorType: Error.name,
                        Message: Error.message,
                        Location: Error.stack?.split('\n')[1].replace('at ', '').trimStart()
                    }, null, '\t'))
                }
            ]
        });
    }
});