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
import { getSessionsPath } from './utils/sessions';

class BotEngine implements IBotEngine {
   public static browser?: Browser;
   public static page?: Page;
   public static browsers: Array<Browser> = [];
   private options?: TBotInitOptions;

   constructor(options?: TBotInitOptions) {
      this.options= options
   }


   public init = async (): Promise<void> => {
      try {
         puppeteer.use(StealthPlugin());

         if (this.options) {
            this.options?.useRecaptchaSolver ?
               puppeteer.use(RecaptchaPlugin({
                  provider: {
                     id: '2captcha',
                     token: process.env.RECAPTCHA_TOKEN, // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
                  },
                  visualFeedback: true, // colorize reCAPTCHAs (violet = detected, green = solved)
               })) : undefined
         }

         BotEngine.browser = await puppeteer.launch({
            headless: this.options?.headless || false,
            executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
            // ignoreDefaultArgs: ['--disable-extensions'],
            args: [
               '--use-gl=egl',
               '--no-sandbox',
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
               // '--start-maximized',
               // `--user-agent="${this.userAgent}"`,
               // '--proxy-server=http://206.192.226.90',
            ],
            // Set true to debug browser
            dumpio: false,
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
   public getSessionsPath = (options: IBotEngineOptions): string => {
      return path.join(
         `./src/sessions/${options.platform}/${accounts[options.botAccountIndex]!.username}.json`
      )
   };
   public static writeCookies = async (writeCookiesOptions: TWriteCookiesOptions): Promise<void> => {
      try {
         const client = await BotEngine.page?.target().createCDPSession();
         if (client) {
            const cookies = (await client.send('Network.getAllCookies')).cookies;
            // const cookiesObject = await this.page._client.send(
            //    'Network.getAllCookies',
            // );

            jsonfile.writeFileSync(
               path.join(`./src/sessions/${writeCookiesOptions.platform}/${accounts[writeCookiesOptions.botAccountIndex]!.username}.json`),
               cookies,
               { spaces: 2 },
            );
         }
      } catch (error: any) {
         loggerUtils.logWithFile(`Write Cookies : ${error.message}`, 'error', 'error');
      }
   };
   public static hasSession = async (hasSessionOption: THasSessionOption): Promise<boolean> => {
      try {
         loggerUtils.logWithFile(
            `Get sessions file : ${getSessionsPath(hasSessionOption)}`,
         );
         const previousSession = fs.existsSync(
            path.join(getSessionsPath(hasSessionOption))
         );

         if (previousSession) {
            loggerUtils.logWithFile(`Session file exist`);
            const cookiesArr = jsonfile.readFileSync(getSessionsPath(hasSessionOption));

            // JSON.parse(JSON.stringify(cookiesArr));

            if (cookiesArr.length !== 0) {
               for (let cookie of cookiesArr) {
                  await BotEngine.page?.setCookie(cookie);
               }
               loggerUtils.logWithFile(
                  'Session file has been loaded in the browser',
               );
               return true;
            }
         }

         loggerUtils.logWithFile(`Session file doesn't exist`);
         return false;
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