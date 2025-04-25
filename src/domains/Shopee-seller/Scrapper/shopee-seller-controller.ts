import ShopeeSellerScrapperServices from "./shopee-seller-scraper-services";
import { Request, Response } from 'express';

class ShopeeSellerController {
    private service = new ShopeeSellerScrapperServices();

    // Scrape iklan produk
    public productAdsScrape = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { startDefault, endDefault } = req.body;
            const entryList = await this.service.getProductAds(startDefault, endDefault);
            
            return res.status(200).json({
                code: 200,
                status: 'OK',
                message: 'Berhasil mengambil data iklan produk.',
                data: entryList,
            });
        } catch (error) {
            console.error('Terjadi kesalahan saat mengambil iklan produk:', error);
            return res.status(500).json({
                code: 500,
                status: 'ERROR',
                message: 'Gagal mengambil data iklan produk.',
                error: error instanceof Error ? error.message : error,
            });
        }
    };

    // Scrape profil pengguna
    public userProfileScrape = async (req: Request, res: Response): Promise<Response> => {
        try {
            const userInfo = await this.service.getUserInfo();
            
            return res.status(200).json({
                code: 200,
                status: 'OK',
                message: 'Berhasil mengambil data profil pengguna.',
                data: userInfo,
            });
        } catch (error) {
            console.error('Terjadi kesalahan saat mengambil profil pengguna:', error);
            return res.status(500).json({
                code: 500,
                status: 'ERROR',
                message: 'Gagal mengambil data profil pengguna.',
                error: error instanceof Error ? error.message : error,
            });
        }
    };
    
    // Scrape stok produk
    public productStockScrape = async (req: Request, res: Response): Promise<Response> => {
        try {
            const productStock = await this.service.getProductStock();
            
            return res.status(200).json({
                code: 200,
                status: 'OK',
                message: 'Berhasil mengambil data stok produk.',
                data: productStock,
            });
        } catch (error) {
            console.error('Terjadi kesalahan saat mengambil stok produk:', error);
            return res.status(500).json({
                code: 500,
                status: 'ERROR',
                message: 'Gagal mengambil data stok produk.',
                error: error instanceof Error ? error.message : error,
            });
        }
    };

    // Scrape keyword produk
    public productKeyScrape = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { startDefault, endDefault, campaignId } = req.body;
            console.log("campaign id", campaignId)
            const productKey = await this.service.getProductKey(startDefault, endDefault, campaignId);
            
            return res.status(200).json({
                code: 200,
                status: 'OK',
                message: 'Berhasil mengambil data keyword produk.',
                data: productKey,
            });
        } catch (error) {
            console.error('Terjadi kesalahan saat mengambil stok produk:', error);
            return res.status(500).json({
                code: 500,
                status: 'ERROR',
                message: 'Gagal mengambil data stok produk.',
                error: error instanceof Error ? error.message : error,
            });
        }
    };

    public productPerformance = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { startDefault, endDefault } = req.body;
            const productPerformance = await this.service.getProductPerformance(startDefault, endDefault);
            
            return res.status(200).json({
                code: 200,
                status: 'OK',
                message: 'Berhasil mengambil data performa produk.',
                data: productPerformance,
            });
        } catch (error) {
            console.error('Terjadi kesalahan saat mengambil iklan produk:', error);
            return res.status(500).json({
                code: 500,
                status: 'ERROR',
                message: 'Gagal mengambil data iklan produk.',
                error: error instanceof Error ? error.message : error,
            });
        }
    };
}

export default new ShopeeSellerController();
