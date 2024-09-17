import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import chalk from "chalk"

import { Client, ClientOptions } from "discord.js";
import { Commands, TransformAPI } from "./commands.js";
import { Events } from "./events.js";

export let client: Client = undefined as any;

export async function ClientLogin(
    LoginOptions: {
        BotToken: string,
        ModulesDir: string,
        ClientOptions: ClientOptions
    }
): Promise<Client> {
    console.log();
    const ProjectDir: string = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../');

    client = new Client<true>(LoginOptions["ClientOptions"]);

    await client.login(LoginOptions["BotToken"]);

    console.log(chalk.blueBright(`Defining ${chalk.bold(chalk.greenBright('Modules'))}...\n`));

    const ModuleFiles: string[] = fs.readdirSync(path.join(ProjectDir, LoginOptions["ModulesDir"]));
    for (const ModuleFile of ModuleFiles) {
        if (!ModuleFile.endsWith('.js')) continue;
        await import(pathToFileURL(path.join(ProjectDir, LoginOptions["ModulesDir"], ModuleFile)).toString());
    }

    console.log(chalk.blueBright(`${chalk.bold(chalk.greenBright('Modules'))} Defined!\n`));

    client.application?.commands.set(Commands.map((Command) => {
        return {
            type: 1,
            name: Command["Name"],
            description: Command["Description"],
            options: [
                ...(TransformAPI(Command["SubCommandGroups"], "SubCommandGroup") ?? []),
                ...(TransformAPI(Command["SubCommands"], "SubCommand") ?? []),
                ...(TransformAPI(Command["Options"], "Option") ?? [])
            ]
        }
    }));

    for (const Event of Events) client.on(Event["Event"], async (...args) => { await Event.Execute(...args); });
    for (const Event of Events) client.off(Event["Event"], async (...args) => { await Event.Execute(...args); });

    console.log(chalk.blueBright(`${chalk.magentaBright('Client')} Successfully Logged In with ID ${chalk.magentaBright(client.user?.id)}!`));
    console.log();

    return client;
}