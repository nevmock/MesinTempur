import 'dotenv/config';
import ShopeeSellerRepository from './shopee-seller-repository';
import db from '../../../models';
import BotEngine from '../../../bot-engine';
import delay from '../../../utils/delay';
import { connectDB } from "../../../configs/shopee/mongodb-connection";

class ShopeeSellerScrapperServices {
    private sellerRepository: ShopeeSellerRepository;

    constructor() {
        this.sellerRepository = new ShopeeSellerRepository();
    }

    public isAlreadySaved = async (fromWIB: string, toWIB: string, reportTitle: string): Promise<boolean> => {
        const existingReport = await db.iklan_report.findOne({
            where: {
                from_wib: fromWIB,
                to_wib: toWIB,
                title: reportTitle,
            },
        });
        return !!existingReport;
    };

    public getUserInfo = async (): Promise<any> => {
        try {
            // await this.sellerRepository.fetchCookies();
            const profileUrl = `https://seller.shopee.co.id/portal/settings/shop/profile`;

            const isSessionAvailable = await BotEngine.hasSession({ platform: 'shopee_seller', botAccountIndex: 0 });

            if (isSessionAvailable) {
                await BotEngine.page?.goto(profileUrl, { waitUntil: 'load' });
            }

            const profileData = await this.sellerRepository.getUserInfo();

            const mongoDB = await connectDB();
            const userCollection = mongoDB.collection("UserInfo");

            await userCollection.insertOne({
                uuid: "123e4567-e89b-12d3-a456-426614174000",
                createdAt: new Date(),
                data: profileData,
            });

            console.info("✅ Data profil pengguna berhasil disimpan ke MongoDB");
            return profileData;
        } catch (error) {
            console.error('❌ Terjadi kesalahan saat memproses data profil pengguna:', error);
            return null;
        }
    };

    public getProductAds = async (startDate: string, endDate: any): Promise<any> => {
        try {
            await this.sellerRepository.fetchCookies();
            const adsUrl = `https://seller.shopee.co.id/portal/marketing/pas/index?source_page_id=1&from=${startDate}&to=${endDate}&type=new_cpc_homepage&group=custom`;

            await BotEngine.page?.goto(adsUrl, { waitUntil: 'load' });
            const botAccountIndex = 0;
            const platform = 'shopee_seller';

            const url = new URL(adsUrl);
            const fromTimestamp = Number(url.searchParams.get('from'));
            const toTimestamp = Number(url.searchParams.get('to'));

            if (isNaN(fromTimestamp) || isNaN(toTimestamp)) {
                throw new Error('Parameter "from" atau "to" pada URL tidak valid');
            }

            const isSessionAvailable = await BotEngine.hasSession({ platform, botAccountIndex });
            if (isSessionAvailable) {
                await BotEngine.page?.goto(adsUrl, { waitUntil: 'load' });
                await delay(5000);
            }

            console.log(`📦 Mengambil data iklan produk dari: ${startDate} hingga: ${endDate}`);

            const adsData = await this.sellerRepository.getProductAds2(startDate, endDate);
            const shopInfo = await this.sellerRepository.getProductAdsInfo();
            const shopId = shopInfo.shop_id;

            const mongoDB = await connectDB();
            const adsCollection = mongoDB.collection("ProductAds");

            await adsCollection.insertOne({
                uuid: "123e4567-e89b-12d3-a456-426614174000",
                createdAt: new Date(),
                from: startDate,
                to: endDate,
                shop_id: shopId,
                data: adsData,
            });

            console.info("✅ Data iklan produk berhasil disimpan ke MongoDB");
            return adsData;
        } catch (error) {
            console.error('❌ Terjadi kesalahan saat memproses data iklan produk:', error);
            return null;
        }
    };

    public getProductStock = async (): Promise<any> => {
        try {
            const stockUrl = `https://seller.shopee.co.id/portal/product/list/live/all`;

            const isSessionAvailable = await BotEngine.hasSession({ platform: 'shopee_seller', botAccountIndex: 0 });

            if (isSessionAvailable) {
                await BotEngine.page?.goto(stockUrl, { waitUntil: 'load' });
            }

            await delay(5000);

            const stockData = await this.sellerRepository.getProductStock();

            const mongoDB = await connectDB();
            const stockCollection = mongoDB.collection("ProductStock");

            await stockCollection.insertOne({
                uuid: "123e4567-e89b-12d3-a456-426614174000",
                createdAt: new Date(),
                data: stockData,
            });

            console.info("✅ Data stok produk berhasil disimpan ke MongoDB");
            return stockData;
        } catch (error) {
            console.error('❌ Terjadi kesalahan saat memproses data stok produk:', error);
            return null;
        }
    };

    public getProductKey = async (startDate: string, endDate: string, campaignId: string): Promise<any> => {
        try {
            const keywordUrl = `https://seller.shopee.co.id/portal/marketing/pas/product/manual/${campaignId}?from=${startDate}&to=${endDate}&group=today`;

            await BotEngine.page?.goto(keywordUrl, { waitUntil: 'load' });

            const botAccountIndex = 0;
            const platform = 'shopee_seller';
            const url = new URL(keywordUrl);
            const fromTimestamp = Number(url.searchParams.get('from'));
            const toTimestamp = Number(url.searchParams.get('to'));

            if (isNaN(fromTimestamp) || isNaN(toTimestamp)) {
                throw new Error('Parameter "from" atau "to" pada URL tidak valid');
            }

            const isSessionAvailable = await BotEngine.hasSession({ platform, botAccountIndex });
            if (isSessionAvailable) {
                await BotEngine.page?.goto(keywordUrl, { waitUntil: 'load' });
                await delay(5000);
            }

            console.log(`🔍 Mengambil data keyword dari: ${startDate} hingga: ${endDate}, ID kampanye: ${campaignId}`);

            const keywordData = await this.sellerRepository.getProductKey(fromTimestamp, toTimestamp, campaignId);

            const mongoDB = await connectDB();
            const keywordCollection = mongoDB.collection("ProductKey");

            await keywordCollection.insertOne({
                uuid: "123e4567-e89b-12d3-a456-426614174000",
                createdAt: new Date(),
                from: startDate,
                to: endDate,
                campaign_id: campaignId,
                data: keywordData,
            });

            console.info("✅ Data keyword iklan berhasil disimpan ke MongoDB");
            return keywordData;
        } catch (error) {
            console.error('❌ Terjadi kesalahan saat memproses data keyword iklan produk:', error);
            return null;
        }
    };

    public getProductPerformance = async (startDate: string, endDate: any): Promise<any> => {
        try {
            const performanceUrl = `https://seller.shopee.co.id/datacenter/product/performance`;

            await BotEngine.page?.goto(performanceUrl, { waitUntil: 'load' });
            const botAccountIndex = 0;
            const platform = 'shopee_seller';

            await BotEngine.writeCookies({ platform, botAccountIndex });

            const url = new URL(performanceUrl);
            const fromTimestamp = Number(url.searchParams.get('from'));
            const toTimestamp = Number(url.searchParams.get('to'));

            if (isNaN(fromTimestamp) || isNaN(toTimestamp)) {
                throw new Error('Parameter "from" atau "to" pada URL tidak valid');
            }

            const isSessionAvailable = await BotEngine.hasSession({ platform, botAccountIndex });
            if (isSessionAvailable) {
                await BotEngine.page?.goto(performanceUrl, { waitUntil: 'load' });
                await delay(5000);
            }

            console.log(`📦 Mengambil data performa produk dari: ${startDate} hingga: ${endDate}`);

            const performanceData = await this.sellerRepository.getProductPerformance(startDate, endDate);

            const mongoDB = await connectDB();
            const performanceCollection = mongoDB.collection("ProductPerformance");

            await performanceCollection.insertOne({
                uuid: "123e4567-e89b-12d3-a456-426614174000",
                createdAt: new Date(),
                from: startDate,
                to: endDate,
                data: performanceData,
            });

            console.info("✅ Data performa produk berhasil disimpan ke MongoDB");
            return performanceData;
        } catch (error) {
            console.error('❌ Terjadi kesalahan saat memproses data performa produk:', error);
            return null;
        }
    };

}

export default ShopeeSellerScrapperServices;
