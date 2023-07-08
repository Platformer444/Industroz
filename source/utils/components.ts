import { ButtonStyle, ChannelType, TextInputStyle } from "discord.js"

export interface Button {
    type: number,
    custom_id?: string,
    label?: string,
    style?: number,
    emoji?: string,
    url?: string,
    disabled?: boolean
};

export interface SelectMenuOption {
    label: string,
    value: string,
    description?: string | undefined,
    emoji?: string | undefined,
    default?: boolean | undefined
}

export interface SelectMenu {
    type: number,
    custom_id: string,
    options?: SelectMenuOption[] | undefined,
    channel_types?: (keyof typeof ChannelType)[],
    placeholder?: string | undefined,
    min_values?: number | undefined,
    max_values?: number | undefined,
    disabled?: boolean | undefined
}

export interface TextInput {
    type: number,
    custom_id: string,
    placeholder: string,
    label: string,
    value: string,
    required: boolean,
    style: number
}

export interface ActionRow {
    type: number,
    components: (Button | SelectMenu)[] | undefined
};

export interface Modal {
    customId: string,
    title: string,
    components: ActionRow[]
}

export enum SelectMenuTypes {
    StringSelect = 3,
    TextInput = 4,
    UserSelect = 5,
    RoleSelect = 6,
    MentionableSelect = 7,
    ChannelSelect = 8,
}

export class ActionRowBuilder {
    private actionRow: ActionRow = {
        type: 1,
        components: []
    };

    addComponents(...components: (ButtonBuilder | SelectMenuBuilder | TextInputBuilder)[]): this { components.forEach((component) => { component["button"] !== undefined ? this.actionRow["components"].push(component["button"]) : component["selectMenu"] !== undefined ? this.actionRow["components"].push(component["selectMenu"]) : this.actionRow["components"].push(component["textInput"]) }); return this; };
}

export class ButtonBuilder {
    private button: Button = {
        type: 2,
        custom_id: undefined,
        label: undefined,
        style: undefined,
        emoji: undefined,
        url: undefined,
        disabled: undefined
    };

    setCustomId(customId: string): this { this.button["custom_id"] = customId; return this; };

    setLabel(label: string): this { this.button["label"] = label; return this; };

    setStyle(style: keyof typeof ButtonStyle): this { this.button["style"] = ButtonStyle[style]; return this; };

    setEmoji(emoji: string): this { this.button["emoji"] = emoji; return this; };

    setUrl(url: string): this { this.button["url"] = url; return this; };

    setDisabled(disabled: boolean): this { this.button["disabled"] = disabled; return this; };
}

export class SelectMenuBuilder {
    private selectMenu: SelectMenu = {
        type: undefined,
        custom_id: undefined,
        placeholder: undefined,
        options: [],
        channel_types: [],
        min_values: 1,
        max_values: 1,
        disabled: false
    };

    setType(type: keyof typeof SelectMenuTypes): this { this.selectMenu["type"] = SelectMenuTypes[type]; return this };

    setCustomid(customId: string): this { this.selectMenu["custom_id"] = customId; return this; };

    setPlaceholder(placeholder: string): this { this.selectMenu["placeholder"] = placeholder; return this; };

    addOptions(...options: SelectMenuOption[]): this { options.forEach((option) => { this.selectMenu["options"].push(option) }); return this; };

    addChannelTypes(...channelTypes: (keyof typeof ChannelType)[]): this { channelTypes.forEach((channelType) => { this.selectMenu["channel_types"].push(channelType) }); return this; };

    setMinValue(minValue: number): this { this.selectMenu["min_values"] = minValue; return this; };

    setMaxValues(maxValue: number): this { this.selectMenu["max_values"] = maxValue; return this; };

    setDisabled(disabled: boolean): this { this.selectMenu["disabled"] = disabled; return this; };
}

export class TextInputBuilder {
    private textInput: TextInput = {
        type: 4,
        custom_id: undefined,
        placeholder: undefined,
        label: undefined,
        value: undefined,
        required: false,
        style: undefined
    }

    setCustomId(customId: string): this { this.textInput["custom_id"] = customId; return this; };

    setPlaceholder(placeholder: string): this { this.textInput["placeholder"] = placeholder; return this; };
    
    setLabel(label: string): this { this.textInput["label"] = label; return this; };
    
    setValue(value: string): this { this.textInput["value"] = value; return this; };
    
    setRequired(required: boolean): this { this.textInput["required"] = required; return this; };
    
    setType(style: keyof typeof TextInputStyle): this { this.textInput["style"] = TextInputStyle[style]; return this; };
}

export class ModalBuilder {
    private modal: Modal = {
        customId: undefined,
        title: undefined,
        components: []
    };

    setCustomid(customId: string): this { this.modal["customId"] = customId; return this; };

    setTitle(title: string): this { this.modal["title"] = title; return this; };

    addComponents(...components: ActionRow[]): this { components.forEach((component) => { this.modal["components"].push(component) }); return this; };
}