import KeyvSqlite from "@keyv/sqlite";
import Keyv from "keyv";
import sqlite3 from "sqlite3";

type KeyValuePair<T> = { Key: string, Value: T };

export default class DataBase<ValueType> {
    private DataBaseName: string;
    private Database: Keyv = undefined as any;

    constructor(
        DataBaseName: string
    ) {
        this.DataBaseName = DataBaseName;
        this.Database = new Keyv({ store: new KeyvSqlite({ uri: 'sqlite://database.sqlite', table: this.DataBaseName }) });
    }

    async Set(Key: string, Value: ValueType, Update: boolean = true): Promise<KeyValuePair<ValueType>> {
        const KeyValue = await this.Get(Key);

        if (KeyValue !== undefined) {
            await this.Database.set(Key, Value);    
            return { Key: Key, Value: Value };
        }
        else {
            if (Update) {
                await this.Database.set(Key, Value);    
                return { Key: Key, Value: Value };
            } else return { Key: Key, Value: KeyValue }
        }
    }

    async Get(Key: string | "All"): Promise<ValueType> {
        return await this.Database.get(Key);
    }

    async GetAll(): Promise<{ [Key: string]: ValueType }> {
        return new Promise((resolve, reject) => {
            const DB = new sqlite3.Database('./database.sqlite');

            DB.all(`SELECT key, value from ${this.DataBaseName}`, (Error: Error, Rows: { key: string; value: string; }[]) => {
                if (Error) {
                    console.log(Error);
                    return;
                }

                const _Data: { [Key: string]: ValueType } = {};
                Rows.forEach((KeyValue) => { _Data[KeyValue["key"].replace('keyv:', '')] = JSON.parse(KeyValue["value"])["value"]; });
                resolve(_Data);
            });
            DB.close();
        })
    }
};