import { format, createLogger, transports, Logger } from 'winston';
import writelog from 'writelog';
import moment from 'moment';

const { timestamp, combine, printf, errors } = format;

class LoggerUtils {
   public logger = (): any => {
      const logFormat = printf(
         ({ level, message, timestamp, stack }) =>
            `${timestamp} ${level}: ${stack || message}`,
      );

      return createLogger({
         format: combine(
            format.colorize(),
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            errors({ stack: true }),
            logFormat,
         ),
         transports: [new transports.Console()],
      });
   };

   public logFile = (info: string, filename: string = 'helper'): any => {
      writelog(moment().format('YYYYMMDD') + '.' + filename, info, {
         history: 1000,
      });
   };

   public logWithFile = (
      info: any,
      level: string = 'info',
      fileName: string = 'index',
   ): any => {
      if (info !== '') {
         if (level === 'error') {
            this.logger().error(info);
         } else if (level === 'info') {
            this.logger().info(info);
         } else {
            this.logger().warn(info);
         }

         this.logFile(info, fileName);
      }
   };

   public logFailedUserWithFile = (info: string): any => {
      this.logger().info(info);
      this.logFile(info, 'Fail Scraped User');
   };
}

export default new LoggerUtils();
