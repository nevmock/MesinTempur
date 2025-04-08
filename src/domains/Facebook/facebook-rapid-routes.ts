import BaseRoutes from '../../../base_claseses/base-routes';
import tryCatch from '../../../utils/tryCatcher';
import FacebookRapidController from './facebook-rapid-controller';

class FacebookRapidRoutes extends BaseRoutes {
    public routes(): void {
        this.router.get(
            '/getDataUser',
            tryCatch(FacebookRapidController.getDataUser),
        );

    }
}
export default new FacebookRapidRoutes().router;