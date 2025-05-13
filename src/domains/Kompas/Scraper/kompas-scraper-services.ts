import 'dotenv/config';
import { toCamel, toSnake } from 'snake-camel';
import db from '../../../models';
import { Op } from 'sequelize';
import KompasRepository from './kompas-scraper-repository';
import { TSaveSpiderRaw } from '../../../types/news-scraper-types';
import BaseError from '../../../base_claseses/base-error';
import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI || "mongodb+srv://root:root@cluster0.mvppeep.mongodb.net/";
const client = new MongoClient(uri);

export const connectDB = async () => {
   if (!client?.db) {
      await client.connect();
   }
   return client.db("mesin_tempur"); 
};

class KompasScraperServices {
    private repository = new KompasRepository();
 
    public saveToNews = async (payload: TSaveSpiderRaw): Promise<void> => {
       const alreadySave: boolean = await this.isNewsAlreadySaved(payload.sourceUrl);
 
       if (!alreadySave) {
          await db.news.create({
             date_time: payload.datetime,
             media_name: payload.mediaName,
             source_url: payload.sourceUrl,
             title: payload.title,
             content: payload.content,
             platform: payload.platform,
          });
       } else{
          
       }
    };
 
    public isNewsAlreadySaved = async(sourceUrl: string) => {
       const newsData = await db.news.findAll({
          where: {
             source_url: {
                [Op.like]: `%${sourceUrl}`,
             },
          },
       });
 
       if (newsData.length) return true;
       return false;
    }
 
    public scrapeKompasNews = async(searchKey: string): Promise<void>=>{
       const response = await this.repository.getKompasNews(searchKey);
       const formattedResponse = { data: toSnake({ response }) as any };
     
       console.info(formattedResponse.data);
     
       try {
         const db = await connectDB();
         const collection = db.collection("kompas_news"); //sesuaikan db collection nya
   
         await collection.insertOne({
            createdAt: new Date(),
            articles: formattedResponse.data.response,  // Simpan seluruh data dalam array `articles`
         });
 
         console.log(`✅ berita berhasil disimpan ke MongoDB`);
       } catch (e: any) {
          console.error("❌ Gagal menyimpan berita Kompas:", e);
          throw new BaseError(500, 'INTERNAL_SERVER_ERROR', e.toString());
       }
 
    }

}
export default KompasScraperServices;