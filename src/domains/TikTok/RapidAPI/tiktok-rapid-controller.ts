import { Request, Response } from 'express';
import TikTokRapidServices from './tiktok-rapid-services';

class TikTokRapidController {

    private tiktokRapidServices = new TikTokRapidServices()

    public getDataUser = async (
        req: Request,
        res: Response,
    ): Promise<Response> => {
        console.info(req.body.kategori)
        try {
            const result = await this.tiktokRapidServices.getDataUser(
                req.body.kategori
            )
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
    }
}

export default new TikTokRapidController();
