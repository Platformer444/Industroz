import { ButtonStyle, ChannelType, ComponentType } from "discord.js";

export interface Component {
    ComponentType: keyof typeof ComponentType,
    CustomID?: string,
    Disabled?: boolean,
    Data?: Record<string, any>,

    // For Buttons
    Label?: string,
    Style?: keyof typeof ButtonStyle,
    URL?: string,
    Emoji?: string,

    // For SelectMenu
    Placeholder?: string,
    Options?: SelectMenuOption[],
    ChannelTypes?: ChannelType[]
};

export interface SelectMenuOption {
    Label: string,
    Description?: string,
    Emoji?: string,
    Default?: boolean
};

export default function defineComponents(...Components: Component[]) {
    return {
        type: 1,
        components: [
            ...(TransformAPI(Components, "Button") ?? []),
            ...(TransformAPI(Components, "SelectMenu") ?? [])
        ]
    }
}

function TransformAPI(Data: Component[], Into: "Button" | "SelectMenu"): any[] | undefined {
    if (Into === "Button") return Data
        .filter((Component) => { return Component["ComponentType"] === "Button" })
        .map((Component) => {
            return {
                type: 2,
                custom_id: Component["CustomID"] + '$' + JSON.stringify(Component["Data"] ?? {}) ?? "",
                label: Component["Label"] ?? "",
                emoji: Component["Emoji"] ?? "",
                url: Component["URL"] ?? "",
                disabled: Component["Disabled"] ?? false,
                style: ButtonStyle[Component["Style"] ?? "Primary"],
            };
        });
    else if (Into === "SelectMenu") return Data
        .filter((Component) => { return Component["ComponentType"] !== "ActionRow" && Component["ComponentType"] !== "Button" })
        .map((Component) => {
            return {
                type: ComponentType[Component["ComponentType"]],
                custom_id: Component["CustomID"] + '$' + JSON.stringify(Component["Data"] ?? {}),
                placeholder: Component["Placeholder"],
                options: Component["ComponentType"] === "StringSelect" ? 
                    Component["Options"]?.map((Option) => {
                        return {
                            label: Option["Label"],
                            value: Option["Label"].replaceAll(' ', '_').toLowerCase(),
                            description: Option["Description"] ?? '',
                            emoji: Option["Emoji"] ?? '',
                            default: Option["Default"] ?? false
                        }
                    }) : [],
                channel_types: Component["ComponentType"] === "ChannelSelect" ? Component["ChannelTypes"] : [],
                disabled: Component["Disabled"]
            };
        });
}