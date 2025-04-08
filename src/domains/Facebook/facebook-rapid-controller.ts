import { Request, Response } from 'express';
import FacebookRapidServices from './facebook-rapid-services';

class FacebookRapidController {
    private facebookRapidServices = new FacebookRapidServices();

    public getDataUser = async (
        req: Request,
        res: Response,
    ): Promise<Response> => {
        console.info(req.body.kategori);
        try {
            const result = await this.facebookRapidServices.getDataUser(
                req.body.kategori,
            );
            return res.status(200).json({
                code: 200,
                status: 'OK',
                data: result,
            });
        } catch (error) {
            return res.status(500).json({
                code: 500,
                status: 'ERROR',
                data: error,
            });
        }
    };
}

export default new FacebookRapidController();