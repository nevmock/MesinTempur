import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = "mongodb://admin:admin123@103.30.195.110:27017/";
const DB_NAME = "TikTok";

let client: MongoClient;

export const connectDB = async () => {
    if (!client) {
        client = new MongoClient(MONGO_URI);
        await client.connect();
        console.info("✅ Connected to MongoDB");
    }
    return client.db(DB_NAME);
};
