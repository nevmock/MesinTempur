import OurApp from './app';
import loggerUtils from './utils/logger';
import 'dotenv/config';
import BotEngine from './bot-engine';
import { IncomingMessage, Server, ServerResponse } from 'node:http';

const botEngine = new BotEngine({
   headless: process.env.BOT_HEADLESS == 'false'
});

botEngine.init().then(() => {
   const PORT: number | string = process.env.PORT || 1337;

   const app = new OurApp(PORT);
   const server: Server<typeof IncomingMessage, typeof ServerResponse> | undefined = app?.start()

   process.on('uncaughtException', (err) => {
      // console.info(err)
      // loggerUtils.logger().error(`Server Exception : ${err.message}`);
   });

   process.on('SIGTERM', () => {
      loggerUtils.logger().warn('SIGTERM RECIEVED!');
      server?.close(() => {
         loggerUtils.logger().warn('Process Terminated!');
      });
   });
})
