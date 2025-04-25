import BaseRoutes from '../../../base_claseses/base-routes';
import tryCatch from '../../../utils/tryCatcher';
import shopeeSellerController from './shopee-seller-controller';

class ShopeeSellerScraperRoutes extends BaseRoutes {
    public routes(): void {
        // Route untuk scraping iklan produk
        this.router.get(
            '/product-ads',
            tryCatch(shopeeSellerController.productAdsScrape),
        );

        // Route untuk scraping profil pengguna
        this.router.get(
            '/user-profile',
            tryCatch(shopeeSellerController.userProfileScrape),
        );

        // Route untuk scraping product stock
        this.router.get(
            '/product-stock',
            tryCatch(shopeeSellerController.productStockScrape),
        );

        // Route untuk scraping product stock
        this.router.get(
            '/product-keyword',
            tryCatch(shopeeSellerController.productKeyScrape),
        );

        this.router.get(
            '/product-performance',
            tryCatch(shopeeSellerController.productPerformance),
        );
    }
}

export default new ShopeeSellerScraperRoutes().router;
