import BaseRoutes from "../../base_claseses/base-routes";
import tryCatch from "../../../utils/tryCatcher";
import YoutubeRapidController from "./youtube-rapid-controller";

class YoutubeRapidRoutes extends BaseRoutes {
    public routes(): void {
        this.router.get(
            '/getDataUser',
            tryCatch(YoutubeRapidController.getDataUser),
        );
    }
}

export default new YoutubeRapidRoutes().router;