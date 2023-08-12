export interface Choice {
    name: string,
    value: string
}

export interface Option {
    type: number,
    name: string,
    description: string,
    required?: boolean | undefined,
    options?: Option[] | undefined,
    choices?: Choice[] | undefined,
    autocomplete?: boolean | undefined
};

export interface Command {
    data: {        
        name: string,
        description: string,
        options: Option[]
    },
    node_env: "development" | "production",
    autocomplete?: (...args: any[]) => any,
    execute: (...args: any[]) => any
};

export enum OptionTypes {
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
    let exists = false;

    commands.forEach((commandLoop) => {
        if (commandLoop["data"]["name"] === command["data"]["name"]) {
            commands.splice(commands.indexOf(commandLoop), 1);
            commandsData.splice(commandsData.indexOf(commandLoop["data"]), 1)
            exists = true;
            return;
        }
    });
    commands.push(command);
    commandsData.push(command["data"])

    if (!exists) console.log(`\t${command["data"]["name"]} defined!\n`);
    return command;
}

export function getCommands(node_env: string) : [Command[], Command["data"][]] {
    const filteredCommands = commands.filter((command) => {
        if (command.node_env === "production" && node_env === "development") return true;
        else if (command.node_env === node_env) return true;
        else return false;
    });

    return [
        filteredCommands,
        commandsData.filter((commandData) => {
            const filteredCommand = filteredCommands.filter((command) => {
                return command["data"]["name"] === commandData["name"];
            })[0];

            if (filteredCommand === undefined) return false;
            else return true;
        })
    ];
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
        node_env: "production",
        autocomplete: undefined,
        execute: undefined
    };

    setName(name: string): this { this.command["data"]["name"] = name; defineCommand(this.command); return this; };

    setDescription(description: string): this { this.command["data"]["description"] = description; defineCommand(this.command); return this; };

    addSubCommand(subCommand: SubCommandBuilder): this { this.command["data"]["options"].push(subCommand["subCommand"]); defineCommand(this.command); return this; };
    
    addOption(option: OptionBuilder): this { this.command["data"]["options"].push(option["option"]); defineCommand(this.command); return this; };

    setNodeEnv(node_env: "development" | "production"): this { this.command["node_env"] = node_env; defineCommand(this.command); return this; };

    setAutocomplete(autocomplete: Command["autocomplete"]): this { this.command["autocomplete"] = autocomplete; defineCommand(this.command); return this; };

    setExecute(execute: Command["execute"]): this { this.command["execute"] = execute; defineCommand(this.command); return this; };
}