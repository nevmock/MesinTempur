import logger from './logger';
import writeFailScrapedUser from './writeFailScrapedUser';
import moment from 'moment';
import TErrorInfo from '../interfaces/error-info-interface';

const errorCapture = async (
   page: any,
   service: string,
   info: TErrorInfo,
): Promise<void> => {
   await page.screenshot({
      path: `./error-capture/${service}_${moment()
         .format('YYYY-MM-DD HH;mm;ss')
         .toString()}.jpg`,
   });
   logger.logger().error(info.problem);
   await writeFailScrapedUser(
      info.usernameTarget,
      info.userId,
      info.cursor,
      info.problem,
      null,
   );
};

export default errorCapture;
