import fs from 'fs';
import path from 'path';
import { parse } from 'json2csv';
import * as XLSX from 'xlsx';
import 'dotenv/config';
import ShopeeSellerRepository from './shopee-seller-repository';
import db from '../../../models';
import BotEngine from '../../../bot-engine';
import delay from '../../../utils/delay';
import { report } from 'process';

class ShopeeSellerScrapperServices {
    private repository: ShopeeSellerRepository;

    // Constructor to initialize the repository instance
    constructor() {
        this.repository = new ShopeeSellerRepository();
    }

    // Method to check if the data already exists in the database based on fromWIB, toWIB, and title
    public isAlreadySaved = async (fromWIB: string, toWIB: string, title: string): Promise<boolean> => {
        const existingData = await db.iklan_report.findOne({
            where: {
                from_wib: fromWIB,
                to_wib: toWIB,
                title: title, // pakai id product
            },
        });
        return !!existingData; // Return true if data exists, otherwise false
    };

    // Method to retrieve product ads, process them, and save to the database
    public getProductAds = async (startDefault: string, endDefault: any): Promise<any> => {
        try {
            const targetUrl =
                `https://seller.shopee.co.id/portal/marketing/pas/index?source_page_id=1&from=${startDefault}&to=${endDefault}&type=new_cpc_homepage&group=custom`;
            const url = new URL(targetUrl);
            const fromTimestamp = Number(url.searchParams.get('from'));
            const toTimestamp = Number(url.searchParams.get('to'));
    
            // Periksa sesi BotEngine
            const hasSession = await BotEngine.hasSession({ platform: 'shopee_seller', botAccountIndex: 0 });
    
            if (hasSession) {
                await BotEngine.page?.goto(targetUrl, { waitUntil: 'load' });
            } else {
                // console.log('Sesi tidak ditemukan. Melakukan proses login...');
                // Tambahkan proses login di sini (username, password, OTP, dll.)
                // Contoh:
                // await this.loginShopeeSeller();
            }
    
            await delay(5000); // Beri jeda waktu agar halaman ter-load dengan baik
    
            // Validasi parameter URL
            if (isNaN(fromTimestamp) || isNaN(toTimestamp)) {
                throw new Error('Invalid from or to parameter in URL');
            }
    
            // Konversi timestamp ke WIB
            const fromWIB = new Date((fromTimestamp + 7 * 3600) * 1000).toISOString();
            const toWIB = new Date((toTimestamp + 7 * 3600) * 1000).toISOString();
    
            console.log(`Extracted from: ${startDefault}, to: ${endDefault}`);
    
            // Ambil data dari repository
            const response = await this.repository.getProductAds2(startDefault, endDefault);
            const entryList = response.data.entry_list;
    
            for (const element of entryList) {
                const startTime = element.campaign.start_time;
                const title = element.title;
    
                // Periksa apakah data sudah ada di database
                const alreadySaved = await this.isAlreadySaved(startDefault, endDefault, title);
    
                if (alreadySaved) {
                    console.info(
                        `Data dengan startDefault [${startDefault}], endDefault [${endDefault}], dan title [${title}] sudah ada. Melewati...`
                    );
                    continue;
                }
    
                const report = element.report;
                const campaign = element.campaign;
    
                // Simpan data baru ke database
                await this.saveToAdsProduct(
                    title,
                    report.broad_cir,
                    report.broad_gmv,
                    report.broad_roi,
                    report.click,
                    report.cost,
                    report.cpc,
                    report.cr,
                    report.ctr,
                    report.direct_gmv,
                    report.impression,
                    report.avg_rank,
                    campaign.start_time,
                    new Date().toISOString(),
                    null,
                    fromWIB,
                    toWIB
                );
            }

            // Ekspor data ke CSV dan Excel
            // await this.exportToCSVAndExcel();

            return response;
        } catch (error) {
            console.error('Error processing product ads:', error);
        }
    };


    
    // Method to save product ad data into the database
    public saveToAdsProduct = async (
        title: string,
        broadCir: number,
        broadGmv: number,
        broadRoi: number,
        click: number,
        cost: number,
        cpc: number,
        cr: number,
        ctr: number,
        directGmv: number,
        impression: number,
        avgRank: number,
        start_time: number,
        created_at: string,
        updated_at: string | null,
        fromWIB: string,
        toWIB: string
    ): Promise<any> => {
        await db.iklan_report.create({
            title: title,
            broad_cir: broadCir,
            broad_gmv: broadGmv,
            broad_roi: broadRoi,
            click: click,
            cost: cost,
            cpc: cpc,
            cr: cr,
            ctr: ctr,
            direct_gmv: directGmv,
            impression: impression,
            avg_rank: avgRank,
            start_time: start_time,
            created_at: created_at,
            updated_at: updated_at,
            from_wib: fromWIB,
            to_wib: toWIB,
        });
    };


    // Method to export data to both CSV and Excel formats
    public exportToCSVAndExcel = async (): Promise<void> => {
        try {
            const data = await db.iklan_report.findAll();
            const jsonData = data.map((item: any) => item.toJSON());
    
            const fields = [
                'title',
                'broad_cir',
                'broad_gmv',
                'broad_roi',
                'click',
                'cost',
                'cpc',
                'cr',
                'ctr',
                'direct_gmv',
                'impression',
                'avg_rank',
                'start_time',
                'created_at',
                'updated_at',
                'fromWIB',
                'toWIB'
            ];
    
            const csv = parse(jsonData, { fields });
    
            const exportDir = 'D:\\Kerja\\sopi\\MesinTempur\\export';
    
            // Check if the export directory exists, create it if necessary
            if (!fs.existsSync(exportDir)) {
                fs.mkdirSync(exportDir, { recursive: true });
            }
    
            // Save CSV file
            const csvFilePath = path.join(exportDir, 'data.csv');
            fs.writeFileSync(csvFilePath, csv);
            console.info(`CSV file created at ${csvFilePath}`);
    
            // Convert JSON data to worksheet format
            const worksheet = XLSX.utils.json_to_sheet(jsonData);
    
            // Create a new workbook and append the worksheet
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
            // Save Excel file
            const excelFilePath = path.join(exportDir, 'data.xlsx');
            XLSX.writeFile(workbook, excelFilePath);
            console.info(`Excel file created at ${excelFilePath}`);
        } catch (error) {
            console.error('Error exporting data to CSV and Excel:', error);
        }
    };
}

export default ShopeeSellerScrapperServices;
