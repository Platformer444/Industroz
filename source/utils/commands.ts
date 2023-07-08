import { REST, Routes } from "discord.js";

interface Choice {
    name: string,
    value: string
}

interface Option {
    type: number,
    name: string,
    description: string,
    required?: boolean | undefined,
    options?: Option[] | undefined,
    choices?: Choice[] | undefined,
    autocomplete?: boolean | undefined
};

interface Command {
    data: {        
        name: string,
        description: string,
        options: Option[]
    },
    autocomplete?(...args): any,
    execute(...args): any
};

enum OptionTypes {
    String = 3,
    Integer = 4,
    Boolean = 5,
    User = 6,
    Channel = 7,
    Role = 8,
    Mentionable = 9,
    Number = 10,
    Attachment = 11
}

const commands: Command[] = [];
const commandsData: Command["data"][] = [];

function defineCommand(command: Command) {
    let done = false;

    commands.forEach((commandLoop) => {
        if (commandLoop["data"]["name"] === command["data"]["name"]) {
            commands.splice(commands.indexOf(commandLoop), 0, command);
            commandsData.splice(commandsData.indexOf(commandLoop["data"]), 0, command["data"]);
            done = true;
        }
    });

    if (!done) {
        commands.push(command);
        commandsData.push(command["data"]);
    }

    console.log(`\t${command["data"]["name"]} ${done ? 'redefined': 'defined'}!\n`);
    return command;
};
export function getCommands() : [Command[], Command["data"][]] { return [commands, commandsData]; };
export async function registerCommands() {
    const rest: REST = new REST().setToken(process.env.BOT_TOKEN);
    const commands: Command["data"][] = getCommands()[1];

    await (async () => {
        try {
            console.log(`Started refreshing ${commands.length} application (/) commands.`);
    
            const data: any = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands },
            );
    
            console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        } catch (error) {
            console.error(error);
        }
    })();
}

export class OptionBuilder {
    private option: Option = {
        type: undefined,
        name: undefined,
        description: undefined,
        required: false,
        choices: [],
        autocomplete: false
    };

    setType(type: keyof typeof OptionTypes): this { this.option["type"] = OptionTypes[type]; return this; };

    setName(name: string): this { this.option["name"] = name; return this; };

    setDescription(description: string): this { this.option["description"] = description; return this; };

    setRequired(required: boolean): this { this.option["required"] = required; return this; };

    setAutocomplete(autocomplete: boolean): this { this.option["autocomplete"] = autocomplete; return this; };

    addChoices(...choices: Choice[]): this { choices.forEach((choice) => { this.option["choices"].push(choice) }); return this; };
}

export class SubCommandBuilder {
    private subCommand: Option = {
        type: 1,
        name: undefined,
        description: undefined,
        options: []
    };

    setName(name: string): this { this.subCommand["name"] = name; return this; };

    setDescription(description: string): this { this.subCommand["description"] = description; return this; };

    addOption(option: OptionBuilder): this { this.subCommand["options"].push(option["option"]); return this; };
}

export class CommandBuilder {
    private command: Command = {
        data: {
            name: undefined,
            description: undefined,
            options: []
        },
        autocomplete: undefined,
        execute: undefined
    };

    setName(name: string): this { this.command["data"]["name"] = name; return this; };

    setDescription(description: string): this { this.command["data"]["description"] = description; return this; };

    addSubCommand(subCommand: SubCommandBuilder): this { this.command["data"]["options"].push(subCommand["subCommand"]); return this; };
    
    addOption(option: OptionBuilder): this { this.command["data"]["options"].push(option["option"]); return this; };

    setAutocomplete(autocomplete: Command["autocomplete"]): this { this.command["autocomplete"] = autocomplete; return this; };

    setExecute(execute: Command["execute"]): this { this.command["execute"] = execute; return this; };
    
    defineCommand(): this { defineCommand(this.command); return this; };
}