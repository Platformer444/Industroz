import { APIBaseComponent, ButtonInteraction, ButtonStyle, ChannelSelectMenuInteraction, ChannelType, ComponentType, MentionableSelectMenuBuilder, RoleSelectMenuInteraction, StringSelectMenuInteraction, TextInputStyle, UserSelectMenuInteraction } from "discord.js";

export interface Component {
    ComponentType: keyof typeof ComponentType,
    CustomID?: string,
    Disabled?: boolean,
    Data?: Record<string, any>,
    
    Label?: string,
    Placeholder?: string,

    ButtonStyle?: keyof typeof ButtonStyle,
    URL?: string,
    Emoji?: string,

    Options?: SelectMenuOption[],
    ChannelTypes?: ChannelType[],

    TextStyle?: keyof typeof TextInputStyle,
    Required?: boolean
};

export interface SelectMenuOption {
    Label: string,
    Value?: string,
    Description?: string,
    Emoji?: string,
    Default?: boolean
};

export interface Modal {
    Title: string,
    CustomID: string,
    Components: any,
    Data?: Record<string, any>
};

export function defineComponents(...Components: Component[]) {
    return {
        type: 1,
        components: [
            ...(TransformAPI(Components, "Button") ?? []),
            ...(TransformAPI(Components, "SelectMenu") ?? []),
            ...(TransformAPI(Components, "TextInput") ?? [])
        ]
    };
}

export function defineModal(Modal: Modal) {
    return {
        title: Modal["Title"],
        custom_id: Modal["CustomID"] + '$' + JSON.stringify(Modal["Data"] ?? {}),
        components: [Modal["Components"]]
    };
}

function TransformAPI(Data: Component[], Into: "Button" | "SelectMenu" | "TextInput"): any[] | undefined {
    if (Into === "Button") return Data
        .filter((Component) => { return Component["ComponentType"] === "Button" })
        .map((Component) => {
            return {
                type: 2,
                custom_id: Component["CustomID"] + '$' + JSON.stringify(Component["Data"] ?? {}),
                label: Component["Label"],
                emoji: Component["Emoji"],
                url: Component["URL"],
                disabled: Component["Disabled"] ?? false,
                style: ButtonStyle[Component["ButtonStyle"] ?? "Primary"],
            };
        });
    else if (Into === "SelectMenu") return Data
        .filter((Component) => { return Component["ComponentType"] !== "ActionRow" && Component["ComponentType"] !== "Button" && Component["ComponentType"] !== "TextInput" })
        .map((Component) => {
            return {
                type: ComponentType[Component["ComponentType"]],
                custom_id: Component["CustomID"] + '$' + JSON.stringify(Component["Data"] ?? {}),
                placeholder: Component["Placeholder"],
                options: Component["ComponentType"] === "StringSelect" ? 
                    Component["Options"]?.map((Option) => {
                        return {
                            label: Option["Label"],
                            value: Option["Value"] ?? Option["Label"].replaceAll(' ', '_').toLowerCase(),
                            description: Option["Description"],
                            emoji: Option["Emoji"],
                            default: Option["Default"] ?? false
                        }
                    }) : [],
                channel_types: Component["ComponentType"] === "ChannelSelect" ? Component["ChannelTypes"] : [],
                disabled: Component["Disabled"]
            };
        });
    else if (Into === "TextInput") return Data
        .filter((Component) => { return Component["ComponentType"] === "TextInput" })
        .map((Component) => {
            return {
                type: 4,
                custom_id: Component["CustomID"] + '$' + JSON.stringify(Component["Data"] ?? {}),
                placeholder: Component["Placeholder"],
                label: Component["Label"],
                style: TextInputStyle[Component["TextStyle"] ?? "Short"],
                required: Component["Required"] ?? false
            };
        });
}