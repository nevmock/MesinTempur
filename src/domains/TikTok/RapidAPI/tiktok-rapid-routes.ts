import BaseRoutes from '../../../base_claseses/base-routes';
import tryCatch from '../../../utils/tryCatcher';
import TikTokRapidController from './tiktok-rapid-controller';

class TikTokRapidRoutes extends BaseRoutes {
    public routes(): void {
        this.router.get(
            '/getDataUser',
            tryCatch(TikTokRapidController.getDataUser),
        );
    }
}

export default new TikTokRapidRoutes().router;