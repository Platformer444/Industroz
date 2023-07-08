import { ClientEvents  } from "discord.js"

export interface Event {
    name: keyof ClientEvents,
    once: boolean,
    execute(...args): any
};

const events: Event[] = [];

export function defineEvent(event: Event) {
    events.push(event);
    console.log(`\t${event["name"]} defined!\n`);
    return event;
};
export function getEvents() : Event[] { return events; };

export class EventBuilder {
    private event: Event = {
        name: undefined,
        once: false,
        execute: undefined
    };

    setName(name: keyof ClientEvents): this { this.event["name"] = name; return this; };

    setOnce(once: boolean): this { this.event["once"] = once; return this };

    setExecute(execute: Event["execute"]): this { this.event["execute"] = execute; return this; };

    defineEvent(): this { defineEvent(this.event); return this };
};