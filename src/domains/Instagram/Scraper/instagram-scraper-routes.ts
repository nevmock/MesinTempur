import BaseRoutes from '../../../base_claseses/base-routes';
import tryCatch from '../../../utils/tryCatcher';
import instagramScraperController from './instagram-scraper-controller';

class InstagramScraperRoutes extends BaseRoutes {
   public routes(): void {
      this.router.get(
         '/scrape',
         tryCatch(instagramScraperController.dailyScrape),
      );

      this.router.get(
         '/comments-to-csv',
         tryCatch(instagramScraperController.commentsToCsv),
      );

      this.router.get(
         '/scrape-failed-user',
         tryCatch(instagramScraperController.dailyScrape),
      );

      this.router.get(
         '/research',
         tryCatch(instagramScraperController.research),
      );
      // this.router.get(
      //    '/url-type',
      //    tryCatch(instagramScraperController.urlType),
      // );
      // this.router.get(
      //    '/url-type-by-url',
      //    tryCatch(instagramScraperController.urlTypeByUrl),
      // );
   }
}

export default new InstagramScraperRoutes().router;