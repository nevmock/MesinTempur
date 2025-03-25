import { Request, Response } from 'express';
import InstagramRapidServices from './instagram-rapid-services';

class InstagramRapidController {

   private instagramRapidServices = new InstagramRapidServices()

   public getDataUser = async (
      req: Request,
      res: Response,
   ): Promise<Response> => {
      console.info(req.body.kategori)
      try {
         const result = await this.instagramRapidServices.getDataUser(
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

   public getDataPost = async (
      req: Request,
      res: Response,
   ): Promise<Response> => {
      console.info(req.body.kategori)
      try {
         const result = await this.instagramRapidServices.getDataPost(
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

   public getUserAndPostData = async (
      req: Request,
      res: Response,
   ): Promise<Response> => {
      console.info(req.body.kategori)
      try {
         const result = await this.instagramRapidServices.getUserAndPostData(
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

export default new InstagramRapidController();
