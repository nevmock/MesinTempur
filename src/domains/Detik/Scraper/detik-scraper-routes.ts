import BaseRoutes from '../../../base_claseses/base-routes';
import tryCatch from '../../../utils/tryCatcher';
import detikScraperController from './detik-scraper-controller';

class DetikScraperRoutes extends BaseRoutes {
   public routes(): void {
      this.router.get(
         '/detik',
         tryCatch(detikScraperController.scrapeDetikNews),
      )
   }
}

export default new DetikScraperRoutes().router;