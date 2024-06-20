import { ApplicationCommandOptionType, AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js"
import chalk from "chalk";

interface Command {
    Name: string,
    Description: string,
    SubCommandGroups?: SubCommandGroup[],
    SubCommands?: SubCommand[]
    Options?: CommandOption[],
    Execute: (
        interaction: ChatInputCommandInteraction
    ) => Promise<any>
};

interface SubCommandGroup {
    Name: string,
    Description: string,
    SubCommands: SubCommand[]
};

interface SubCommand {
    Name: string,
    Description: string,
    Options?: CommandOption[]
};

interface CommandOption {
    Type: keyof typeof ApplicationCommandOptionType,
    Name: string,
    Description: string,
    Required?: boolean,
    Autocomplete?: (
        interaction: AutocompleteInteraction
    ) => Promise<{ Name: string, Value?: string }[]>,
    Choices?: string[]
};

export const Commands: Command[] = []

export default function defineCommand(Command: Command) {
    Commands.push(Command);
    console.log(chalk.blue(`\tCommand ${chalk.bold(chalk.greenBright(Command["Name"]))} Defined!\n`));
}

export function TransformAPI(Data: any[] = [], Into: "Option" | "SubCommandGroup" | "SubCommand"): any[] | undefined {
    if (Into === "Option") return Data.map((Option) => {
        return {
            type: ApplicationCommandOptionType[Option["Type"]],
            name: Option["Name"],
            description: Option["Description"],
            required: Option["Required"] ?? false,
            autocomplete: Option["Autocomplete"] === undefined ? false : true,
            choices: (Option["Choices"] ?? []).map((Choice: string) => {
                return { name: Choice, value: Choice };
            })
        }
    });

    else if (Into === "SubCommandGroup") return Data.map((SubCommandGroup) => {
        return {
            type: 2,
            name: SubCommandGroup["Name"],
            description: SubCommandGroup["Description"],
            options: TransformAPI(SubCommandGroup["SubCommands"], "SubCommand") ?? []
        }
    });

    else if (Into === "SubCommand") return Data.map((SubCommand) => {
        return {
            type: 1,
            name: SubCommand["Name"],
            description: SubCommand["Description"],
            options: TransformAPI(SubCommand["Options"], "Option") ?? []
        }
    });
}