import { INewsRepository } from '../../../interfaces/news-repository';
import delay from '../../../utils/delay';
import BotEngine from '../../../bot-engine';
import loggerUtils from '../../../utils/logger';
import { Browser, HTTPResponse, Page } from 'puppeteer';
import googleNewsScraper from 'google-news-scraper';
import * as cheerio from 'cheerio';
import GoogleNewsUtils from '../../../utils/googleNews';
import { BasicAcceptedElems } from 'cheerio';
import moment, { max } from 'moment';

class DetikRepository implements INewsRepository {
    public getDetikNews = async (searchKey: string): Promise<any> => {
        const maxPages = 1; // jumlah halaman yang ingin discan
        const results: Array<any> = [];
    
        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
            const url = `https://www.detik.com/search/searchall?query=${searchKey}&page=${pageNum}&result_type=relevansi`;
            loggerUtils.logWithFile(`[DetikNews Repository] : go to ${url} page...`);
    
            await BotEngine.page?.goto(url, { waitUntil: 'load' });
    
            const content = await BotEngine.page!.content();
            const $ = cheerio.load(content);
    
            const articles = $('article.list-content__item');
    
            if (articles.length === 0) {
                console.log(`[PAGE ${pageNum}] Tidak ada artikel ditemukan, berhenti.`);
                break;
            }
    
            for (const el of articles.toArray()) {
                const title = $(el).find('.media__title a').text().trim();
                const link = $(el).find('.media__title a').attr('href') || '';
                const description = $(el).find('.media__desc').text().trim();
                const date = $(el).find('.media__date span').attr('title') || '';
    
                let fullText = '';
    
                try {
                    loggerUtils.logWithFile(`[DetikNews Repository] : membuka link ${link}`);
                    await BotEngine.page?.goto(link, { waitUntil: 'load' });
    
                    const articleContent = await BotEngine.page!.content();
                    const $$ = cheerio.load(articleContent);
    
                    $$('.detail__body-text.itp_bodycontent p').each((i, p) => {
                        fullText += $$(p).text().trim() + '\n';
                    });
                } catch (err) {
                    console.error(`Gagal mengambil isi dari ${link}:`, err);
                }
    
                results.push({
                    title,
                    link,
                    description,
                    date,
                    platform: 'Detik',
                    fullText: fullText.trim(),
                });
            }
        }
    
        return results;
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
        return newsResponse;
    }
}
export default DetikRepository;
