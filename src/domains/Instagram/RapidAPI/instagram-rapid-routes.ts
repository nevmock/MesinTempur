import BaseRoutes from '../../../base_claseses/base-routes';
import tryCatch from '../../../utils/tryCatcher';
import InstagramRapidController from './instagram-rapid-controller';

class InstagramRapidRoutes extends BaseRoutes {
   public routes(): void {
      this.router.get(
         '/getDataUser',
         tryCatch(InstagramRapidController.getDataUser),
      );

      this.router.get(
         '/getDataPost',
         tryCatch(InstagramRapidController.getDataPost),
      );
   }

}

export default new InstagramRapidRoutes().router;