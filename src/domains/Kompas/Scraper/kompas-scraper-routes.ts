import BaseRoutes from '../../../base_claseses/base-routes';
import tryCatch from '../../../utils/tryCatcher';
import kompasScraperController from './kompas-scraper-controller';

class KompasScraperRoutes extends BaseRoutes {
   public routes(): void {
      this.router.get(
         '/kompas',
         tryCatch(kompasScraperController.scrapeKompasNews),
      )
   }
}

export default new KompasScraperRoutes().router;