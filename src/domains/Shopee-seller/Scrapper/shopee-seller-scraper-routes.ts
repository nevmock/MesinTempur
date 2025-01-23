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
    }
}

export default new ShopeeSellerScraperRoutes().router;
