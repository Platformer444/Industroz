import { ClientEvents } from "discord.js"

export interface Event {
    name: keyof ClientEvents,
    once: boolean,
    execute: (...args: any[]) => any
};

const events: Event[] = [];

export function defineEvent(event: Event) {
    let exists = false;

    events.forEach((eventLoop) => {
        if (eventLoop["name"] === event["name"]) {
            events.splice(events.indexOf(eventLoop), 1);
            exists = true;
            return;
        }
    });
    events.push(event);

    if (!exists) console.log(`\t${event["name"]} defined!\n`);
    return event;
};
export function getEvents() : Event[] { return events; };

export class EventBuilder {
    private event: Event = {
        name: undefined,
        once: false,
        execute: undefined
    };

    setName(name: keyof ClientEvents): this { this.event["name"] = name; defineEvent(this.event); return this; };

    setOnce(once: boolean): this { this.event["once"] = once; defineEvent(this.event); return this };

    setExecute(execute: Event["execute"]): this { this.event["execute"] = execute; defineEvent(this.event); return this; };
};