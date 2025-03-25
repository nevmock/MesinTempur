import express, { Application } from 'express';
import { connectDB } from './configs/shopee/mongodb-connection';
import errorHandler from './middlewares/error-handler-middleware.js';
import path from 'path';
import morgan from 'morgan';
import loggerUtils from './utils/logger.js';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import apicache from 'apicache';
import longjohn from 'longjohn';
import bodyParser from 'body-parser';
import instagramScraperRoutes from './domains/Instagram/Scraper/instagram-scraper-routes.js';
import newsScraperRoutes from './domains/news/Scraper/news-scraper-routes';
import { IncomingMessage, Server, ServerResponse } from 'node:http';
import shopeeSellerScraperRoutes from './domains/shopee-seller/Scrapper/shopee-seller-scraper-routes.js';
import instagramRapidRoutes from './domains/Instagram/RapidAPI/instagram-rapid-routes';
import tiktokRapidRoutes from './domains/TikTok/RapidAPI/tiktok-rapid-routes';

class OurApp {
   private app?: Application;
   public server?: Server<typeof IncomingMessage, typeof ServerResponse>;

   constructor(private port: string | number) {
      this.app = express();
      this.port = port;
      this.app.use(express.urlencoded({ extended: true }));
      this.app.use(bodyParser.json());


      this.configureAssets();
      this.setupMiddlewares([errorHandler, apicache.middleware('5 minutes')]);
      this.setupLibrary([
         process.env.NODE_ENV === 'development'
            ? morgan('dev')
            : morgan('production'),
         compression(),
         helmet(),
         cors(),
      ]);
      this.setupRoute();
   }

   private setupMiddlewares(middlewaresArr: any[]): void {
      middlewaresArr.forEach((middleware) => {
         this.app!.use(middleware);
      });
   }

   private setupRoute(): void {
      this.app!.use('/api/v1/instagram/scraper', instagramScraperRoutes);
      this.app!.use('/api/v1/instagram/rapid', instagramRapidRoutes);
      this.app!.use('/api/v1/tiktok/rapid', tiktokRapidRoutes);
      this.app!.use('/api/v1/news', newsScraperRoutes);
      this.app!.use('/api/v1/shopee-seller', shopeeSellerScraperRoutes);
   }


   private configureAssets() {
      this.app!.use(express.static(path.join(__dirname, '../public')));
   }

   private setupLibrary(libraries: any[]): void {
      libraries.forEach((library) => {
         this.app!.use(library);
      });
   }

   public start() {
      longjohn.async_trace_limit = 10;

      connectDB().then((v) => {
         console.info("Connected to MongoDB");
      }).catch((err) => {
         console.error('❌ Failed to connect to MongoDB:', err);
         process.exit(1);
      });

      return this.app?.listen(this.port, () => {
         loggerUtils.logger().info(`Application running on port ${this.port}`);
      });
   }
}



export default OurApp;
