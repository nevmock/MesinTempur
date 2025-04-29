import { Request, Response } from 'express';
import DetikScraperServices from './detik-scraper-services';
import moment, { Moment } from 'moment';
import path from 'path';

class detikScraperController {
    private failedUserPath: string = path.join(
       './failed_user/' + moment().format('YYYYMMDD') + '.json',
    );
 
    private detikScraperServices = new DetikScraperServices()

 
    public scrapeDetikNews = async (
       req: Request,
       res: Response,
     ): Promise<Response> => {
       console.info(req.body.searchKey);
       await this.detikScraperServices.scrapeDetikNews(req.body.searchKey);
       return res.status(200).json({
         code: 200,
         status: 'OK',
         data: {
           message: 'OK',
         },
       });
     }
 }
 
 export default new detikScraperController();
 