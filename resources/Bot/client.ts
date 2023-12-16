import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import chalk from "chalk"

import { Client, ClientOptions } from "discord.js";
import { Commands, TransformAPI } from "./commands.js";

export let client: Client = undefined as any;

export async function ClientLogin(
    LoginOptions: {
        BotToken: string,
        CommandsDir: string,
        EventsDir: string,
        ClientOptions: ClientOptions
    }
): Promise<Client<true>> {
    console.log();
    const ProjectDir: string = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../');

    client = new Client<true>(LoginOptions["ClientOptions"]);
    await client.login(LoginOptions["BotToken"]);

    console.log(chalk.blueBright(`Defining ${chalk.bold(chalk.greenBright('Commands'))}...\n`));
    const CommandFiles: string[] = fs.readdirSync(path.join(ProjectDir, LoginOptions["CommandsDir"]));
    for (const CommandFile of CommandFiles) {
        if (!CommandFile.endsWith('.js')) continue;
        await import(pathToFileURL(path.join(ProjectDir, LoginOptions["CommandsDir"], CommandFile)).toString());
    }
    console.log(chalk.blueBright(`${chalk.bold(chalk.greenBright('Commands'))} Defined!\n`));

    console.log(chalk.blueBright(`Defining ${chalk.bold(chalk.cyanBright('Events'))}...\n`));
    const EventFiles: string[] = fs.readdirSync(path.join(ProjectDir, LoginOptions["EventsDir"]));
    for (const EventFile of EventFiles) {
        if (!EventFile.endsWith('.js')) continue;
        await import(pathToFileURL(path.join(ProjectDir, LoginOptions["EventsDir"], EventFile)).toString());
    }
    console.log(chalk.blueBright(`Events ${chalk.cyanBright('Defined')}!\n`));

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

    console.log(chalk.blueBright(`${chalk.magentaBright('Client')} Successfully Logged In with ID ${chalk.magentaBright(client.user?.id)}!`));
    console.log();

    return client;
}