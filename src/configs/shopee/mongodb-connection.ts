import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = "mongodb+srv://root:root@mesintempur.o0bdv.mongodb.net/";
const DB_NAME = "ShopeeAds";

let client: MongoClient | null = null;

export const connectDB = async (): Promise<{ client: MongoClient; db: Db }> => {
    if (!client) {
        client = new MongoClient(MONGO_URI);
        await client.connect();
        console.info("✅ Connected to MongoDB");
    }

    const db = client.db(DB_NAME);
    return { client, db };
};

export const closeDB = async (): Promise<void> => {
    if (client) {
        await client.close();
        console.info("❎ Disconnected from MongoDB");
        client = null;
    }
};
