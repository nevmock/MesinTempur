import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = "mongodb+srv://root:root@mesintempur.o0bdv.mongodb.net/";
const DB_NAME = "ShopeeAds";

let client: MongoClient;

export const connectDB = async () => {
    if (!client) {
        client = new MongoClient(MONGO_URI);
        await client.connect();
    }
    return client.db(DB_NAME);
};
