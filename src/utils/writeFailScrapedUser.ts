import fs from 'fs';
import path from 'path';
import moment from 'moment';
import logger from './logger';

const writeFailScrapedUser = async (
   username: string,
   userId: string | null,
   cursor: string | null,
   problem: string,
   dateCriteria?: any,
): Promise<void> => {
   const failedUserPath: string = path.join(
      './failed_user/' + moment().format('YYYYMMDD') + '.json',
   );

   if (fs.existsSync(failedUserPath)) {
      const failedUsers: any = fs.readFileSync(failedUserPath);
      // console.info(JSON.parse(failedUsers));

      let isWrited: boolean = false;
      for (const user of JSON.parse(failedUsers)) {
         // cursor selanjutnya (value cursor saat ini) berubah setiap scrape cursor pertama
         // if (user.userId === userId && user.cursor === cursor) {
         //    isWrited = true;
         // }

         if (user.username === username) {
            isWrited = true;
         }
      }

      if (!isWrited) {
         logger.logWithFile(
            `Write ${username} | ${userId} | ${cursor} as Fail Scraped User`,
         );
         let data: any = JSON.parse(failedUsers);

         data.push({
            username: username,
            userId: userId,
            cursor: cursor,
            problem: problem,
            dateCriteria: dateCriteria,
         });

         fs.writeFileSync(failedUserPath, JSON.stringify(data));
      }
   } else {
      fs.writeFileSync(
         failedUserPath,
         JSON.stringify([
            {
               username: username,
               userId: userId,
               cursor: cursor,
               problem: problem,
               dateCriteria: dateCriteria,
            },
         ]),
      );
   }
};

export default writeFailScrapedUser;
