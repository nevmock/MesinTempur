import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import jsonfile from 'jsonfile';
import 'dotenv/config';
import { toCamel, toSnake } from 'snake-camel';
import loggerUtils from '../../../utils/logger';
import accounts from '../../../configs/instagram/instagram-bot-account';
import path from 'path';
import fs from 'fs';
import Taccount from '../../../interfaces/instagram-account-interface';
import logger from '../../../utils/logger';
import db from '../../../models';
import { Op } from 'sequelize';
import delay from '../../../utils/delay';
import moment, { Moment } from 'moment';
import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha';
import errorCapture from '../../../utils/errorCapture';
import NewsRepository from './news-repository';
import BotEngine from '../../../bot-engine';
import OurApp from '../../../app';
import { TSaveSpiderRaw } from '../../../types/news-scraper-types';
import BaseError from '../../../base_claseses/base-error';
import { format } from 'winston';

class NewsScraperServices {
   private repository = new NewsRepository();

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

   public scrapeGoogleNews_v2 = async(searchKey: string): Promise<void> => {
      const response = await this.repository.getGoogleNews(searchKey)
      // const dateCriteria = moment().subtract(1, 'days');

      const formattedResponse = { data: toSnake({ response }) as any };
      console.info(formattedResponse.data)
      try {
         await this.saveBulkToNews(formattedResponse.data.response)
      } catch (e: any) {
         throw new BaseError(500, 'INTERNAL_SERVER_ERROR', e.toString())
      }
      //
      // for (const news of response) {
      //    try {
      //       await this.saveToNews(news)
      //    } catch (e: any) {
      //       console.error(e)
      //       throw new BaseError(500, 'INTERNAL_SERVER_ERROR', e.toString())
      //    }
      //    // if (news.datetime.year() === dateCriteria.year() && news.datetime.month() === dateCriteria.month() && news.datetime.day() === dateCriteria.day()) {
      //    //    await this.saveToNews(news)
      //    // }
      // }
   }

   public saveBulkToNews = async (data: any): Promise<void> => {
      await db.news.bulkCreate(data, {
         updateOnDuplicate: ["title"],
      });
   }

   public scrapeGoogleNews_v1 = async(searchKey: string): Promise<void> => {
      // const response = await this.repository.getGoogleNews(searchKey)
      // const eg = {
      //    data: ["gsrres", [
      //       [
      //          [null, [null, null, [
      //             [13, [13, "CBMi5wFBVV95cUxNbS1ral9fSU5udkZnWnJnTC12WHdqb2pZdmw2TThzbFkzY2ZOTXBjdElOWDRudHpqV0NxaHR6RVItX21ydzdpZXRpelUyWUJXc2RIMEQxRzdhYjlWbHlEQWFkVy0zeW1hdEh3T2JmVjRFV3pQMHFhUE1aVmVIc2YxU21FOG9laWJNWnZlQ0t2LTVud1B2Vm5hOEhWeTdEeU1oNE05QWF5ZC1YSFc3UlJvem5SNmFXdW13SC1WTHlkOTVXZElLQlNnSTRld2xOZngzYmpOaDlJT3JueXhoUjU1WFI1YW9BTWc"], "Putusan MK Buka Jalan bagi Anies Baswedan dan PDIP Maju di Pilgub Jakarta, Apa Saja yang Berubah?", null, [1724132282], null, "https://www.tribunnews.com/mata-lokal-memilih/2024/08/20/putusan-mk-buka-jalan-bagi-anies-baswedan-dan-pdip-maju-di-pilgub-jakarta-apa-saja-yang-berubah", null, [
      //                ["/attachments/CC8iL0NnNVhWV2RzWm5GRE5rdGpXREJUVFJDb0FSaXNBaWdCTWdrQlFwajFKS2lLU1FJ", null, 140, 140, null, "CC8iL0NnNVhWV2RzWm5GRE5rdGpXREJUVFJDb0FSaXNBaWdCTWdrQlFwajFKS2lLU1FJ", null, null, null, null, null, null, null, "https://asset-2.tstatic.net/tribunnews/foto/bank/images/ketua-umum-pkb-muhaimin-iskandar-atau-cak-imin-meminta-anies-bersabar.jpg"]
      //             ], null, [12, [12, "PublisherOfCBMi5wFBVV95cUxNbS1ral9fSU5udkZnWnJnTC12WHdqb2pZdmw2TThzbFkzY2ZOTXBjdElOWDRudHpqV0NxaHR6RVItX21ydzdpZXRpelUyWUJXc2RIMEQxRzdhYjlWbHlEQWFkVy0zeW1hdEh3T2JmVjRFV3pQMHFhUE1aVmVIc2YxU21FOG9laWJNWnZlQ0t2LTVud1B2Vm5hOEhWeTdEeU1oNE05QWF5ZC1YSFc3UlJvem5SNmFXdW13SC1WTHlkOTVXZElLQlNnSTRld2xOZngzYmpOaDlJT3JueXhoUjU1WFI1YW9BTWc"], "Tribunnews.com", ["https://encrypted-tbn2.gstatic.com/faviconV2?url\u003dhttps://www.tribunnews.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", null, 180, 180, null, "https://encrypted-tbn2.gstatic.com/faviconV2?url\u003dhttps://www.tribunnews.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", "https://encrypted-tbn2.gstatic.com/faviconV2?url\u003dhttps://www.tribunnews.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL"], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, ["https://lh3.googleusercontent.com/n1Vbok3amFFm8ua8kGtUd8MACWtCvNG5sB44TNYe0-OI9qv86YXUF6R7GhQOwpYLSs8m54hIh3k", null, 1559, 398, null, "CAUqBwgKMOaOjgswtNu6gjhqCWltYWdlL3BuZw"],
      //                ["https://lh3.googleusercontent.com/1hi1cV8mmz1jdHUMUfNH7OmaUgh2eyIFhoia0zL4pyrGI8FEIs9zrZW_Y9wWUvjHk2SR6LJ08A", null, 778, 215, null, "CAUqBwgKMOaOjgswz4iQvDlqCWltYWdlL3BuZw"]
      //             ], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, [null, [
      //                ["Buka Tribunnews.com", "publications/CAAqBwgKMOaOjgswxOWgAw", [null, null, null, null, null, "link"], 0]
      //             ]], null, "https://www.tribunnews.com/mata-lokal-memilih/2024/08/20/putusan-mk-buka-jalan-bagi-anies-baswedan-dan-pdip-maju-di-pilgub-jakarta-apa-saja-yang-berubah", null, null, null, [
      //                [null, null, null, null, "NEWS_STORYLINE_RESULT_GROUP", 0, 141, null, null, null, 37, null, [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "13252145253351867786", "14207091697990846553", "https://asset-2.tstatic.net/tribunnews/foto/bank/images/ketua-umum-pkb-muhaimin-iskandar-atau-cak-imin-meminta-anies-bersabar.jpg"],
      //                   [], null, 1, null, null, null, null, null, [null, 3],
      //                   [
      //                      [1724132282],
      //                      [1724385066, 263988000]
      //                   ], null, null, null, "EAMowJ+suNCJiANAAVIUCgJJRBAHEAEQCyoICAEQeBh4IABY8P2QtgY\u003d", "CHg\u003d"
      //                ]
      //             ], null, 1, null, null, null, null, null, 0],
      //             [13, [13, "CBMirgFBVV95cUxOU0RUR1B0TXlmeS1KcThLaTJDejBmVUFRa0FLSFN0aUZHa1gxUTA1SVQ1Q1pheHNuQXpqelluY0h1ZzlNQzFZcWRqVUhBRlNPeU5MYU93T25MZG00MkZIUXNXNHpKSUtpTzZJSTVuUDFidVpvdXBiNFk2Y1NJeDFncTRVNFBCNHZUYndWZ3pWaFBtcGZwUEtBZEE0YmtySTk3Yll3VWFWUmZaY1lNcHc"], "Anies Masuk Radar Megawati di Pilgub Jakarta", null, [1724369122], null, "https://www.cnnindonesia.com/nasional/20240823061152-617-1136487/anies-masuk-radar-megawati-di-pilgub-jakarta", null, [
      //                ["/attachments/CC8iL0NnNUJNM0UxVHpoUWQwSTJOVjlJVFJDb0FSaXNBaWdCTWdrQlFJYnRLS2ZRRXdF", null, 140, 140, null, "CC8iL0NnNUJNM0UxVHpoUWQwSTJOVjlJVFJDb0FSaXNBaWdCTWdrQlFJYnRLS2ZRRXdF", null, null, null, null, null, null, null, "https://akcdn.detik.net.id/visual/2024/08/04/anies-baswedan-sapa-warga-di-cfd-11_169.jpeg?w\u003d400\u0026q\u003d90"]
      //             ], null, [12, [12, "PublisherOfCBMirgFBVV95cUxOU0RUR1B0TXlmeS1KcThLaTJDejBmVUFRa0FLSFN0aUZHa1gxUTA1SVQ1Q1pheHNuQXpqelluY0h1ZzlNQzFZcWRqVUhBRlNPeU5MYU93T25MZG00MkZIUXNXNHpKSUtpTzZJSTVuUDFidVpvdXBiNFk2Y1NJeDFncTRVNFBCNHZUYndWZ3pWaFBtcGZwUEtBZEE0YmtySTk3Yll3VWFWUmZaY1lNcHc"], "CNN Indonesia", ["https://encrypted-tbn0.gstatic.com/faviconV2?url\u003dhttps://www.cnnindonesia.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", null, 180, 180, null, "https://encrypted-tbn0.gstatic.com/faviconV2?url\u003dhttps://www.cnnindonesia.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", "https://encrypted-tbn0.gstatic.com/faviconV2?url\u003dhttps://www.cnnindonesia.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL"], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, ["https://lh3.googleusercontent.com/DbWi4x_SM23I68nZ2yfSIXFftHHg_KnryenkDv6hgvF-KNWkdX1af6wbj9E6OWVTQCVkkfc7Wz8", null, 400, 67, null, "CAUqFAgKIhDdJrHU60vohmOkoTIkFQqvMO7FhYUuaglpbWFnZS9wbmc"],
      //                ["https://lh3.googleusercontent.com/7IfCvu5vLIx9Go0N2AG9E8ectOZFOFJAHhoPHwzn8GJZQSta2aZhxYVmNzpcHF4oreagPV0W1lA", null, 400, 67, null, "CAUqFAgKIhDdJrHU60vohmOkoTIkFQqvMNSF4oQuaglpbWFnZS9wbmc"]
      //             ], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, [null, [
      //                ["Buka CNN Indonesia", "publications/CAAiEN0msdTrS-iGY6ShMiQVCq8qFAgKIhDdJrHU60vohmOkoTIkFQqv", [null, null, null, null, null, "link"], 0]
      //             ]], null, "https://www.cnnindonesia.com/nasional/20240823061152-617-1136487/anies-masuk-radar-megawati-di-pilgub-jakarta", null, null, null, [
      //                [null, null, null, null, "NEWS_STORYLINE_RESULT_GROUP", 0, 141, null, null, null, 37, null, [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "8461262096889974435", "12540256408747735555", "https://akcdn.detik.net.id/visual/2024/08/04/anies-baswedan-sapa-warga-di-cfd-11_169.jpeg?w\u003d400\u0026q\u003d90"],
      //                   [], null, 1, null, null, null, null, null, [-1, 3],
      //                   [
      //                      [1724369122],
      //                      [1724385066, 264145000]
      //                   ], null, null, null, "CP///////////wEQAyjAkYHfl4qIA0ABUhQKAklEEAcQARALKggIARBoGGggAFjw5qC2Bg\u003d\u003d", "CGg\u003d"
      //                ]
      //             ], null, 1, null, null, null, null, null, 1],
      //             [13, [13, "CBMivwFBVV95cUxPQkM4dGM5bEVfT041TmFXdzNMNmZLRXdyVVZCakRjUEdWd2pFWkZzN0laRFRmZjZ4Rk1kQ1F2ZjF1QWlfamVoV2EzdW1VazM0clFZQlloM20zWFpGM2s1c0FyY2hyZnNtdWdYQ3dMYjRpSU1GZEJRQmJuS2lXYkdNUHBwNXZnNFg4U0Q2S1FPSVUyWnZUalVSc3UyLUJCcDNGaFdORjhEYmpBeWtvS3FnQ1p0a2s3dDdlWDRNVVRoa9IBvgFBVV95cUxPWkpmajk1aEJSLVNyMWIydWFJLWZJal9tTUNmV3cxR1BTZjFJMmgxSWlSOEYxN0w3UHJobmV4cXNsSGliaFRwcDh6MVFNdkxYNWU5S3pJUWNHdW12a1lTRXB5Szg5OEhVcXplUHZZVTZhZjFLMlZYQUtXMjVHdG1kbzVneVkxSF9DR1ZoTEM3UlQtWXNKT1FoYzBqbEtsbDVmNEl1RWZoZFJIamZJdWZHVXl3YzVhckFLR2dNREFn"], "Hasil Rapat Baleg DPR dan Kemungkinan Pupusnya Peluang Anies Maju di Pilgub Jakarta", null, [1724255668], null, "https://nasional.tempo.co/read/1906820/hasil-rapat-baleg-dpr-dan-kemungkinan-pupusnya-peluang-anies-maju-di-pilgub-jakarta", "https://nasional.tempo.co/read/1906820/hasil-rapat-baleg-dpr-dan-kemungkinan-pupusnya-peluang-anies-maju-di-pilgub-jakarta", [
      //                ["/attachments/CC8iK0NnNWZURmRGVjA5NkxYVmFZM05vVFJDb0FSaXNBaWdCTWdZRmNKSnZKUWc", null, null, null, null, "CC8iK0NnNWZURmRGVjA5NkxYVmFZM05vVFJDb0FSaXNBaWdCTWdZRmNKSnZKUWc", null, null, null, null, null, null, null, "https://statik.tempo.co/data/2024/08/04/id_1324693/1324693_720.jpg"]
      //             ], null, [12, [12, "PublisherOfCBMivwFBVV95cUxPQkM4dGM5bEVfT041TmFXdzNMNmZLRXdyVVZCakRjUEdWd2pFWkZzN0laRFRmZjZ4Rk1kQ1F2ZjF1QWlfamVoV2EzdW1VazM0clFZQlloM20zWFpGM2s1c0FyY2hyZnNtdWdYQ3dMYjRpSU1GZEJRQmJuS2lXYkdNUHBwNXZnNFg4U0Q2S1FPSVUyWnZUalVSc3UyLUJCcDNGaFdORjhEYmpBeWtvS3FnQ1p0a2s3dDdlWDRNVVRoa9IBvgFBVV95cUxPWkpmajk1aEJSLVNyMWIydWFJLWZJal9tTUNmV3cxR1BTZjFJMmgxSWlSOEYxN0w3UHJobmV4cXNsSGliaFRwcDh6MVFNdkxYNWU5S3pJUWNHdW12a1lTRXB5Szg5OEhVcXplUHZZVTZhZjFLMlZYQUtXMjVHdG1kbzVneVkxSF9DR1ZoTEM3UlQtWXNKT1FoYzBqbEtsbDVmNEl1RWZoZFJIamZJdWZHVXl3YzVhckFLR2dNREFn"], "Nasional Tempo", ["https://encrypted-tbn0.gstatic.com/faviconV2?url\u003dhttps://nasional.tempo.co\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", null, 180, 180, null, "https://encrypted-tbn0.gstatic.com/faviconV2?url\u003dhttps://nasional.tempo.co\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", "https://encrypted-tbn0.gstatic.com/faviconV2?url\u003dhttps://nasional.tempo.co\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL"], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, ["https://lh3.googleusercontent.com/iFXmYY8anjUOJs0qMqZvfecWU0wooGCfI_jxYhx5R1XPd9vi8WrMYstVM3Kab3VmoZpHrfJNNg", null, 200, 108, null, "CAUqBwgKMJmSnAsw9bGX1i5qCWltYWdlL3BuZw"],
      //                ["https://lh3.googleusercontent.com/bW0iOXb63kZr6by_c0luWUJneNJWu1rqbtg92prJdxvOwrqLhc10ij5W0DwTBJJWHPXRaZx0og", null, 200, 108, null, "CAUqBwgKMJmSnAswgrKJ1i5qCWltYWdlL3BuZw"]
      //             ], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, [null, [
      //                ["Buka Nasional Tempo", "publications/CAAqBwgKMJmSnAswrZy0Aw", [null, null, null, null, null, "link"], 0]
      //             ]], null, "https://nasional.tempo.co/read/1906820/hasil-rapat-baleg-dpr-dan-kemungkinan-pupusnya-peluang-anies-maju-di-pilgub-jakarta", null, "https://nasional.tempo.co/amp/1906820/hasil-rapat-baleg-dpr-dan-kemungkinan-pupusnya-peluang-anies-maju-di-pilgub-jakarta", null, [
      //                [null, null, null, null, "NEWS_STORYLINE_RESULT_GROUP", 0, 141, null, null, null, 37, null, [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "3725227495501989502", "10933049861469419004", "https://statik.tempo.co/data/2024/08/04/id_1324693/1324693_720.jpg"],
      //                   [], null, 1, null, null, null, null, null, [null, 3],
      //                   [
      //                      [1724255668],
      //                      [1724385066, 264212000]
      //                   ], null, null, null, "EAMowOykp4KKiANAAVIUCgJJRBAHEAEQCyoICAEQchhyIABY8KCWtgY\u003d", "CHI\u003d"
      //                ]
      //             ], null, 1, null, null, null, null, null, 2]
      //          ],
      //             [null, "stories/CAAqNggKIjBDQklTSGpvSmMzUnZjbmt0TXpZd1NoRUtEd2p0NDk2VURCR2pqcG9rREhGc2RTZ0FQAQ", null, 0, null, null, null, null, null, null, [
      //                [null, null, null, null, null, null, null, null, null, null, null, null, [null, "CAAqNggKIjBDQklTSGpvSmMzUnZjbmt0TXpZd1NoRUtEd2p0NDk2VURCR2pqcG9rREhGc2RTZ0FQAQ", null, null, null, null, null, null, null, null, null, 2]]
      //             ]], null, [null, null, null, null, "NEWS_STORYLINE_RESULT_GROUP", null, 141, null, null, null, 37], 0
      //          ]],
      //          [
      //             [13, [13, "xxx"], "PDIP Terancam Gagal Usung Calon di Pilgub Jakarta 2024", null, [1724231269], null, "https://www.viva.co.id/berita/politik/1744436-pdip-terancam-gagal-usung-calon-di-pilgub-jakarta-2024", "https://www.viva.co.id/berita/politik/1744436-pdip-terancam-gagal-usung-calon-di-pilgub-jakarta-2024", [
      //                ["/attachments/CC8iL0NnNXBlRXR5TmxOWGVuSkpMVzk0VFJDb0FSaXNBaWdCTWdrQkVJaWp0T1JMYXdJ", null, null, null, null, "CC8iL0NnNXBlRXR5TmxOWGVuSkpMVzk0VFJDb0FSaXNBaWdCTWdrQkVJaWp0T1JMYXdJ", null, null, null, null, null, null, null, "https://thumb.viva.co.id/media/frontend/thumbs3/2023/06/24/6496a81fc319e-peringatan-bulan-bung-karno-2023_1265_711.jpg"]
      //             ], null, [12, [12, "PublisherOfCBMiogFBVV95cUxQVkxHWWUxdEw5dnR5bnJMWG1rbEktSGNPTllVRXcwOHdnT0NaVVBkcU1PWWsxQVE5WVRNVmNnNTR4VEhkT1dOTGNzSkVUSEZlZU85bjNuNjFJZ1l6RkhtVkt0ajQtN2Nxc2hiNV93VGhRTjFNdGNVMTdaVzFpVkxlWWU2czd2Z3NZQXh0WWVKajNLYVVBQUlxY1JHazhYTmpWUGfSAacBQVVfeXFMUDQ1ekk0bWVSc2F0eUh4T1lZMU1malE4UjVidHR3OVNzN1libFIyVEV3VnFLX1NDdElubk8yRTZLS1JvRkEwVUt5UVBnSWRVNWhPQnlXanZscWI4VkFrT00tM25zbjNOOTN0NkhFT2wtSnVORjdzQ2JvQUNlaFRRRUZWZ1VGMFhQRmswTi1XWkQ0ekgwZ1FLVVdIUjhJNXpzcUJ5WGJfdTA"], "VIVA.co.id", ["https://encrypted-tbn0.gstatic.com/faviconV2?url\u003dhttps://www.viva.co.id\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", null, 180, 180, null, "https://encrypted-tbn0.gstatic.com/faviconV2?url\u003dhttps://www.viva.co.id\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", "https://encrypted-tbn0.gstatic.com/faviconV2?url\u003dhttps://www.viva.co.id\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL"], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, ["https://lh3.googleusercontent.com/dP4sBeI6oLYpaN0zeIR1fYJZG7eEXSc5ZNd7SO9zLgSA27tJM2E_YFsd1g2yJ7mOd9cPDvOAEg", null, 1229, 400, null, "CAUqBwgKMPml3Qow-LLziSxqCWltYWdlL3BuZw"],
      //                ["https://lh3.googleusercontent.com/ZYCiM79hTdePzS4O5oj_wiiOryaaqJVr56BygSsbYukWQk42wYCmVZ1n-RPGDX4WvBs0rPzI8Q", null, 1229, 400, null, "CAUqBwgKMPml3Qow9KP1iSxqCWltYWdlL3BuZw"]
      //             ], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, [null, [
      //                ["Buka VIVA.co.id", "publications/CAAqBwgKMPml3QowmIfRAQ", [null, null, null, null, null, "link"], 0]
      //             ]], null, "https://www.viva.co.id/berita/politik/1744436-pdip-terancam-gagal-usung-calon-di-pilgub-jakarta-2024", null, "https://www.viva.co.id/amp/berita/politik/1744436-pdip-terancam-gagal-usung-calon-di-pilgub-jakarta-2024", null, [
      //                [null, null, null, null, "", null, 141, null, null, null, 37, null, [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "11247670840504363203", "10352846618833392267", "https://thumb.viva.co.id/media/frontend/thumbs3/2023/06/24/6496a81fc319e-peringatan-bulan-bung-karno-2023_1265_711.jpg"], null, null, 1, null, null, null, null, null, [null, 3],
      //                   [
      //                      [1724231269],
      //                      [1724385066, 264332000]
      //                   ], null, null, null, "EAMogI+vo4OHiANAAVIUCgJJRBAHEAEQCyoICAEQWxhbIABY8KCWtgY\u003d", "CFs\u003d"
      //                ]
      //             ], null, 1, null, null, [null, null, null, null, null, null, null, null, null, null, null, null, 1], null, 1, 0], null, null, null, null, null, null, 1
      //          ],
      //          [null, [null, null, [
      //             [13, [13, "CBMizAFBVV95cUxNR19mOVAydU00VENDeUluUmpsN2hndmd5UVplNlhqMktKQzI4NDcyMWtYOFhMaVRiM2NZVmZRTzhYWVlEMW1sSkZLeENLNDBPNTQxQ09zZEpVM3lKbWdnUXp2NnlCMFFNT2FJN2RIcFlFUFBObURFdlRwZzZKWFYtai0zVmh0RU5TQ2RoTDV3bWdHa1J0M0RudTY2Tm5JbG13enhNcnRwSTFlZ05tWEdlNkpwRFY4MXk5SHJGWDBQYjZjMEZYNV9Hbm5KM0bSAdIBQVVfeXFMUHRRaUk5MVE5WGV1b0VwSUFIMmpMQlFuZEhobXM3RXBCYWh3bFlOcWQ4R2xTVEwzQ0RSZWRiOTZadFp1eWF1bjFSRXVLYWlVWi1LaDZ2cXhTQzZRNXIyTHVTQ3hOU3BKRkpKNjlkQm5fa2VQeTg4dmZXSnRzS2xFUUZONXV2cVNTbnZhSXZRWnpmVmlkWnIzcU9yYUU2YWdncUVMWW5rOW55VVlua1NtSmw4QnRBdEwtWDBUZHM5bHpMYXRJQlpkd1FzTktqc1dUcjV3"], "Kaesang Sudah Urus SK Belum Pernah Dipidana untuk Maju Pilgub Jateng", null, [1724382306], null, "https://www.cnnindonesia.com/nasional/20240823095310-12-1136540/kaesang-sudah-urus-sk-belum-pernah-dipidana-untuk-maju-pilgub-jateng", "https://www.cnnindonesia.com/nasional/20240823095310-12-1136540/kaesang-sudah-urus-sk-belum-pernah-dipidana-untuk-maju-pilgub-jateng", [
      //                ["/attachments/CC8iK0NnNDJNbnBEY0MxalRraFVZbE00VFJDb0FSaXJBaWdCTWdhWlpvSUxLZ2M", null, null, null, null, "CC8iK0NnNDJNbnBEY0MxalRraFVZbE00VFJDb0FSaXJBaWdCTWdhWlpvSUxLZ2M", null, null, null, null, null, null, null, "https://akcdn.detik.net.id/visual/2023/10/06/kaesang-temui-ketum-pp-muhammadiyah-1_169.jpeg?w\u003d650"]
      //             ], null, [12, [12, "PublisherOfCBMizAFBVV95cUxNR19mOVAydU00VENDeUluUmpsN2hndmd5UVplNlhqMktKQzI4NDcyMWtYOFhMaVRiM2NZVmZRTzhYWVlEMW1sSkZLeENLNDBPNTQxQ09zZEpVM3lKbWdnUXp2NnlCMFFNT2FJN2RIcFlFUFBObURFdlRwZzZKWFYtai0zVmh0RU5TQ2RoTDV3bWdHa1J0M0RudTY2Tm5JbG13enhNcnRwSTFlZ05tWEdlNkpwRFY4MXk5SHJGWDBQYjZjMEZYNV9Hbm5KM0bSAdIBQVVfeXFMUHRRaUk5MVE5WGV1b0VwSUFIMmpMQlFuZEhobXM3RXBCYWh3bFlOcWQ4R2xTVEwzQ0RSZWRiOTZadFp1eWF1bjFSRXVLYWlVWi1LaDZ2cXhTQzZRNXIyTHVTQ3hOU3BKRkpKNjlkQm5fa2VQeTg4dmZXSnRzS2xFUUZONXV2cVNTbnZhSXZRWnpmVmlkWnIzcU9yYUU2YWdncUVMWW5rOW55VVlua1NtSmw4QnRBdEwtWDBUZHM5bHpMYXRJQlpkd1FzTktqc1dUcjV3"], "CNN Indonesia", ["https://encrypted-tbn0.gstatic.com/faviconV2?url\u003dhttps://www.cnnindonesia.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", null, 180, 180, null, "https://encrypted-tbn0.gstatic.com/faviconV2?url\u003dhttps://www.cnnindonesia.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", "https://encrypted-tbn0.gstatic.com/faviconV2?url\u003dhttps://www.cnnindonesia.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL"], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, ["https://lh3.googleusercontent.com/DbWi4x_SM23I68nZ2yfSIXFftHHg_KnryenkDv6hgvF-KNWkdX1af6wbj9E6OWVTQCVkkfc7Wz8", null, 400, 67, null, "CAUqFAgKIhDdJrHU60vohmOkoTIkFQqvMO7FhYUuaglpbWFnZS9wbmc"],
      //                ["https://lh3.googleusercontent.com/7IfCvu5vLIx9Go0N2AG9E8ectOZFOFJAHhoPHwzn8GJZQSta2aZhxYVmNzpcHF4oreagPV0W1lA", null, 400, 67, null, "CAUqFAgKIhDdJrHU60vohmOkoTIkFQqvMNSF4oQuaglpbWFnZS9wbmc"]
      //             ], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, [null, [
      //                ["Buka CNN Indonesia", "publications/CAAiEN0msdTrS-iGY6ShMiQVCq8qFAgKIhDdJrHU60vohmOkoTIkFQqv", [null, null, null, null, null, "link"], 0]
      //             ]], null, "https://www.cnnindonesia.com/nasional/20240823095310-12-1136540/kaesang-sudah-urus-sk-belum-pernah-dipidana-untuk-maju-pilgub-jateng", null, "https://www.cnnindonesia.com/nasional/20240823095310-12-1136540/kaesang-sudah-urus-sk-belum-pernah-dipidana-untuk-maju-pilgub-jateng/amp", null, [
      //                [null, null, null, null, "NEWS_STORYLINE_RESULT_GROUP", 0, 141, null, null, null, 37, null, [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "7277746365179314931", "3899288140975860971", "https://akcdn.detik.net.id/visual/2023/10/06/kaesang-temui-ketum-pp-muhammadiyah-1_169.jpeg?w\u003d650"],
      //                   [], null, 1, null, null, null, null, null, [-1, 3],
      //                   [
      //                      [1724382306],
      //                      [1724385066, 264491000]
      //                   ], null, null, null, "CP///////////wEQAyiAltDTmYqIA0ABUhQKAklEEAcQARALKggIARB2GHYgAFgA", "CHY\u003d"
      //                ]
      //             ], null, 1, null, null, null, null, null, 0],
      //             [13, [13, "CBMiswFBVV95cUxPazJxTDR6NlVJUnpTQkFfU2FJb01LWkVFMGtmZklPUnQxQXR2ZjVVZzBmMGJ0VXJWMU80T0F1blhfcVpOVThQMGdwNXc1c0lBRG9rclhhOHlvUjlVeGdUbGU0QkZIUHlLcXZlazN4R0R3c1Fwd0NIcVdPemFqcGxMUFNSSEh2anl1bkdQeWYtVFY4Z1hQRnBGcXEtQzI2X2ZhUzNJYlRDazlLRE5UbDVWNk9vVdIBuAFBVV95cUxOVVVLOGs0bHR0Y3JzQlRJeW9HcVdJeEQtdW5qRkZOSFp6Nzh1TEoyRXJXODdzS0tWOWNjck15T0V3NEdSRmY4cGRSd1VEQ0d2NmRkVmM3T0o1TElUNlFVcGNlQU5QbWxiSjJ0QjB2VUsyX1YzMmVLaWRnNjNpemVkOElWbUs2cUxVcHdHdWtxN2R4Q3g1Q1I0VXVoMVdHdkQ1a1VMTnVKUThWR0o3WV9CTDc1Qy1DMkJ4"], "Kaesang Pangarep Ternyata Sudah Urus SK Belum Dipidana untuk Maju Pilgub", null, [1724382549], null, "https://news.detik.com/pilkada/d-7504308/kaesang-pangarep-ternyata-sudah-urus-sk-belum-dipidana-untuk-maju-pilgub", "https://news.detik.com/pilkada/d-7504308/kaesang-pangarep-ternyata-sudah-urus-sk-belum-dipidana-untuk-maju-pilgub", [
      //                ["/attachments/CC8iK0NnNXBRMmRTU25oRFlrTk9Oa0ZUVFJDb0FSaXNBaWdCTWdhSlE1NVJuUWs", null, null, null, null, "CC8iK0NnNXBRMmRTU25oRFlrTk9Oa0ZUVFJDb0FSaXNBaWdCTWdhSlE1NVJuUWs", null, null, null, null, null, null, null, "https://awsimages.detik.net.id/community/media/visual/2024/07/08/kaesang-sambangi-markas-pks-bahas-pilkada-4_169.jpeg?w\u003d1200"]
      //             ], null, [12, [12, "PublisherOfCBMiswFBVV95cUxPazJxTDR6NlVJUnpTQkFfU2FJb01LWkVFMGtmZklPUnQxQXR2ZjVVZzBmMGJ0VXJWMU80T0F1blhfcVpOVThQMGdwNXc1c0lBRG9rclhhOHlvUjlVeGdUbGU0QkZIUHlLcXZlazN4R0R3c1Fwd0NIcVdPemFqcGxMUFNSSEh2anl1bkdQeWYtVFY4Z1hQRnBGcXEtQzI2X2ZhUzNJYlRDazlLRE5UbDVWNk9vVdIBuAFBVV95cUxOVVVLOGs0bHR0Y3JzQlRJeW9HcVdJeEQtdW5qRkZOSFp6Nzh1TEoyRXJXODdzS0tWOWNjck15T0V3NEdSRmY4cGRSd1VEQ0d2NmRkVmM3T0o1TElUNlFVcGNlQU5QbWxiSjJ0QjB2VUsyX1YzMmVLaWRnNjNpemVkOElWbUs2cUxVcHdHdWtxN2R4Q3g1Q1I0VXVoMVdHdkQ1a1VMTnVKUThWR0o3WV9CTDc1Qy1DMkJ4"], "detikNews", ["https://encrypted-tbn1.gstatic.com/faviconV2?url\u003dhttps://news.detik.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", null, 180, 180, null, "https://encrypted-tbn1.gstatic.com/faviconV2?url\u003dhttps://news.detik.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", "https://encrypted-tbn1.gstatic.com/faviconV2?url\u003dhttps://news.detik.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL"], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, ["https://lh3.googleusercontent.com/rA-b-aQTKQH8gEJDBZJTf2UqjZWuKVDm8IYf9E3Nth4bFD8GjN_BGDBGry7VgeFhGf1wlPuYgQ", null, 400, 68, null, "CAUqBwgKMI6KlQsw946Chi5qCWltYWdlL3BuZw"],
      //                ["https://lh3.googleusercontent.com/K2BMBptP96Zn6rh_ATsoofg9Y4C4NoA2tBAbKg8lO1e2fmVJ7vCFVtzFvu2Qbrz0Sd_Br8NskQ", null, 400, 68, null, "CAUqBwgKMI6KlQsw_ev9hS5qCWltYWdlL3BuZw"]
      //             ], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, [null, [
      //                ["Buka detikNews", "publications/CAAqBwgKMI6KlQswl-WqAw", [null, null, null, null, null, "link"], 0]
      //             ]], null, "https://news.detik.com/pilkada/d-7504308/kaesang-pangarep-ternyata-sudah-urus-sk-belum-dipidana-untuk-maju-pilgub", null, "https://news.detik.com/pilkada/d-7504308/kaesang-pangarep-ternyata-sudah-urus-sk-belum-dipidana-untuk-maju-pilgub/amp", null, [
      //                [null, null, null, null, "NEWS_STORYLINE_RESULT_GROUP", 0, 141, null, null, null, 37, null, [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "672188549896089574", "15999208169910904968", "https://awsimages.detik.net.id/community/media/visual/2024/07/08/kaesang-sambangi-markas-pks-bahas-pilkada-4_169.jpeg?w\u003d1200"],
      //                   [], null, 1, null, null, null, null, null, [null, 3],
      //                   [
      //                      [1724382549],
      //                      [1724385066, 264612000]
      //                   ], null, null, null, "EANAAVIUCgJJRBAHEAEQCyoICAEQcBhwIAA\u003d", "CHA\u003d"
      //                ]
      //             ], null, 1, null, null, null, null, null, 1],
      //             [13, [13, "CBMi4wFBVV95cUxNQmdnYlRoNlV2OEN6RU5LVDZKakFlbEN2ZFNiNWtZaDc1dmZqM3hrUjVZTUwzUDgzekQwSkJQdHN5WkljSktLNWFNd01SS0w0dzlWbHJQY1pzdENrUXFRVWpJeENxU09vdmg0VVNWUlpTVGNudGYzcEVIamNHZ0FyX25KZjBxTnlhYkpLM1RxWFNUNE5YLXRVYmFOWjdxb3hpcXMyX2w2ZVFZcHFKOGVqWXgtR245cTl6MXFybzZqbWVLU3ZSbnBuT3FDaDNSUkQzUUw0bkliZWZBdzRMVU1wUUZXSdIB5gFBVV95cUxOeU1BZmZZbE5wdThwZGY0UmJyRjFnU0liT0xpeFhMN0VnRkRNZU96TUdRbWpwSlBmbDdYS3BKaW9xNk0xck9mWll3d0w4TXk5TXk3ZWVfQkxuVm9SSm5BaDZHZm9rcmhTN2JtS21WUWY3NTV4S0FRMW1kUVFMZjJpT2ppcUl5LWRia3ppM19wdGVTakpGM1hCWlIyTGVhWlN1Q0lXdExVZjZhRXVQZE53djJVR0U4OXpKUHdnc1lRZVF4SG11Q2xsS1o5UmFuSzhOd1pkRXZQZVY5bFlGNERSZFhmZWVZdw"], "Breaking News: Mau Maju Pilgub, Kaesang Urus Surat Keterangan Tak Pernah Dipidana ke PN Jaksel", null, [1724380694], null, "https://www.tribunnews.com/mata-lokal-memilih/2024/08/23/breaking-news-mau-maju-pilgub-kaesang-urus-surat-keterangan-tak-pernah-dipidana-ke-pn-jaksel", "https://www.tribunnews.com/mata-lokal-memilih/2024/08/23/breaking-news-mau-maju-pilgub-kaesang-urus-surat-keterangan-tak-pernah-dipidana-ke-pn-jaksel", [
      //                ["/attachments/CC8iL0NnNVRNMFowYWpWbGMxaDNablpXVFJDb0FSaXNBaWdCTWdrQmNJN3JwU2dIN1FF", null, null, null, null, "CC8iL0NnNVRNMFowYWpWbGMxaDNablpXVFJDb0FSaXNBaWdCTWdrQmNJN3JwU2dIN1FF", null, null, null, null, null, null, null, "https://asset-2.tstatic.net/tribunnews/foto/bank/images/ketua-umum-psi-kaesang-pangarep-saat-penyerahan-surat-rekomendasi-calon-kepala-daerah.jpg"]
      //             ], null, [12, [12, "PublisherOfCBMi4wFBVV95cUxNQmdnYlRoNlV2OEN6RU5LVDZKakFlbEN2ZFNiNWtZaDc1dmZqM3hrUjVZTUwzUDgzekQwSkJQdHN5WkljSktLNWFNd01SS0w0dzlWbHJQY1pzdENrUXFRVWpJeENxU09vdmg0VVNWUlpTVGNudGYzcEVIamNHZ0FyX25KZjBxTnlhYkpLM1RxWFNUNE5YLXRVYmFOWjdxb3hpcXMyX2w2ZVFZcHFKOGVqWXgtR245cTl6MXFybzZqbWVLU3ZSbnBuT3FDaDNSUkQzUUw0bkliZWZBdzRMVU1wUUZXSdIB5gFBVV95cUxOeU1BZmZZbE5wdThwZGY0UmJyRjFnU0liT0xpeFhMN0VnRkRNZU96TUdRbWpwSlBmbDdYS3BKaW9xNk0xck9mWll3d0w4TXk5TXk3ZWVfQkxuVm9SSm5BaDZHZm9rcmhTN2JtS21WUWY3NTV4S0FRMW1kUVFMZjJpT2ppcUl5LWRia3ppM19wdGVTakpGM1hCWlIyTGVhWlN1Q0lXdExVZjZhRXVQZE53djJVR0U4OXpKUHdnc1lRZVF4SG11Q2xsS1o5UmFuSzhOd1pkRXZQZVY5bFlGNERSZFhmZWVZdw"], "Tribunnews.com", ["https://encrypted-tbn2.gstatic.com/faviconV2?url\u003dhttps://www.tribunnews.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", null, 180, 180, null, "https://encrypted-tbn2.gstatic.com/faviconV2?url\u003dhttps://www.tribunnews.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", "https://encrypted-tbn2.gstatic.com/faviconV2?url\u003dhttps://www.tribunnews.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL"], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, ["https://lh3.googleusercontent.com/n1Vbok3amFFm8ua8kGtUd8MACWtCvNG5sB44TNYe0-OI9qv86YXUF6R7GhQOwpYLSs8m54hIh3k", null, 1559, 398, null, "CAUqBwgKMOaOjgswtNu6gjhqCWltYWdlL3BuZw"],
      //                ["https://lh3.googleusercontent.com/1hi1cV8mmz1jdHUMUfNH7OmaUgh2eyIFhoia0zL4pyrGI8FEIs9zrZW_Y9wWUvjHk2SR6LJ08A", null, 778, 215, null, "CAUqBwgKMOaOjgswz4iQvDlqCWltYWdlL3BuZw"]
      //             ], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, [null, [
      //                ["Buka Tribunnews.com", "publications/CAAqBwgKMOaOjgswxOWgAw", [null, null, null, null, null, "link"], 0]
      //             ]], null, "https://www.tribunnews.com/mata-lokal-memilih/2024/08/23/breaking-news-mau-maju-pilgub-kaesang-urus-surat-keterangan-tak-pernah-dipidana-ke-pn-jaksel", null, "https://m.tribunnews.com/amp/mata-lokal-memilih/2024/08/23/breaking-news-mau-maju-pilgub-kaesang-urus-surat-keterangan-tak-pernah-dipidana-ke-pn-jaksel", null, [
      //                [null, null, null, null, "NEWS_STORYLINE_RESULT_GROUP", 0, 141, null, null, null, 37, null, [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "7107407458471036030", "531333047999361355", "https://asset-2.tstatic.net/tribunnews/foto/bank/images/ketua-umum-psi-kaesang-pangarep-saat-penyerahan-surat-rekomendasi-calon-kepala-daerah.jpg"],
      //                   [], null, 1, null, null, null, null, null, [null, 3],
      //                   [
      //                      [1724380694],
      //                      [1724385066, 264693000]
      //                   ], null, null, null, "EAMogLamuY6KiANAAVIUCgJJRBAHEAEQCyoICAEQWhhaIABYAA\u003d\u003d", "CFo\u003d"
      //                ]
      //             ], null, 1, null, null, null, null, null, 2]
      //          ], null, null, [null, null, null, null, "NEWS_STORYLINE_RESULT_GROUP", null, 141, null, null, null, 37], 2]],
      //          [
      //             [13, [13, "CBMimgFBVV95cUxPeUk2V2o1M2JZQlNMTElQLXROZWNucUl0eDRtdnh2S0RneWkxZHZSOHJEa1B4OWRyNlpOdmZqMl90czRKVEJQQXhjR2hUVWlkVnVabURiaG1GZEJDYlNWcE1yaW1US1NGLUdhUmFLcjN6cjRvbG92dS16N1NfVFA0a1JNTzBqQU1pbmlhR2xzY0FGNFRxaHgwMEZ30gGcAUFVX3lxTFBVTkI0VE53QVV5VWlTMnNhck5SV0RsNl9pblJ3UzhDNHVMR19xRWREY2ZQX1RxSGJaQlRYaTl0TUNrdXFfSzF3d3h0VjZzVTk5VHBzc054WWk0RGRlWVBmYWpWbEtXRTZKV3RmWG9UMHpHcjhYaFlURzN1Y2VqLWh6RkJtNWc0MHZhT3lUQThRWW1kZkdKdVNxcDgxdA"], "KPU DKI siapkan 31 TPS di lokasi khusus untuk pilgub", null, [1724334830], null, "https://www.antaranews.com/berita/4280215/kpu-dki-siapkan-31-tps-di-lokasi-khusus-untuk-pilgub", "https://www.antaranews.com/berita/4280215/kpu-dki-siapkan-31-tps-di-lokasi-khusus-untuk-pilgub", [
      //                ["/attachments/CC8iK0NnNDJWRXRPV0hka1FrMTBjRkU1VFJDM0FSaVRBaWdCTWdZZFFJb3JHZ28", null, null, null, null, "CC8iK0NnNDJWRXRPV0hka1FrMTBjRkU1VFJDM0FSaVRBaWdCTWdZZFFJb3JHZ28", null, null, null, null, null, null, null, "https://cdn.antaranews.com/cache/1200x800/2024/08/22/IMG_20240822_202135.jpg"]
      //             ], null, [12, [12, "PublisherOfCBMimgFBVV95cUxPeUk2V2o1M2JZQlNMTElQLXROZWNucUl0eDRtdnh2S0RneWkxZHZSOHJEa1B4OWRyNlpOdmZqMl90czRKVEJQQXhjR2hUVWlkVnVabURiaG1GZEJDYlNWcE1yaW1US1NGLUdhUmFLcjN6cjRvbG92dS16N1NfVFA0a1JNTzBqQU1pbmlhR2xzY0FGNFRxaHgwMEZ30gGcAUFVX3lxTFBVTkI0VE53QVV5VWlTMnNhck5SV0RsNl9pblJ3UzhDNHVMR19xRWREY2ZQX1RxSGJaQlRYaTl0TUNrdXFfSzF3d3h0VjZzVTk5VHBzc054WWk0RGRlWVBmYWpWbEtXRTZKV3RmWG9UMHpHcjhYaFlURzN1Y2VqLWh6RkJtNWc0MHZhT3lUQThRWW1kZkdKdVNxcDgxdA"], "ANTARA", ["https://encrypted-tbn1.gstatic.com/faviconV2?url\u003dhttps://www.antaranews.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", null, 180, 180, null, "https://encrypted-tbn1.gstatic.com/faviconV2?url\u003dhttps://www.antaranews.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", "https://encrypted-tbn1.gstatic.com/faviconV2?url\u003dhttps://www.antaranews.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL"], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, ["https://lh3.googleusercontent.com/paG9_kLvy5PBqgGqPLaGc5tgluEM_d7jJ4HHbLs0f1QbM3Mn92vvqzy3_w9DqXhkMhD0h7gypQ", null, 631, 110, null, "CAUqFAgKIhDVZIqiebDa_gCOXQVHoTGwMO-fvd4taglpbWFnZS9wbmc"],
      //                ["https://lh3.googleusercontent.com/KJgYgNJHBkoWTczwe7EORNwzOGZScXyXjt8VE_y_pfF0Q1VcPHV4Fekj7WAopQjcuBL9oDcqJQ", null, 1000, 194, null, "CAUqFAgKIhDVZIqiebDa_gCOXQVHoTGwMPuOqd4taglpbWFnZS9wbmc"]
      //             ], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, [null, [
      //                ["Buka ANTARA", "publications/CAAiENVkiqJ5sNr-AI5dBUehMbAqFAgKIhDVZIqiebDa_gCOXQVHoTGw", [null, null, null, null, null, "link"], 0]
      //             ]], null, "https://www.antaranews.com/berita/4280215/kpu-dki-siapkan-31-tps-di-lokasi-khusus-untuk-pilgub", null, "https://m.antaranews.com/amp/berita/4280215/kpu-dki-siapkan-31-tps-di-lokasi-khusus-untuk-pilgub", null, [
      //                [null, null, null, null, "", null, 141, null, null, null, 37, null, [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "14751947669226996507", "15722700749027488489", "https://cdn.antaranews.com/cache/1200x800/2024/08/22/IMG_20240822_202135.jpg"], null, null, 1, null, null, null, null, null, [null, 3],
      //                   [
      //                      [1724334830],
      //                      [1724385066, 264795000]
      //                   ], null, null, null, "EANAAVIUCgJJRBAHEAEQCyoICAEQexh7IAA\u003d", "CHs\u003d"
      //                ]
      //             ], null, 1, null, null, [null, null, null, null, null, null, null, null, null, null, null, null, 1], null, 1, 0], null, null, null, null, null, null, 3
      //          ],
      //          [
      //             [13, [13, "CBMilAFBVV95cUxPMldiWTNzMFVDdzQwalNBOFRpbFFkd3AtdXk1Z0lfT3B3eGU3R2FneVFBZDZLU1UycEgzWHFLY3Q5NlBpSjZLa0tKbk0zNlFpWUpsT005dVlyUGkxdE1WT3JRX0dpMDhlOXVfalJ1Z2pjemhRRHowRjZrQUY0dHN6N3ZsRGtyQU9PNVhjSS1nMzlMSTE4"], "PKB Usung Willem-Aloysius di Pilgub Papua Tengah", null, [1724371800], null, "https://www.rri.co.id/pilkada-2024/922791/pkb-usung-willem-aloysius-di-pilgub-papua-tengah", null, [
      //                ["/attachments/CC8iK0NnNUtXbXBQTkhoNU9GcEtRMU5XVFJDdkFSaWdBaWdCTWdZQklKcmptQW8", null, 140, 140, null, "CC8iK0NnNUtXbXBQTkhoNU9GcEtRMU5XVFJDdkFSaWdBaWdCTWdZQklKcmptQW8", null, null, null, null, null, null, null, "https://cdn.rri.co.id/berita/Pusat_Pemberitaan/o/1724371702765-IMG-20240823-WA0001/qkyulrafdcytds4.jpeg"]
      //             ], null, [12, [12, "PublisherOfCBMilAFBVV95cUxPMldiWTNzMFVDdzQwalNBOFRpbFFkd3AtdXk1Z0lfT3B3eGU3R2FneVFBZDZLU1UycEgzWHFLY3Q5NlBpSjZLa0tKbk0zNlFpWUpsT005dVlyUGkxdE1WT3JRX0dpMDhlOXVfalJ1Z2pjemhRRHowRjZrQUY0dHN6N3ZsRGtyQU9PNVhjSS1nMzlMSTE4"], "rri.co.id", ["https://encrypted-tbn2.gstatic.com/faviconV2?url\u003dhttps://www.rri.co.id\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", null, 180, 180, null, "https://encrypted-tbn2.gstatic.com/faviconV2?url\u003dhttps://www.rri.co.id\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", "https://encrypted-tbn2.gstatic.com/faviconV2?url\u003dhttps://www.rri.co.id\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL"]], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, [null, [
      //                ["Buka rri.co.id", "publications/CAAqBwgKMLTXngswy-G2Aw", [null, null, null, null, null, "link"], 0]
      //             ]], null, "https://www.rri.co.id/pilkada-2024/922791/pkb-usung-willem-aloysius-di-pilgub-papua-tengah", null, null, null, [
      //                [null, null, null, null, "", null, 141, null, null, null, 37, null, [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "2893298731058301572", "10404647871399761957", "https://cdn.rri.co.id/berita/Pusat_Pemberitaan/o/1724371702765-IMG-20240823-WA0001/qkyulrafdcytds4.jpeg"], null, null, 1, null, null, null, null, null, [null, 3],
      //                   [
      //                      [1724371800],
      //                      [1724385066, 264872000]
      //                   ], null, null, null, "EAMowMziiIKKiANAAVIUCgJJRBAHEAEQCyoICAEQcBhwIABY8OagtgY\u003d", "CHA\u003d"
      //                ]
      //             ], null, 1, null, null, [null, null, null, null, null, null, null, null, null, null, null, null, 1], null, 1, 0], null, null, null, null, null, null, 4
      //          ],
      //          [
      //             [13, [13, "CBMivwFBVV95cUxQU3VCV3cyZ01HTkpLTVlIN2VHU0ltWDlEMmRUZEVCTmNlTVlEUV9xcHVmVjQ0MFNqS3lUM2hiZk5HNHhSWkh0alRlZkczSzNmajZUSTlVN29RR3dLNEcyTHA2YW5zbUVjNHJnLXRZc3NSYk5LOUlCRnVFZ3ExaVB6UG9pRmprWnBHaE5vNDdPYVFIWXRZSkE5b0Z6VDFzUDF5NVFzd3d0ek9nQkFoN01aeU05dHhOdVRIV1hZZlNERdIBxAFBVV95cUxQcU03QmFmY3llTWFMWWFHMmhPQTlPZTlMYnVZVjhNNlA2dHdhZDVHXzBUdm9aZ3NEU0Z6SnFDNmd5bHZHc1VNMmxsa2s1enFrTnBES1Blb3JYbWRNaEZmeHotRm5ncnlDVTFCZkNzVHJYaXNXRDhxbTRwbjFROVpya2JCOWFkd2xMM3hPcjdJUEhVV0VVeGRudzdRTEI0bFRhLWo3ZWthUHMtLXRNT2hzakhTdUpLeUdsakl1YWFUYVNybnRW"], "Andai RUU Pilkada Batal Disahkan, PDIP Prediksi Ada Tiga Paslon di Pilgub Jatim", null, [1724326057], null, "https://www.suarasurabaya.net/politik/2024/andai-ruu-pilkada-batal-disahkan-pdip-prediksi-ada-tiga-paslon-di-pilgub-jatim/", "https://www.suarasurabaya.net/politik/2024/andai-ruu-pilkada-batal-disahkan-pdip-prediksi-ada-tiga-paslon-di-pilgub-jatim/", [
      //                ["/attachments/CC8iMkNnNWtjbVYyTXpCYWVHZFRUV1pQVFJEREFSaUNBaWdCTWdzQkVJYVBxV2NISkVsd3VR", null, null, null, null, "CC8iMkNnNWtjbVYyTXpCYWVHZFRUV1pQVFJEREFSaUNBaWdCTWdzQkVJYVBxV2NISkVsd3VR", null, null, null, null, null, null, null, "https://www.suarasurabaya.net/wp-content/uploads/2024/08/Kanang.jpeg"]
      //             ], null, [12, [12, "PublisherOfCBMivwFBVV95cUxQU3VCV3cyZ01HTkpLTVlIN2VHU0ltWDlEMmRUZEVCTmNlTVlEUV9xcHVmVjQ0MFNqS3lUM2hiZk5HNHhSWkh0alRlZkczSzNmajZUSTlVN29RR3dLNEcyTHA2YW5zbUVjNHJnLXRZc3NSYk5LOUlCRnVFZ3ExaVB6UG9pRmprWnBHaE5vNDdPYVFIWXRZSkE5b0Z6VDFzUDF5NVFzd3d0ek9nQkFoN01aeU05dHhOdVRIV1hZZlNERdIBxAFBVV95cUxQcU03QmFmY3llTWFMWWFHMmhPQTlPZTlMYnVZVjhNNlA2dHdhZDVHXzBUdm9aZ3NEU0Z6SnFDNmd5bHZHc1VNMmxsa2s1enFrTnBES1Blb3JYbWRNaEZmeHotRm5ncnlDVTFCZkNzVHJYaXNXRDhxbTRwbjFROVpya2JCOWFkd2xMM3hPcjdJUEhVV0VVeGRudzdRTEI0bFRhLWo3ZWthUHMtLXRNT2hzakhTdUpLeUdsakl1YWFUYVNybnRW"], "Suara Surabaya", ["https://encrypted-tbn1.gstatic.com/faviconV2?url\u003dhttps://www.suarasurabaya.net\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", null, 180, 180, null, "https://encrypted-tbn1.gstatic.com/faviconV2?url\u003dhttps://www.suarasurabaya.net\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", "https://encrypted-tbn1.gstatic.com/faviconV2?url\u003dhttps://www.suarasurabaya.net\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL"], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, ["https://lh3.googleusercontent.com/2pQC81iGUp2w_R0R0gGPY88YSmQEvHEje8YzJUnoEAbdb8tt7SMaZbdkmceHGgk1a-J-5UFOdcU", null, 400, 75, null, "CAUqBwgKMJv3nQsw4OLnqzBqCWltYWdlL3BuZw"],
      //                ["https://lh3.googleusercontent.com/itkexr53YSdp3V5NcojtD5c_E-RqhlpWxvzhPoEq6drfwKVlTqS48rL2AsQF2OVdX1v-xM1f8g", null, 400, 75, null, "CAUqBwgKMJv3nQswmvboqzBqCWltYWdlL3BuZw"]
      //             ], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, [null, [
      //                ["Buka Suara Surabaya", "publications/CAAqBwgKMJv3nQswrIG2Aw", [null, null, null, null, null, "link"], 0]
      //             ]], null, "https://www.suarasurabaya.net/politik/2024/andai-ruu-pilkada-batal-disahkan-pdip-prediksi-ada-tiga-paslon-di-pilgub-jatim/", null, "https://www.suarasurabaya.net/politik/2024/andai-ruu-pilkada-batal-disahkan-pdip-prediksi-ada-tiga-paslon-di-pilgub-jatim/?amp", null, [
      //                [null, null, null, null, "", null, 141, null, null, null, 37, null, [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "17668627403548578102", "2558450612537636726", "https://www.suarasurabaya.net/wp-content/uploads/2024/08/Kanang.jpeg"], null, null, 1, null, null, null, null, null, [null, 3],
      //                   [
      //                      [1724326057],
      //                      [1724385066, 264915000]
      //                   ], null, null, null, "EAMogMyHw9+JiANAAVIUCgJJRBAHEAEQCyoICAEQchhyIABYAA\u003d\u003d", "CHI\u003d"
      //                ]
      //             ], null, 1, null, null, [null, null, null, null, null, null, null, null, null, null, null, null, 1], null, 1, 0], null, null, null, null, null, null, 5
      //          ],
      //          [null, [null, null, [
      //             [13, [13, "CBMivwFBVV95cUxQckRyZ1p5WnlpbGdWU3ZYWFMyeURuWWUtQlJwZXhxcExyRk9jbjJJbTl1OWt0YkcySjc4ZWFZaTJlUFBUYjlSZEhSMzZsSkgySDZJUU1WWEpLTVdFaXhBYWhkZGdIZ2d0NW1PLU83clhuWnQyaDloc0dsRGJ3ZjlrUTVwMDFYVllTOVNDQm5pWXBBdjRyOWs1Zk9ISXVZV2xaOUNFMU9ONnkwVmZzcEZqSUFmNVhidkllN3lSR0hCQdIBxAFBVV95cUxOY05YcDVVYll4WDNiVGo4QXlFWFZmeWVRR0dMV01iTXRQeDAweV85Rjk1dEx6ek96cFNiNHNuSmx4XzU5dXl6Z1hvUDZjdHlBVDhhOTNObTVuZkdPdVYwTG80V0E4R1RUZ1RKYmlVemg4NVVicDduc3pjRDhlV0Y2c0Jad0cwX2N0cUVZQndqdG5Vd25uRnk3SDNnUDQxRXUxeEZXbjMxbW1EZ3FwYmkyR08wUXFaN2xYdTJtU0lGSzhwZ1px"], "PDIP Berpeluang Bersama Golkar Usung Airin-Ade pada Pilgub Banten", null, [1724339737], null, "https://www.beritasatu.com/bersatu-kawal-pilkada/2837423/pdip-berpeluang-bersama-golkar-usung-airin-ade-pada-pilgub-banten", "https://www.beritasatu.com/bersatu-kawal-pilkada/2837423/pdip-berpeluang-bersama-golkar-usung-airin-ade-pada-pilgub-banten", [
      //                ["/attachments/CC8iL0NnNTRRUzFQWVdrM2RrTkJPWFJvVFJDekFSaVpBaWdCTWdrZGNJZ3FwaWc5VUFF", null, null, null, null, "CC8iL0NnNTRRUzFQWVdrM2RrTkJPWFJvVFJDekFSaVpBaWdCTWdrZGNJZ3FwaWc5VUFF", null, null, null, null, null, null, null, "https://img2.beritasatu.com/cache/beritasatu/910x580-2/2024/08/1723694472-4000x2248.webp"]
      //             ], null, [12, [12, "PublisherOfCBMivwFBVV95cUxQckRyZ1p5WnlpbGdWU3ZYWFMyeURuWWUtQlJwZXhxcExyRk9jbjJJbTl1OWt0YkcySjc4ZWFZaTJlUFBUYjlSZEhSMzZsSkgySDZJUU1WWEpLTVdFaXhBYWhkZGdIZ2d0NW1PLU83clhuWnQyaDloc0dsRGJ3ZjlrUTVwMDFYVllTOVNDQm5pWXBBdjRyOWs1Zk9ISXVZV2xaOUNFMU9ONnkwVmZzcEZqSUFmNVhidkllN3lSR0hCQdIBxAFBVV95cUxOY05YcDVVYll4WDNiVGo4QXlFWFZmeWVRR0dMV01iTXRQeDAweV85Rjk1dEx6ek96cFNiNHNuSmx4XzU5dXl6Z1hvUDZjdHlBVDhhOTNObTVuZkdPdVYwTG80V0E4R1RUZ1RKYmlVemg4NVVicDduc3pjRDhlV0Y2c0Jad0cwX2N0cUVZQndqdG5Vd25uRnk3SDNnUDQxRXUxeEZXbjMxbW1EZ3FwYmkyR08wUXFaN2xYdTJtU0lGSzhwZ1px"], "BeritaSatu.com", ["https://encrypted-tbn3.gstatic.com/faviconV2?url\u003dhttps://www.beritasatu.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", null, 180, 180, null, "https://encrypted-tbn3.gstatic.com/faviconV2?url\u003dhttps://www.beritasatu.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", "https://encrypted-tbn3.gstatic.com/faviconV2?url\u003dhttps://www.beritasatu.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL"], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, ["https://lh3.googleusercontent.com/k1gzRq3CmkP4X2p6skdxXQd2101_e5__ldNZuZc3q0a84x22UjT4Pzy-UjExrcDgIWWy6P1iTZI", null, 288, 47, null, "CAUqBwgKMI_3jQsw_peNpUFqCWltYWdlL3BuZw"],
      //                ["https://lh3.googleusercontent.com/5tSPb3AJLXU-8jDeIMXqkpWF_eEq8w07pLZuDKy95R0pHz0oEP6ALgW5xNBUlhlHikaprxKnZA", null, 288, 47, null, "CAUqBwgKMI_3jQsw7peopUFqCWltYWdlL3BuZw"]
      //             ], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, [null, [
      //                ["Buka BeritaSatu.com", "publications/CAAqBwgKMI_3jQswvLigAw", [null, null, null, null, null, "link"], 0]
      //             ]], null, "https://www.beritasatu.com/bersatu-kawal-pilkada/2837423/pdip-berpeluang-bersama-golkar-usung-airin-ade-pada-pilgub-banten", null, "https://www.beritasatu.com/bersatu-kawal-pilkada/2837423/pdip-berpeluang-bersama-golkar-usung-airin-ade-pada-pilgub-banten/amp", null, [
      //                [null, null, null, null, "NEWS_STORYLINE_RESULT_GROUP", 0, 141, null, null, null, 37, null, [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "11325891323304033207", "1083378693017833412", "https://img2.beritasatu.com/cache/beritasatu/910x580-2/2024/08/1723694472-4000x2248.webp"],
      //                   [], null, 1, null, null, null, null, null, [-1, 3],
      //                   [
      //                      [1724339737],
      //                      [1724385066, 265019000]
      //                   ], null, null, null, "CP///////////wEQAyiA6pKLmYqIA0ABUhQKAklEEAcQARALKggIARB7GHsgAFjww5u2Bg\u003d\u003d", "CHs\u003d"
      //                ]
      //             ], null, 1, null, null, null, null, null, 0],
      //             [13, [13, "CBMi6gFBVV95cUxOaUNhOXAwU0N2aE1XNExaZW94d2JCbnNTTFMwX01iQ0k3VmZLb1J6dExyZXNuR3U3X3hFb1BWR1VYSENjNnJwb0F2aHNCVzZZTnpqRkg4Nmd6YWstQWtrTVpqRTQzdkk1bnVVVUcwZ1Q2el9tUmJxQU1BXzg0U1Z2UHZtUjBPUE96dW9CeFJDWXBNbW1DamY2OG1yeWFncmdzc2JOdHpSRU9lODBDay1EWG1NUlBGcDh3dGNHUW9jdzRWUURYYWk4V0diTXM0X1dMemhHRFRhWUNPcjF5X0tvdFlXc0FSQnhtVXfSAewBQVVfeXFMTWx4S2ZpQWtwMmwzemNYbi0tRWRCQkpzdVJWRC0ybnZtUW1KT2NmSHV5b1hHYXVpaV8ycG1SWUQwc0hFSlNSUm5zOFlaWUF6dUpoQ2UxTnprME9GMy1uOEtSLWFvenpwdWxoanRxellSSFVicUV3bXBseGtnN1JUdUJOejNsUDdyMHZ3QThvVnRXbGNqaV9ZbGhfanNGSjNraEJBSGEwU25rRGhuNkVzM3NSTUhETkVoWHVCR1loRmltS01fdEJLYV9VaUJiS3RsajNLY3VHRnlHdENiUjVma0hCVncyMzk0ajY0alU"], "Hasto Sebut Peluang Tetap Usung Airin-Ade Sumardi di Pilgub Banten Meski Bahlil Ketua Umum Golkar", null, [1724376936], null, "https://www.tribunnews.com/mata-lokal-memilih/2024/08/23/hasto-sebut-peluang-tetap-usung-airin-ade-sumardi-di-pilgub-banten-meski-bahlil-ketua-umum-golkar", "https://www.tribunnews.com/mata-lokal-memilih/2024/08/23/hasto-sebut-peluang-tetap-usung-airin-ade-sumardi-di-pilgub-banten-meski-bahlil-ketua-umum-golkar", [
      //                ["/attachments/CC8iL0NnNXlUbEl4ZEU5dWRtUTNSa2RRVFJDb0FSaXNBaWdCTWdrTmNwU21LbWc5NndF", null, null, null, null, "CC8iL0NnNXlUbEl4ZEU5dWRtUTNSa2RRVFJDb0FSaXNBaWdCTWdrTmNwU21LbWc5NndF", null, null, null, null, null, null, null, "https://asset-2.tstatic.net/tribunnews/foto/bank/images/pdip-dan-golkar-menduetkan-airin-rachmi-diany-dan-ade-sumardi.jpg"]
      //             ], null, [12, [12, "PublisherOfCBMi6gFBVV95cUxOaUNhOXAwU0N2aE1XNExaZW94d2JCbnNTTFMwX01iQ0k3VmZLb1J6dExyZXNuR3U3X3hFb1BWR1VYSENjNnJwb0F2aHNCVzZZTnpqRkg4Nmd6YWstQWtrTVpqRTQzdkk1bnVVVUcwZ1Q2el9tUmJxQU1BXzg0U1Z2UHZtUjBPUE96dW9CeFJDWXBNbW1DamY2OG1yeWFncmdzc2JOdHpSRU9lODBDay1EWG1NUlBGcDh3dGNHUW9jdzRWUURYYWk4V0diTXM0X1dMemhHRFRhWUNPcjF5X0tvdFlXc0FSQnhtVXfSAewBQVVfeXFMTWx4S2ZpQWtwMmwzemNYbi0tRWRCQkpzdVJWRC0ybnZtUW1KT2NmSHV5b1hHYXVpaV8ycG1SWUQwc0hFSlNSUm5zOFlaWUF6dUpoQ2UxTnprME9GMy1uOEtSLWFvenpwdWxoanRxellSSFVicUV3bXBseGtnN1JUdUJOejNsUDdyMHZ3QThvVnRXbGNqaV9ZbGhfanNGSjNraEJBSGEwU25rRGhuNkVzM3NSTUhETkVoWHVCR1loRmltS01fdEJLYV9VaUJiS3RsajNLY3VHRnlHdENiUjVma0hCVncyMzk0ajY0alU"], "Tribunnews.com", ["https://encrypted-tbn2.gstatic.com/faviconV2?url\u003dhttps://www.tribunnews.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", null, 180, 180, null, "https://encrypted-tbn2.gstatic.com/faviconV2?url\u003dhttps://www.tribunnews.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", "https://encrypted-tbn2.gstatic.com/faviconV2?url\u003dhttps://www.tribunnews.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL"], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, ["https://lh3.googleusercontent.com/n1Vbok3amFFm8ua8kGtUd8MACWtCvNG5sB44TNYe0-OI9qv86YXUF6R7GhQOwpYLSs8m54hIh3k", null, 1559, 398, null, "CAUqBwgKMOaOjgswtNu6gjhqCWltYWdlL3BuZw"],
      //                ["https://lh3.googleusercontent.com/1hi1cV8mmz1jdHUMUfNH7OmaUgh2eyIFhoia0zL4pyrGI8FEIs9zrZW_Y9wWUvjHk2SR6LJ08A", null, 778, 215, null, "CAUqBwgKMOaOjgswz4iQvDlqCWltYWdlL3BuZw"]
      //             ], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, [null, [
      //                ["Buka Tribunnews.com", "publications/CAAqBwgKMOaOjgswxOWgAw", [null, null, null, null, null, "link"], 0]
      //             ]], null, "https://www.tribunnews.com/mata-lokal-memilih/2024/08/23/hasto-sebut-peluang-tetap-usung-airin-ade-sumardi-di-pilgub-banten-meski-bahlil-ketua-umum-golkar", null, "https://m.tribunnews.com/amp/mata-lokal-memilih/2024/08/23/hasto-sebut-peluang-tetap-usung-airin-ade-sumardi-di-pilgub-banten-meski-bahlil-ketua-umum-golkar", null, [
      //                [null, null, null, null, "NEWS_STORYLINE_RESULT_GROUP", 0, 141, null, null, null, 37, null, [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "2368174238626933033", "12787953453975852204", "https://asset-2.tstatic.net/tribunnews/foto/bank/images/pdip-dan-golkar-menduetkan-airin-rachmi-diany-dan-ade-sumardi.jpg"],
      //                   [], null, 1, null, null, null, null, null, [null, 3],
      //                   [
      //                      [1724376936],
      //                      [1724385066, 265141000]
      //                   ], null, null, null, "EAMowJfN1JKKiANAAVIUCgJJRBAHEAEQCyoICAEQZxhnIABYAA\u003d\u003d", "CGc\u003d"
      //                ]
      //             ], null, 1, null, null, null, null, null, 1],
      //             [13, [13, "CBMijAFBVV95cUxPdkd4X2lsMWtWV195MVJnS0RQUG9jcmtBMHV2bndQWXprSFE4WnBhM09GSUNiamFyVXc3cUNzYVJ6SDF4Z1BPOURvRTdkVXdjR3pJR3UzdFdDSEdpTEUwWTlzRzFYYkVHSGU0c29mZi1wMlpxcGRGdjJrLTJ2VUE2Q3NFQ01rM0ZOd2g4Uw"], "PDIP Masih Berpeluang Usung Airin-Ade Sumardi di Pilgub Banten", null, [1724330700], null, "https://tirto.id/pdip-masih-berpeluang-usung-airin-ade-sumardi-di-pilgub-banten-g2ZN", null, [
      //                ["/attachments/CC8iK0NnNVFjbTk1YldoMFdHVTFWblEwVFJDb0FSaXNBaWdCTWdhdE5aaXVIUWs", null, 140, 140, null, "CC8iK0NnNVFjbTk1YldoMFdHVTFWblEwVFJDb0FSaXNBaWdCTWdhdE5aaXVIUWs", null, null, null, null, null, null, null, "https://mmc.tirto.id/image/otf/640x0/2024/07/20/1000487814_ratio-16x9.jpg"]
      //             ], null, [12, [12, "PublisherOfCBMijAFBVV95cUxPdkd4X2lsMWtWV195MVJnS0RQUG9jcmtBMHV2bndQWXprSFE4WnBhM09GSUNiamFyVXc3cUNzYVJ6SDF4Z1BPOURvRTdkVXdjR3pJR3UzdFdDSEdpTEUwWTlzRzFYYkVHSGU0c29mZi1wMlpxcGRGdjJrLTJ2VUE2Q3NFQ01rM0ZOd2g4Uw"], "Tirto.id", ["https://encrypted-tbn0.gstatic.com/faviconV2?url\u003dhttps://tirto.id\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", null, 180, 180, null, "https://encrypted-tbn0.gstatic.com/faviconV2?url\u003dhttps://tirto.id\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", "https://encrypted-tbn0.gstatic.com/faviconV2?url\u003dhttps://tirto.id\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL"], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, ["https://lh3.googleusercontent.com/cZcwfQpxxUO_PdzXpoVhuAiq4VMRGk9w2sacCLYMrsg2dyK1siB5kwJgSKJOi3K_VGmDFQGflWY", null, 690, 200, null, "CAUqBwgKMOLX-Aow8byN1lxqCWltYWdlL3BuZw"],
      //                ["https://lh3.googleusercontent.com/L4T0-UdJnxpIV-yBha2w9-BHg1D8RY26OWRLctocLs0Onf9Hldj1rN1RAxBpjNE_YUDXbLtaTA", null, 1667, 834, null, "CAUqBwgKMOLX-Aow4diN1lxqCWltYWdlL3BuZw"]
      //             ], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, [null, [
      //                ["Buka Tirto.id", "publications/CAAqBwgKMOLX-Aow8-HeAg", [null, null, null, null, null, "link"], 0]
      //             ]], null, "https://tirto.id/pdip-masih-berpeluang-usung-airin-ade-sumardi-di-pilgub-banten-g2ZN", null, null, null, [
      //                [null, null, null, null, "NEWS_STORYLINE_RESULT_GROUP", 0, 141, null, null, null, 37, null, [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "5570659060015048617", "10771298709849422398", "https://mmc.tirto.id/image/otf/640x0/2024/07/20/1000487814_ratio-16x9.jpg"],
      //                   [], null, 1, null, null, null, null, null, [-1, 3, -1],
      //                   [
      //                      [1724330700],
      //                      [1724385066, 265233000]
      //                   ], null, null, null, "CP///////////wEQAxj///////////8BKMDgmdzyiYgDQAFSFAoCSUQQBxABEAsqCAgBEF8YXyAAWPDDm7YG", "CF8\u003d"
      //                ]
      //             ], null, 1, null, null, null, null, null, 2]
      //          ], null, null, [null, null, null, null, "NEWS_STORYLINE_RESULT_GROUP", null, 141, null, null, null, 37], 6]],
      //          [
      //             [13, [13, "CBMimAFBVV95cUxOR2o2RUo3OXktaEh2TXg2SVdjekduVURiRUw0eTdPVjFYM0Vkeklvb2JhU183ZzRNTlhEQ2RYTXNhS1FZTjlQa05ISDUtNDJrY1NGT2wxZGJUYm1mVlh0MTlqN1BuVDdUYkNYdzZjN19qWk94X3BuVXItdnREMkFxOHRiNEtiNjFTY0ZpU1BQZDFab3BlUktvStIBmwFBVV95cUxNVUROY0l3TmVVWXZhT2xUeTMyN3otSE5LTHduYzhUMFRreGJzYTltTmlRdzVoeERWeWcyOGtrQTFVT3ZpcHNmd1d3UjNpbXV6c2tNUjhNeFpvdEExenp1RDRBc0JMaW1fR2QwbllzdE94U0hOWDJrVmU4S19ncFFyWDZQQkZucGVkYVFIV1liWkhkVWRaZ3BnbWFnUQ"], "PKB Resmi Usung Willem Wandik-Aloysius Giyai di Pilgub Papua Tengah", null, [1724375496], null, "https://www.jpnn.com/news/pkb-resmi-usung-willem-wandik-aloysius-giyai-di-pilgub-papua-tengah", "https://www.jpnn.com/news/pkb-resmi-usung-willem-wandik-aloysius-giyai-di-pilgub-papua-tengah", [
      //                ["/attachments/CC8iK0NnNDJhbU54VlRGV1RYbFpaR1J5VFJEQ0FSaURBaWdCTWdZVllwQXFLUWs", null, null, null, null, "CC8iK0NnNDJhbU54VlRGV1RYbFpaR1J5VFJEQ0FSaURBaWdCTWdZVllwQXFLUWs", null, null, null, null, null, null, null, "https://cloud.jpnn.com/photo/arsip/normal/2024/08/23/sekretaris-jenderal-dpp-pkb-hasanuddin-wahid-memberikan-lang-oors.jpg"]
      //             ], null, [12, [12, "PublisherOfCBMimAFBVV95cUxOR2o2RUo3OXktaEh2TXg2SVdjekduVURiRUw0eTdPVjFYM0Vkeklvb2JhU183ZzRNTlhEQ2RYTXNhS1FZTjlQa05ISDUtNDJrY1NGT2wxZGJUYm1mVlh0MTlqN1BuVDdUYkNYdzZjN19qWk94X3BuVXItdnREMkFxOHRiNEtiNjFTY0ZpU1BQZDFab3BlUktvStIBmwFBVV95cUxNVUROY0l3TmVVWXZhT2xUeTMyN3otSE5LTHduYzhUMFRreGJzYTltTmlRdzVoeERWeWcyOGtrQTFVT3ZpcHNmd1d3UjNpbXV6c2tNUjhNeFpvdEExenp1RDRBc0JMaW1fR2QwbllzdE94U0hOWDJrVmU4S19ncFFyWDZQQkZucGVkYVFIV1liWkhkVWRaZ3BnbWFnUQ"], "JPNN.com", ["https://encrypted-tbn2.gstatic.com/faviconV2?url\u003dhttps://www.jpnn.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", null, 180, 180, null, "https://encrypted-tbn2.gstatic.com/faviconV2?url\u003dhttps://www.jpnn.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", "https://encrypted-tbn2.gstatic.com/faviconV2?url\u003dhttps://www.jpnn.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL"], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, ["https://lh3.googleusercontent.com/px9LK6enHzgKhHUcRv8J94voDzIBKmldPBgVeE07290SA4AgSEGEPW-NXUaX8sMxWnzOmggkcg", null, 400, 135, null, "CAUqBwgKMP-y3QowgYjbnDxqCWltYWdlL3BuZw"],
      //                ["https://lh3.googleusercontent.com/dDgqdRWRJS5eQQ4PM7A6NdYU5dVcgSzDYJz-MYMvbcP5Wx8piU354hEYv0Ep2vlK8h2iWy_UgA", null, 400, 135, null, "CAUqBwgKMP-y3Qowm9_7nDxqCWltYWdlL3BuZw"]
      //             ], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, [null, [
      //                ["Buka JPNN.com", "publications/CAAqBwgKMP-y3Qowv83RAQ", [null, null, null, null, null, "link"], 0]
      //             ]], null, "https://www.jpnn.com/news/pkb-resmi-usung-willem-wandik-aloysius-giyai-di-pilgub-papua-tengah", null, "https://m.jpnn.com/amp/news/pkb-resmi-usung-willem-wandik-aloysius-giyai-di-pilgub-papua-tengah", null, [
      //                [null, null, null, null, "", null, 141, null, null, null, 37, null, [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "1330882981475981865", "9784435594790320106", "https://cloud.jpnn.com/photo/arsip/normal/2024/08/23/sekretaris-jenderal-dpp-pkb-hasanuddin-wahid-memberikan-lang-oors.jpg"], null, null, 1, null, null, null, null, null, [null, 3],
      //                   [
      //                      [1724375496],
      //                      [1724385066, 265289000]
      //                   ], null, null, null, "EAMowKiBrJCKiANAAVIUCgJJRBAHEAEQCyoICAEQcxhzIABYAA\u003d\u003d", "CHM\u003d"
      //                ]
      //             ], null, 1, null, null, [null, null, null, null, null, null, null, null, null, null, null, null, 1], null, 1, 0], null, null, null, null, null, null, 7
      //          ],
      //          [
      //             [13, [13, "CBMiqAFBVV95cUxNU0tPbmpTTHpNWDhuRm9HQ21lc2UyYnluQlNiTWdxZUdaNkJ1TkxKWDBkY0M1OGZOVUl4MEl5TnFUeG9LdXNOQTc4emQ5aDZwRU1hUXNwMHYwOTBTWFFIakU0TWJJVzhxU0FqeTNSbWxreWUwOUtycklhckVTSXpnbE0wdWNTUDFNT1FQWDJUekZydG1RVl82aHItdWdHcGVKekkzUm1zVDM"], "Pilgub Maluku: JAR Daftar di Hari Pertama, MI Masih Nyari Waktu Tepat", null, [1724289418], null, "https://ameks.fajar.co.id/2024/08/22/pilgub-maluku-jar-daftar-di-hari-pertama-mi-masih-nyari-waktu-tepat/", null, [
      //                ["/attachments/CC8iK0NnNXZPV28yYzNWSlNrRmFOamRmVFJEc0FSalZBU2dCTWdZaE5KQ3NxUVk", null, 140, 140, null, "CC8iK0NnNXZPV28yYzNWSlNrRmFOamRmVFJEc0FSalZBU2dCTWdZaE5KQ3NxUVk", null, null, null, true, null, null, null, "https://ameks.fajar.co.id/wp-content/uploads/2024/03/KPU.png"]
      //             ], null, [12, [12, "PublisherOfCBMiqAFBVV95cUxNU0tPbmpTTHpNWDhuRm9HQ21lc2UyYnluQlNiTWdxZUdaNkJ1TkxKWDBkY0M1OGZOVUl4MEl5TnFUeG9LdXNOQTc4emQ5aDZwRU1hUXNwMHYwOTBTWFFIakU0TWJJVzhxU0FqeTNSbWxreWUwOUtycklhckVTSXpnbE0wdWNTUDFNT1FQWDJUekZydG1RVl82aHItdWdHcGVKekkzUm1zVDM"], "Ameks Online", ["https://encrypted-tbn1.gstatic.com/faviconV2?url\u003dhttps://ameks.fajar.co.id\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", null, 180, 180, null, "https://encrypted-tbn1.gstatic.com/faviconV2?url\u003dhttps://ameks.fajar.co.id\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", "https://encrypted-tbn1.gstatic.com/faviconV2?url\u003dhttps://ameks.fajar.co.id\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL"]], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, [null, [
      //                ["Buka Ameks Online", "publications/CAAqLQgKIidDQklTRndnTWFoTUtFV0Z0Wld0ekxtWmhhbUZ5TG1OdkxtbGtLQUFQAQ", [null, null, null, null, null, "link"], 0]
      //             ]], null, "https://ameks.fajar.co.id/2024/08/22/pilgub-maluku-jar-daftar-di-hari-pertama-mi-masih-nyari-waktu-tepat/", null, null, null, [
      //                [null, null, null, null, "", null, 141, null, null, null, 37, null, [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "13304350656964300853", "11385392202239367331", "https://ameks.fajar.co.id/wp-content/uploads/2024/03/KPU.png"], null, null, 1, null, null, null, null, null, [-1, 2, -1],
      //                   [
      //                      [1724289418],
      //                      [1724385066, 265412000]
      //                   ], null, null, null, "CP///////////wEQAhj///////////8BKMDEy+PXiIgDQAFSFAoCSUQQBxABEAsqCAgBEHgYeCAAWAA\u003d", "CHg\u003d"
      //                ]
      //             ], null, 1, null, null, [null, null, null, null, null, null, null, null, null, null, null, null, 1], null, 1, 0], null, null, null, null, null, null, 8
      //          ],
      //          [
      //             [13, [13, "CBMiuAFBVV95cUxPV2FfMjlXRmJBdDc3V2RscUVZSkdUem42cENXY0EtaFBPZjRGSm9YM2J3SG5GYURUQUJCalJwQzhiXzZxdXlkYWNzWFo3YVdESXNZdXVIMmFQclNac25oYTlVYjJnRl9aWGo3X2tPOHdMc19NaEVFZE5JdlVtektrMEpiclZwcXNLMHQxX2ZXekNydlhoQlBxbFlXVk9XekF0SkZuSnlMX095QUdHVjlJXzhTMEpFdkFo0gGuAUFVX3lxTE00X0dZMXBoUmJSUkJqdW1Ea1lJbjRHYzBkM2J0SUJBLWFSZG9ZOWJBOHZXRFppd3lBT1RPeTBZaVVaMDZGYmlVM1B4N2JOMEtneEo4d3hNT0Y0bXBhQ0FtMURlbTFKWVV5UFRCM2VFbVlhbHczTnhsYWg4Q1c3TGlvMTc2dVpGR0tXOEY0QW5wVHl3Ty1nU2FpQkZBR2VucW5rRkx2aTd4TG1fMXpRUQ"], "PKB Resmi Usung Willem Wandik-Aloysius Giyai di Pilgub Papua Tengah 2024", null, [1724352699], null, "https://www.liputan6.com/pemilu/read/5681456/pkb-resmi-usung-willem-wandik-aloysius-giyai-di-pilgub-papua-tengah-2024", "https://www.liputan6.com/pemilu/read/5681456/pkb-resmi-usung-willem-wandik-aloysius-giyai-di-pilgub-papua-tengah-2024", [
      //                ["/attachments/CC8iJ0NnNUhMVWMwY25kdGFsZHhabmhUVFJDb0FSaXNBaWdCTWdPSmtoSQ", null, null, null, null, "CC8iJ0NnNUhMVWMwY25kdGFsZHhabmhUVFJDb0FSaXNBaWdCTWdPSmtoSQ", null, null, null, null, null, null, null, "https://cdn1-production-images-kly.akamaized.net/uBDKeKQltkykERebf02Ubq_X3OY\u003d/1200x675/smart/filters:quality(75):strip_icc():format(webp)/kly-media-production/medias/2257949/original/021055500_1529811911-040322600_1438750245-pilkada-serentak-5-yos-150805.jpg"]
      //             ], null, [12, [12, "PublisherOfCBMiuAFBVV95cUxPV2FfMjlXRmJBdDc3V2RscUVZSkdUem42cENXY0EtaFBPZjRGSm9YM2J3SG5GYURUQUJCalJwQzhiXzZxdXlkYWNzWFo3YVdESXNZdXVIMmFQclNac25oYTlVYjJnRl9aWGo3X2tPOHdMc19NaEVFZE5JdlVtektrMEpiclZwcXNLMHQxX2ZXekNydlhoQlBxbFlXVk9XekF0SkZuSnlMX095QUdHVjlJXzhTMEpFdkFo0gGuAUFVX3lxTE00X0dZMXBoUmJSUkJqdW1Ea1lJbjRHYzBkM2J0SUJBLWFSZG9ZOWJBOHZXRFppd3lBT1RPeTBZaVVaMDZGYmlVM1B4N2JOMEtneEo4d3hNT0Y0bXBhQ0FtMURlbTFKWVV5UFRCM2VFbVlhbHczTnhsYWg4Q1c3TGlvMTc2dVpGR0tXOEY0QW5wVHl3Ty1nU2FpQkZBR2VucW5rRkx2aTd4TG1fMXpRUQ"], "Liputan6.com", ["https://encrypted-tbn3.gstatic.com/faviconV2?url\u003dhttps://www.liputan6.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", null, 180, 180, null, "https://encrypted-tbn3.gstatic.com/faviconV2?url\u003dhttps://www.liputan6.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL", "https://encrypted-tbn3.gstatic.com/faviconV2?url\u003dhttps://www.liputan6.com\u0026client\u003dNEWS_360\u0026size\u003d96\u0026type\u003dFAVICON\u0026fallback_opts\u003dTYPE,SIZE,URL"], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, ["https://lh3.googleusercontent.com/n1CLsZ1Zu6j5FGCVZKNnEzG-RF-3o_FwWKTaIuaj5DFspoYCjal1wBPmfGgz4q410Rkn4HuV7A", null, 600, 120, null, "CAUqBwgKMN229AowjKeN1S1qCWltYWdlL3BuZw"],
      //                ["https://lh3.googleusercontent.com/1iaynncOPCficoPXBF-291Zwky-KKeu7eSjX0SgpCtMzxaeL3N1ZwoKieKnT7EL__vy8Nzsa", null, 2008, 400, null, "CAUqBwgKMN229AowqZrT1C1qCWltYWdlL3BuZw"]
      //             ], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, [null, [
      //                ["Buka Liputan6.com", "publications/CAAqBwgKMN229AowxaOfAw", [null, null, null, null, null, "link"], 0]
      //             ]], null, "https://www.liputan6.com/pemilu/read/5681456/pkb-resmi-usung-willem-wandik-aloysius-giyai-di-pilgub-papua-tengah-2024", null, "https://www.liputan6.com/amp/5681456/pkb-resmi-usung-willem-wandik-aloysius-giyai-di-pilgub-papua-tengah-2024", null, [
      //                [null, null, null, null, "", null, 141, null, null, null, 37, null, [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "16257043329438502933", "12059130214236086555", "https://cdn1-production-images-kly.akamaized.net/uBDKeKQltkykERebf02Ubq_X3OY\u003d/1200x675/smart/filters:quality(75):strip_icc():format(webp)/kly-media-production/medias/2257949/original/021055500_1529811911-040322600_1438750245-pilkada-serentak-5-yos-150805.jpg"], null, null, 1, null, null, null, null, null, [null, 3],
      //                   [
      //                      [1724352699],
      //                      [1724385066, 265529000]
      //                   ], null, null, null, "EAMogOiH4KaJiANAAVIUCgJJRBAHEAEQCyoICAEQdhh2IABYAA\u003d\u003d", "CHY\u003d"
      //                ]
      //             ], null, 1, null, null, [null, null, null, null, null, null, null, null, null, null, null, null, 1], null, 1, 0], null, null, null, null, null, null, 9
      //          ]
      //       ], "Gxxxx"
      //    ], "pilgub"]
      // }
      //
      // const beritaList = eg.data[1][0] ? eg.data[1][0] : [null];
      //
      // for (let i = 0; i < beritaList.length; i++) {
      //    const berita = beritaList[i];
      //    if (berita) {
      //       const urlGoogleNews: string = berita[0] && berita[0][1] && berita[0][1][1] ? berita[0][1][1] : '';
      //       const title: string = berita[0] ? berita[0][2] : '';
      //       const dateTime: string = berita[0] ? berita[0][4] : '';
      //       const url: string = berita[0] ? berita[0][6] : '';
      //       const mediaName: string = berita[0] && berita[0][10] && berita[0][10][1] ? berita[0][10][1][1] : '';
      //
      //       console.log(`-------------------------`);
      //       console.log(`- URL Google News: ${urlGoogleNews}`);
      //       console.log(`- Title: ${title}`);
      //       console.log(`- DateTime: ${dateTime}`);
      //       console.log(`- URL: ${url}`);
      //       console.log(`- Media Name: ${mediaName}`);
      //    }
      // }
   }
}
export default NewsScraperServices;
