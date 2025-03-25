import BaseRoutes from '../../../base_claseses/base-routes';
import tryCatch from '../../../utils/tryCatcher';
import TikTokRapidController from './tiktok-rapid-controller';

class TikTokRapidRoutes extends BaseRoutes {
    public routes(): void {
        this.router.get(
            '/getDataUser',
            tryCatch(TikTokRapidController.getDataUser),
        );

        this.router.get(
            '/getDataPost',
            tryCatch(TikTokRapidController.getDataPost),
        );

        this.router.get(
            '/getUserAndPostData',
            tryCatch(TikTokRapidController.getUserAndPostData),
        );
    }
    
}

export default new TikTokRapidRoutes().router;