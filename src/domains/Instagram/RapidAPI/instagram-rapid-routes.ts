import BaseRoutes from '../../../base_claseses/base-routes';
import tryCatch from '../../../utils/tryCatcher';
import InstagramRapidController from './instagram-rapid-controller';

class InstagramRapidRoutes extends BaseRoutes {
   public routes(): void {
      this.router.get(
         '/scrape',
         tryCatch(InstagramRapidController.dailyScrape),
      );

      this.router.get(
         '/comments-to-csv',
         tryCatch(InstagramRapidController.commentsToCsv),
      );

      this.router.get(
         '/scrape-failed-user',
         tryCatch(InstagramRapidController.dailyScrape),
      );

      this.router.get(
         '/research',
         tryCatch(InstagramRapidController.research),
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

export default new InstagramRapidRoutes().router;