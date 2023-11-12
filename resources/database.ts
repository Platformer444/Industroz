import KeyvSqlite from "@keyv/sqlite";
import Keyv from "keyv";

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

    async Set(Key: string, Value: ValueType): Promise<KeyValuePair<ValueType>> {
        await this.Database.set(Key, Value);
        return { Key: Key, Value: Value };
    }

    async Get(Key: string): Promise<ValueType> {
        return await this.Database.get(Key);
    }
};