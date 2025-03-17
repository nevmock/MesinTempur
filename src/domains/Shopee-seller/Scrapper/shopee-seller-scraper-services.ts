import 'dotenv/config';
import ShopeeSellerRepository from './shopee-seller-repository';
import db from '../../../models';
import BotEngine from '../../../bot-engine';
import delay from '../../../utils/delay';
import { connectDB } from "../../../configs/shopee/mongodb-connection";

class ShopeeSellerScrapperServices {
    private repository: ShopeeSellerRepository;

    constructor() {
        this.repository = new ShopeeSellerRepository();
    }

    public isAlreadySaved = async (fromWIB: string, toWIB: string, title: string): Promise<boolean> => {
        const existingData = await db.iklan_report.findOne({
            where: {
                from_wib: fromWIB,
                to_wib: toWIB,
                title: title,
            },
        });
        return !!existingData;
    };

    public getUserInfo = async (): Promise<any> => {
        try {
            const targetUrl2 = `https://seller.shopee.co.id/portal/settings/shop/profile`;
            const url2 = new URL(targetUrl2);

            const hasSession = await BotEngine.hasSession({ platform: 'shopee_seller', botAccountIndex: 0 });

            if (hasSession) {
                await BotEngine.page?.goto(targetUrl2, { waitUntil: 'load' });
            }

            await delay(5000);

            const userInfo3 = await this.repository.getUserInfo();

            const db = await connectDB();
            const collection = db.collection("UserInfo");

            await collection.insertOne({
                createdAt: new Date(),
                data: userInfo3,
            });

            console.info("✅ Data berhasil disimpan ke MongoDB");

            return userInfo3;
        } catch (error) {
            console.error('Error processing product ads:', error);

        }
    };

    public getProductAds = async (startDefault: string, endDefault: any): Promise<any> => {
        try {
            const targetUrl = `https://seller.shopee.co.id/portal/marketing/pas/index?source_page_id=1&from=${startDefault}&to=${endDefault}&type=new_cpc_homepage&group=custom`;
            const url = new URL(targetUrl);
            const fromTimestamp = Number(url.searchParams.get('from'));
            const toTimestamp = Number(url.searchParams.get('to'));
    
            if (isNaN(fromTimestamp) || isNaN(toTimestamp)) {
                throw new Error('Invalid from or to parameter in URL');
            }
    
            const hasSession = await BotEngine.hasSession({ platform: 'shopee_seller', botAccountIndex: 0 });
            
            if (hasSession) {
                await BotEngine.page?.goto(targetUrl, { waitUntil: 'load' });
                await delay(5000);
            }
    
            console.log(`Extracted from: ${startDefault}, to: ${endDefault}`);
            const response = await this.repository.getProductAds2(startDefault, endDefault);
    
            const db = await connectDB();
            const collection = db.collection("ProductAds");
            
            await collection.insertOne({
                createdAt: new Date(),
                from: startDefault,
                to: endDefault,
                data: response,
            });
    
            console.info("✅ Data berhasil disimpan ke MongoDB");
            return response;
        } catch (error) {
            console.error('Error processing product ads:', error);
            return null;
        }
    };

    public getProductStock = async (): Promise<any> => {
        try {
            const targetUrl3 = `https://seller.shopee.co.id/portal/product/list/live/all`;
            const url3 = new URL(targetUrl3);

            const hasSession = await BotEngine.hasSession({ platform: 'shopee_seller', botAccountIndex: 0 });

            if (hasSession) {
                await BotEngine.page?.goto(targetUrl3, { waitUntil: 'load' });
            }

            await delay(5000);

            const productStock = await this.repository.getProductStock();

            const db = await connectDB();
            const collection = db.collection("ProductStock");

            await collection.insertOne({
                createdAt: new Date(),
                data: productStock,
            });

            console.info("✅ Data berhasil disimpan ke MongoDB");

            return productStock;
        } catch (error) {
            console.error('Error processing product ads:', error);

        }
    };

    
}

export default ShopeeSellerScrapperServices;
