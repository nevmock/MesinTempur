import { INewsRepository } from '../../../interfaces/news-repository';
import delay from '../../../utils/delay';
import BotEngine from '../../../bot-engine';
import loggerUtils from '../../../utils/logger';
import { Browser, HTTPResponse, Page } from 'puppeteer';
import googleNewsScraper from 'google-news-scraper';
import * as cheerio from 'cheerio';
import GoogleNewsUtils from '../../../utils/googleNews';
import { BasicAcceptedElems } from 'cheerio';
import moment from 'moment';

class NewsRepository implements INewsRepository {
   private googleNewsUtils = new GoogleNewsUtils();
   public getGoogleNews = async (searchKey: string): Promise<any> => {
      const url = `https://news.google.com/search?q=${searchKey}&hl=id&gl=ID&ceid=ID%3Aid`;

      BotEngine.page?.setUserAgent(`Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36`)
      BotEngine.page?.setRequestInterception(true)
      BotEngine.page?.on('request', request => {
         if (!request.isNavigationRequest()) {
            request.continue()
            return
         }
         const headers = request.headers()
         headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3'
         headers['Accept-Encoding'] = 'gzip'
         headers['Accept-Language'] = 'en-US,en;q=0.9,es;q=0.8'
         headers['Upgrade-Insecure-Requests'] = "1"
         headers['Referer'] = 'https://www.google.com/'
         request.continue({ headers })
      })
      await BotEngine.page?.setCookie({
         name: "CONSENT",
         value: `YES+cb.${new Date().toISOString().split('T')[0]?.replace(/-/g, '')}-04-p0.en-GB+FX+667`,
         domain: ".google.com"
      });

      loggerUtils.logWithFile(`[News Repository] : go to ${url} page...`)
      await BotEngine.page?.goto(url, {
         waitUntil: 'networkidle2',
      });
      //
      // try {
      //    await BotEngine.page?.$(`[aria-label="Reject all"]`);
      //    await Promise.all([
      //       BotEngine.page?.click(`[aria-label="Reject all"]`),
      //       BotEngine.page?.waitForNavigation({ waitUntil: 'networkidle2' })
      //    ]);
      //
      //    loggerUtils.logWithFile(`[News Repository] : COOKIES INJECTED TO BROWSER`);
      // } catch (err: any) {
      //    loggerUtils.logWithFile(`[News Repository] : COOKIES REJECTED BY BROWSER: ${err.message}`, 'error', 'error')
      // }


      const content = await BotEngine.page!.content();
      const $ = cheerio.load(content);


      const articles = $('article');
      let results: Array<any> = []
      let i = 0
      const urlChecklist = []


      $(articles).each((id: number, e: BasicAcceptedElems<any>) => {
         const link = $(e)?.find('a[href^="./article"]')?.attr('href')?.replace('./', 'https://news.google.com/') || $(e)?.find('a[href^="./read"]')?.attr('href')?.replace('./', 'https://news.google.com/') || false
         link && urlChecklist.push(link);
         const srcset = $(e).find('figure').find('img').attr('srcset')?.split(' ');
         const image = srcset && srcset.length
            ? srcset[srcset.length - 2]
            : $(e).find('figure').find('img').attr('src');
         const articleType = this.googleNewsUtils.getArticleType($, e);
         const title = this.googleNewsUtils.getTitle($, e, articleType);
         const mainArticle = {
            title,
            dateTime: $(e)?.find('div:last-child time')?.attr('datetime') ? moment($(e)?.find('div:last-child time')?.attr('datetime')).toDate() : null,
            mediaName: $(e).find('div[data-n-tid]').text() || false,
            sourceUrl: link,
            content: '-',
            platform: 'Google News'
            // image: image?.startsWith("/") ? `https://news.google.com${image}` : image,
            // time: $(this).find('div:last-child time').text() || false,
            // articleType
         }

         results.push(mainArticle)
         i++

         console.info(`--------------------------------`);
         console.info(`title : ${mainArticle.title}`)
         console.info(`dateTime : ${mainArticle.dateTime}`)
         console.info(`mediaName : ${mainArticle.mediaName}`)
         console.info(`sourceUrl : ${mainArticle.sourceUrl}`)
         console.info(`content : ${mainArticle.content}`)
      });

      // const filterWords = config.filterWords || [];
      // results = await getArticleContent(results, BotEngine.browser);

      return results;
   }

   public getDetikNews = async (size: number) => {
      let url = `https://rech.detik.com/article-recommendation/wp/-?size=${size}&nocache=1&ids=undefined&acctype=acc-detikcom`;

      await delay(5000);

      const response = await BotEngine.page!.goto(url, {
         waitUntil: 'networkidle0',
      });

      const result = await response?.json();
      return result;
   }

   public getResponseSerializer = async (url: string, endpoint: string): Promise<any> => {
      const newsResponse: Promise<string | object> = new Promise(async (resolve, reject) => {
         BotEngine.page!.on('response', async (response: HTTPResponse) => {
            if (
               response
                  .url()
                  .includes(endpoint)
         ) {
               try {
                  let responseFormatted: string | object;

                  if (response.headers()['content-type']!.includes('text/html')) {
                     responseFormatted = await response.text();
                  } else {
                     responseFormatted = await response.json();
                  }

                  resolve(responseFormatted);
               } catch (error: any) {
                  loggerUtils.logger().error(error);
               }
            }
         });

         loggerUtils.logger().info(`[News Repository] : Go to ${url}...`);
         await BotEngine.page!.goto(url, { waitUntil: 'networkidle2' });
         await delay(5000);
         await BotEngine.page!.content();
         setTimeout(() => {
            reject('[News Repository] : getResponseGeneral timeout');
         }, 5000);
      });

      // const response = await newsResponse;
      // if (typeof response == 'string') {
      //    const afInitDataKeys = JSON.parse(response!.split('AF_initDataKeys =')[1]!.split(';')[0]!.trim().replace(/'/g, '"'));
      //
      //
      // }
      return newsResponse;
   }
}

export default NewsRepository;