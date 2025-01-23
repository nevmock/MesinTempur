import { data } from "cheerio/dist/commonjs/api/attributes";
import ShopeeSellerScrapperServices from "./shopee-seller-scraper-services";
import { Request, response, Response } from 'express';
import db from "../../../models";

class ShopeeSellerController {
    private service = new ShopeeSellerScrapperServices();

    // Method to handle product ads scraping requests
    public productAdsScrape = async (
        req: Request,
        res: Response,
    ): Promise<Response> => {
        try {
            // Memanggil service untuk melakukan scraping iklan produk
            const entryList = await this.service.getProductAds(req.body.startDefault, req.body.endDefault); // Pastikan method getProductAds mengembalikan entryList
            
            // Set entryList ke dalam header
            // res.set('X-Entry-List', JSON.stringify(entryList));
    
            // Mengembalikan respons sukses
            console.info(entryList)
            return res.status(200).json({
                code: 200,
                status: 'OK',
                message: 'Product ads scraped successfully.',
                data: entryList
            });
        } catch (error) {
            console.error('Error in productAdsScrape:', error);
    
            // Mengembalikan respons error
            return res.status(500).json({
                code: 500,
                status: 'ERROR',
                message: 'Failed to scrape product ads.',
                error: error instanceof Error ? error.message : error,
            });
        }
    };
    


}

export default new ShopeeSellerController();
