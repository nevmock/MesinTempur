import ShopeeSellerScrapperServices from "./shopee-seller-scraper-services";
import { Request, response, Response } from 'express';

class ShopeeSellerController {
    private service = new ShopeeSellerScrapperServices();

    public productAdsScrape = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { startDefault, endDefault } = req.body;
            const entryList = await this.service.getProductAds(startDefault, endDefault);
            
            return res.status(200).json({
                code: 200,
                status: 'OK',
                message: 'Product ads scraped successfully.',
                data: entryList,
            });
        } catch (error) {
            console.error('Error in productAdsScrape:', error);
            return res.status(500).json({
                code: 500,
                status: 'ERROR',
                message: 'Failed to scrape product ads.',
                error: error instanceof Error ? error.message : error,
            });
        }
    };

    // Method to handle user profile scraping requests
    public userProfileScrape = async (req: Request, res: Response): Promise<Response> => {
        try {
            const userInfo = await this.service.getUserInfo();
            
            return res.status(200).json({
                code: 200,
                status: 'OK',
                message: 'User profile scraped successfully.',
                data: userInfo,
            });
        } catch (error) {
            console.error('Error in userProfileScrape:', error);
            return res.status(500).json({
                code: 500,
                status: 'ERROR',
                message: 'Failed to scrape user profile.',
                error: error instanceof Error ? error.message : error,
            });
        }
    };
    
    // Method to handle user profile scraping requests
    public productStockScrape = async (req: Request, res: Response): Promise<Response> => {
        try {
            const productStock = await this.service.getProductStock();
            
            return res.status(200).json({
                code: 200,
                status: 'OK',
                message: 'User profile scraped successfully.',
                data: productStock,
            });
        } catch (error) {
            console.error('Error in userProfileScrape:', error);
            return res.status(500).json({
                code: 500,
                status: 'ERROR',
                message: 'Failed to scrape user profile.',
                error: error instanceof Error ? error.message : error,
            });
        }
    };


}

export default new ShopeeSellerController();
