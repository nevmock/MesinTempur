import { Request, Response } from 'express';
import NewsScraperServices from './news-scraper-services';
import moment, { Moment } from 'moment';
import delay from '../../../utils/delay';
import { createObjectCsvWriter } from 'csv-writer';
import logger from '../../../utils/logger';
import path from 'path';
import { Sequelize, QueryTypes } from 'sequelize';
import fs from 'fs';

class NewsScraperController {
   private failedUserPath: string = path.join(
      './failed_user/' + moment().format('YYYYMMDD') + '.json',
   );

   private newsScraperServices = new NewsScraperServices()

   public scrapeGoogleNews = async (
      req: Request,
      res: Response,
   ): Promise<Response> => {
      console.info(req.body.searchKey)
      await this.newsScraperServices.scrapeGoogleNews_v2(req.body.searchKey)
      return res.status(200).json({
         code: 200,
         status: 'OK',
         data: {
            message: 'OK',
         },
      });
   }
}

export default new NewsScraperController();
