import { Request, Response } from 'express';
import KompasScraperServices from './kompas-scraper-services';
import moment, { Moment } from 'moment';
import path from 'path';

class kompasScraperController {
    private failedUserPath: string = path.join(
       './failed_user/' + moment().format('YYYYMMDD') + '.json',
    );
 
    private kompasScraperServices = new KompasScraperServices()

 
    public scrapeKompasNews = async (
       req: Request,
       res: Response,
     ): Promise<Response> => {
       console.info(req.body.searchKey);
       await this.kompasScraperServices.scrapeKompasNews(req.body.searchKey);
       return res.status(200).json({
         code: 200,
         status: 'OK',
         data: {
           message: 'OK',
         },
       });
     }
 }
 
 export default new kompasScraperController();
 