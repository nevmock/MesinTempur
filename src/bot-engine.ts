import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha';
import loggerUtils from './utils/logger';
import { Browser, Page } from 'puppeteer';
import { IBotEngine, IBotEngineOptions } from './interfaces/bot-engine-interface';
import {
   TBotInitOptions,
   TChallengeValidateOptions,
   THasSessionOption,
   TWriteCookiesOptions,
} from './types/bot-engine-types';
import jsonfile from 'jsonfile';
import path from 'path';
import accounts from './configs/instagram/instagram-bot-account';
import fs from 'fs';

class BotEngine implements IBotEngine {
   public static browser?: Browser;
   public static page?: Page;
   public static browsers: Array<Browser> = [];
   private options?: TBotInitOptions;

   constructor(options?: TBotInitOptions) {
      this.options = options
   }


   public init = async (): Promise<void> => {
      try {
         puppeteer.use(StealthPlugin());

         // if (this.options) {
         //    this.options?.useRecaptchaSolver ?
         //       puppeteer.use(RecaptchaPlugin({
         //          provider: {
         //             id: '2captcha',
         //             token: process.env.RECAPTCHA_TOKEN, // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
         //          },
         //          visualFeedback: true, // colorize reCAPTCHAs (violet = detected, green = solved)
         //       })) : undefined
         // }

         BotEngine.browser = await puppeteer.launch({
            headless: true,
            // executablePath: 'C:/Users/unomi/AppData/Local/Chromium/Application/chrome.exe',
            // userDataDir: 'C:/Users/unomi/AppData/Local/Google/Chrome/User Data',
            // ignoreDefaultArgs: ['--disable-extensions'],
            args: [
               // '--use-gl=egl',
               // '--no-sandbox',
               // '--profile-directory=Default',
               // '--disable-setuid-sandbox',
               // 'google-chrome-stable',
               // '--force-device-scale-factor=0.5',
               // '--disable-gpu',
               // '--disable-dev-shm-usage',
               // '--no-first-run',
               // '--no-zygote',
               // '--deterministic-fetch',
               // '--disable-features=IsolateOrigins',
               // '--disable-site-isolation-trials',
               // '--disable-blink-features',
               // '--disable-blink-features=AutomationControlled',
               // '--disable-infobars',
               // '--window-size=1920,1080',
               '--start-maximized',
               // `--user-agent="${this.userAgent}"`,
               // '--proxy-server=http://206.192.226.90',
            ],
            // Set true to debug browser
            dumpio: true,
         });

         BotEngine.page = await BotEngine.browser.newPage();

         BotEngine.browsers.push(BotEngine.browser);

         // await this.page.setUserAgent(this.userAgent);

         BotEngine.page?.setDefaultNavigationTimeout(0);

         loggerUtils.logWithFile('Puppeteer is Launching browser...');
      } catch (e: any) {
         loggerUtils.logWithFile(`Bot Engine : ${e.message}`, 'error', 'error')
      }


   };
   public static getSessionsPath = (options: IBotEngineOptions): string => {
      return path.join(
         `./src/sessions/${options.platform}/${accounts[options.botAccountIndex]!.username}.json`
      )
   };
   public static writeCookies = async (writeCookiesOptions: TWriteCookiesOptions): Promise<void> => {
      try {
         const client = await BotEngine.page?.target().createCDPSession();
         console.info(client)
         if (client) {
            // Mengambil semua cookies
            const cookies = (await client.send('Network.getAllCookies')).cookies;

            // Menyimpan cookies dalam file JSON
            jsonfile.writeFileSync(
               path.join(`./src/sessions/${writeCookiesOptions.platform}/${accounts[writeCookiesOptions.botAccountIndex]!.username}.json`),
               cookies,
               { spaces: 2 },
            );

            // Jika kamu ingin juga mengambil sessionStorage atau localStorage
            // Mendapatkan data dari localStorage atau sessionStorage
            const localStorageData = await client.send('Runtime.evaluate', {
               expression: 'window.localStorage',
            });
            const sessionStorageData = await client.send('Runtime.evaluate', {
               expression: 'window.sessionStorage',
            });

            // Menyimpan localStorage dan sessionStorage (jika perlu)
            jsonfile.writeFileSync(
               path.join(`./src/sessions/${writeCookiesOptions.platform}/${accounts[writeCookiesOptions.botAccountIndex]!.username}_localStorage.json`),
               localStorageData.result,
               { spaces: 2 },
            );

            jsonfile.writeFileSync(
               path.join(`./src/sessions/${writeCookiesOptions.platform}/${accounts[writeCookiesOptions.botAccountIndex]!.username}_sessionStorage.json`),
               sessionStorageData.result,
               { spaces: 2 },
            );
         }
      } catch (error: any) {
         loggerUtils.logWithFile(`Write Cookies : ${error.message}`, 'error', 'error');
      }
   };

   public static hasSession = async (hasSessionOption: THasSessionOption): Promise<any> => {
      try {
         loggerUtils.logWithFile(
            `Get sessions file : ${this.getSessionsPath(hasSessionOption)}`,
         );
         const previousSession = fs.existsSync(
            path.join(this.getSessionsPath(hasSessionOption))
         );

         if (previousSession) {
            loggerUtils.logWithFile(`Session file exist : ${path.join(this.getSessionsPath(hasSessionOption))}`);
            const cookiesArr = jsonfile.readFileSync(this.getSessionsPath(hasSessionOption));

            // JSON.parse(JSON.stringify(cookiesArr));
            // console.info(BotEngine.page)
            if (cookiesArr.length !== 0) {
               for (let cookie of cookiesArr) {
                  await this.browser?.setCookie(cookie).then(() => {
                     // console.info('COOKIES SETTT')
                  }).catch((e) => {
                     console.info(e)
                  });
               }
               loggerUtils.logWithFile(
                  'Session file has been loaded in the browser',
               );
               return true;
            }
         } else {
            loggerUtils.logWithFile(`Session file doesn't exist`);
            return false;
         }
      } catch (error: any) {
         loggerUtils.logger().error(`${error} from session`);
         return false;
      }
   };
   public close = async (): Promise<void> => {
      await BotEngine.browser!.close();
   };
}

export default BotEngine;