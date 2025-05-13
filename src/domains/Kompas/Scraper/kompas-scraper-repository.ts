import { INewsRepository } from '../../../interfaces/news-repository';
import delay from '../../../utils/delay';
import BotEngine from '../../../bot-engine';
import loggerUtils from '../../../utils/logger';
import { Browser, HTTPResponse, Page } from 'puppeteer';
import * as cheerio from 'cheerio';

class KompasRepository implements INewsRepository {
    public getKompasNews = async (searchKey: string): Promise<any> => {
        const maxPages = 3; // jumlah halaman yang ingin discan
        const results: Array<any> = [];
    
        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
            const url = `https://search.kompas.com/search?q=${searchKey}&page=${pageNum}`;
            loggerUtils.logWithFile(`[KompasNews Repository] : go to ${url} page...`);
    
            await BotEngine.page?.goto(url, { waitUntil: 'domcontentloaded' });
    
            const content = await BotEngine.page!.content();
            const $ = cheerio.load(content);
    
            const articles = $('.articleItem');
    
            if (articles.length === 0) {
                console.log(`[PAGE ${pageNum}] Tidak ada artikel ditemukan, berhenti.`);
                break;
            }
    
            for (const el of articles.toArray()) {
                const title = $(el).find('.articleTitle').text().trim();
                const link = $(el).find('.article-link').attr('href') || '';
                const description = $(el).find('.articleLead > p').text().trim();
                const date = $(el).find('.articlePost-date').text().trim();
                const jenis = $(el).find('.articlePost-subtitle').text().trim().toLowerCase();

                if (jenis === 'video') {
                    loggerUtils.logWithFile(`[KompasNews Repository] : melewati artikel video - ${title}`);
                    continue;
                }
    
                let fullText = '';
    
                try {
                    console.time(`Waktu proses link: ${link}`);
                    loggerUtils.logWithFile(`[KompasNews Repository] : membuka link ${link}`);
                    await BotEngine.page?.goto(link, { waitUntil: 'domcontentloaded' });
    
                    const articleContent = await BotEngine.page!.content();
                    const $$ = cheerio.load(articleContent);
    
                    $$('.clearfix p').each((i, p) => {
                        const text = $$(p).text().trim();
                        if (text) {
                            fullText += text + '\n';
                        }
                    });
                    console.timeEnd(`Waktu proses link: ${link}`);
                } catch (err) {
                    console.error(`Gagal mengambil isi dari ${link}:`, err);
                }
    
                results.push({
                    title,
                    link,
                    description,
                    date,
                    platform: 'Kompas',
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
export default KompasRepository;
