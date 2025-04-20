import BaseRoutes from '../../../base_claseses/base-routes';
import tryCatch from '../../../utils/tryCatcher';
import newsScraperController from './news-scraper-controller';

class NewsScraperRoutes extends BaseRoutes {
   public routes(): void {
      this.router.get(
         '/google-news',
         tryCatch(newsScraperController.scrapeGoogleNews),
      );
      this.router.get(
         '/detik-news',
         tryCatch(newsScraperController.scrapeDetikNews),
      )
   }
}

export default new NewsScraperRoutes().router;
