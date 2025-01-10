import { Request, Response } from 'express';
import instagramScraperServices from './instagram-scraper-services';
import moment, { Moment } from 'moment';
import delay from '../../../utils/delay';
import { createObjectCsvWriter } from 'csv-writer';
import logger from '../../../utils/logger';
import path from 'path';
import { Sequelize, QueryTypes } from 'sequelize';
import fs from 'fs';
import BotEngine from '../../../bot-engine';
import InstagramRepository from './instagram-repository';
import { getDiffTime } from '../../../utils/feeds';

class InstagramScraperController {

   private failedUserPath: string = path.join(
      './failed_user/' + moment().format('YYYYMMDD') + '.json',
   );

   private sequelize: Sequelize = new Sequelize(
      process.env.DB_NAME!,
      process.env.DB_USERNAME!,
      process.env.DB_PASSWORD!,
      {
         host: process.env.DB_HOST!,
         dialect: 'mysql',
      },
   );

   private instagramService = new instagramScraperServices()
   // private repository: InstagramRepository;

   constructor() {
      // this.instagramService.init();
      // this.repository = new InstagramRepository(BotEngine.page!);
   }

   public dailyScrape = async (
      req: Request,
      res: Response,
   ): Promise<Response> => {
      const instagramClient = new instagramScraperServices();

      /**
       * TARGET FROM tbl_users_scrap_targets
       */
      // const targetRecords: any = await this.sequelize.query(
      //    `SELECT B.ig_username FROM tbl_users_scrap_targets AS A
      //    JOIN tbl_scrap_targets AS B ON B.id_scrap_target = A.id_scrap_target
      //    JOIN tbl_users AS C ON C.id_user = A.id_user
      //    WHERE C.active = 1`,
      //    {
      //       type: QueryTypes.SELECT,
      //    },
      // );

      // let targets = targetRecords.map((obj: any) => obj.ig_username);

      /**
       * CUSTOM TARGET
       */
      const targets: Array<string> = ['teknologi_id'];
      // const targets: Array<string> = [
      //    // '1_sitinurjanah',
      //    // 'kevinirawand',
      //    // // '21.Rafen',
      //    'ganjar_pranowo',
      //    // // '605.ashari',
      //    // 'aagym',
      //    'aniesbaswedan',
      //    // 'aanandipurnama',
      //    // 'dkpp_jabar',
      //    // 'abahkeenan',
      //    // 'dinsosjabar',
      //    // 'Abira_al',
      //    // 'aceppurnama.official',
      //    // 'cakiminow',
      //    // 'achmad.mets',
      //    // 'achmadfahmi.smi',
      //    // 'achmad_nugraha_',
      //    // 'adbangbdg',
      //    // 'adde_ms',
      //    // 'adeuusukaesihofficial2013',
      //    // 'adhe_djinan',
      //    // 'adhit_08',
      //    // 'adibecakk',
      //    // 'adiputra.619',
      //    // 'adityapradanaramadhani',
      //    // 'Adlrr_',
      //    // 'agrydw_',
      //    // 'agusgunawan694',
      //    // 'agussalim7283',
      //    // 'agusyudhoyono',
      //    // 'agus_andi_s',
      //    // 'ahelmani',
      //    // 'ahmadrahmatp',
      //    // 'ahmed_shfdn',
      //    // 'ainurrafiq.kng',
      //    // 'airlanggahartarto_official',
      //    // 'aldoalvaroo',
      //    // 'alexdestevano',
      //    // 'Alfrid22',
      //    // 'alharisjambi',
      //    // 'alin.p.d',
      //    // 'almuktabar_official',
      //    // 'al_ashriyyahnuruliman',
      //    // 'amanatnasional',
      //    // 'ambarwanto27',
      //    // 'andirafiq72',
      // ];

      let botAccountIndex: number = 0;

      let scrapeResults = [];

      let isLogin: boolean = await instagramClient.login();

      while (!isLogin) {
         isLogin = await instagramClient.login();
      }

      console.info(isLogin);
      await delay(5000);

      let dateCriteria: any = moment();
      dateCriteria.subtract(req.body.subtract, 'days');

      for (const target of targets) {
         await delay(5000);

         const scrapeResult = await instagramClient.scrape(
            target,
            dateCriteria,
         );
      }

      // await BotEngine.close();

      return res.status(200).json({
         code: 200,
         status: 'OK',
         data: {
            message: 'Scrape Data Successfully!',
         },
      });
   };

   public failedUserScrape = async (
      req: Request,
      res: Response,
   ): Promise<Response> => {
      console.info(BotEngine.page)
      const instagramClient = new instagramScraperServices();

      await instagramClient.scrapeFailedUser(req.body.filename);

      return res.status(200).json({
         code: 200,
         status: 'OK',
         data: {
            message: 'Scrape Data Successfully!',
         },
      });
   };

   public commentsToCsv = async (
      req: Request,
      res: Response,
   ): Promise<Response> => {

      await this.instagramService.scrapeCommentsToCSV(req.body.yearWanted, req.body.monthWanted)

      logger.logger().info('Scrape Successfuly!');

      return res.status(200).json({
         code: 200,
         status: 'OK',
         data: {
            message: 'OK',
         },
      });
   };

   public urlTypeByUrl = async (
      req: Request,
      res: Response,
   ): Promise<Response> => {
      await this.instagramService.scrapePostByUrl(req.body.username)

      logger.logger().info('Scrape Successfuly!');

      return res.status(200).json({
         code: 200,
         status: 'OK',
         data: {
            message: 'Scrape successfuly!',
         },
      });
   };


   public research = async (req: Request, res: Response): Promise<Response> => {
      let isLogin: boolean = await this.instagramService.login();

      while (!isLogin) {
         isLogin = await this.instagramService.login();
      }

      const result = await this.instagramService.__hashTagMorePageResearch(req.body.tagName, req.body.maxPage, req.body.subtract);

      return res.status(200).json(result);
   };


   // // public scrapeFailedUser = async (
   // //    req: Request,
   // //    res: Response,
   // // ): Promise<Response> => {
   // //    await instagramClient.init();
   // //    const isLogin: boolean = await instagramClient.isLogin();

   // //    if (fs.existsSync(instagramClient.failedUserPath)) {
   // //       const failedUsers: any = fs.readFileSync(this.failedUserPath);

   // //       const users: any = JSON.parse(failedUsers);

   // //       if (isLogin) {
   // //          let dateCriteria: Moment = moment();
   // //          dateCriteria.subtract(req.body.subtract, 'days');

   // //          for (const target of users) {
   // //             try {
   // //                const userInfoRes = await instagramClient.getUserInfo(
   // //                   target.username,
   // //                );

   // //                let page: any;
   // //                let isSign: boolean = false;

   // //                while (!isSign) {
   // //
   // //                   page = await instagramClient.injectUserFeed(
   // //                      userInfoRes.userInfo.user.secUid,
   // //                      target.cursor,
   // //                   );

   // //                   if (
   // //                      typeof page != 'undefined' &&
   // //                      page.data &&
   // //                      page.data.itemList
   // //                   ) {
   // //                      logger.logger().info(`Page signed successfuly!`);
   // //                      isSign = true;
   // //                   } else {
   // //                      logger.logger().info(`Signer Fail, re signing...`);
   // //                      isSign = false;
   // //                   }
   // //                }

   // //                for (const feed of page.data.itemList) {
   // //                   const followerCount: number =
   // //                      instagramClient.setToFloat(
   // //                         userInfoRes.userInfo.stats.followerCount,
   // //                      );

   // //                   const feedCreateTime: Moment = moment(
   // //                      feed.createTime * 1000,
   // //                   );

   // //                   if (
   // //                      feedCreateTime.year() == dateCriteria.year() &&
   // //                      feedCreateTime.month() == dateCriteria.month() &&
   // //                      feedCreateTime.date() == dateCriteria.date()
   // //                   ) {
   // //                      /**
   // //                       * Comment cursor 0
   // //                       */
   // //                      const comments =
   // //                         await instagramClient.getCommentList(
   // //                            target.username,
   // //                            feed.id,
   // //                         );

   // //                      const url: string = `https://www.tiktok.com/@${target.username}/video/${feed.id}`;

   // //                      const viewCount: number =
   // //                         instagramClient.setToFloat(
   // //                            feed.stats.playCount,
   // //                         );

   // //                      const commentCount: number =
   // //                         instagramClient.setToFloat(
   // //                            feed.stats.commentCount,
   // //                         );
   // //                      let responsiveness: number = 0;

   // //                      if (commentCount > 0) {
   // //                         responsiveness =
   // //                            instagramClient.getResponsiveness(
   // //                               target.username,
   // //                               comments,
   // //                            );
   // //
   // //                      }

   // //                      console.info('---------------------------------');
   // //                      console.info(`Taken at : ${feedCreateTime}`);
   // //                      console.info(`Username : ${target.username}`);
   // //                      console.info(`Url : ${url}`);
   // //                      console.info(`Follower : ${followerCount}`);
   // //                      console.info(`Views : ${viewCount}`);
   // //                      console.info(`Comment : ${commentCount}`);
   // //                      console.info(`Response : ${responsiveness}`);
   // //                      console.info('---------------------------------');

   // //                      await db.tbl_scraping.create({
   // //                         tiktok_username: target.username,
   // //                         url: url,
   // //                         follower_count: followerCount,
   // //                         view_count: viewCount,
   // //                         comment_count: commentCount,
   // //                         response_count: responsiveness,
   // //                         taken_at: feedCreateTime,
   // //                      });
   // //                   }
   // //                }

   // //                const usersFail: any = JSON.parse(failedUsers);
   // //                const userDeleted: any = usersFail.filter(
   // //                   (value: any, index: number, arr: any) => {
   // //                      if (
   // //                         value.username === target.username &&
   // //                         value.cursor === target.cursor
   // //                      ) {
   // //                         logger
   // //                            .logger()
   // //                            .info(
   // //                               `Delete ${value.secUid} on cursor ${value.cursor} page from failed list`,
   // //                            );
   // //                         arr.splice(index, 1);

   // //                         fs.writeFileSync(
   // //                            this.failedUserPath,
   // //                            JSON.stringify(arr),
   // //                         );
   // //                         return true;
   // //                      }
   // //                      return false;
   // //                   },
   // //                );
   // //             } catch (error: any) {
   // //                loggerUtils.logWithFile(error.toString(), 'error', 'Error');
   // //             }
   // //          }
   // //       }

   // //       loggerUtils.logger().info(`Scrape Data Successfuly!`);

   // //       await instagramClient.close();

   // //       return res.status(200).json({
   // //          code: 200,
   // //          status: 'OK',
   // //          data: {
   // //             message: 'Scrape Data Successfuly!',
   // //          },
   // //       });
   // //    } else {
   // //       return res.status(404).json({
   // //          code: 404,
   // //          status: 'NOT FOUND',
   // //          data: {
   // //             message: 'FAILED USER FILE NOT FOUND!',
   // //          },
   // //       });
   // //    }
   // // };

   // public urlType = async (req: Request, res: Response): Promise<Response> => {
   //    await instagramClient.init();
   //    const isLogin: boolean = await instagramClient.isLogin();

   //    if (isLogin) {
   //       const currentDate = new Date().toJSON().slice(0, 10);
   //       const csvWriter = createObjectCsvWriter({
   //          path: `./excel/${currentDate}.csv`,
   //          header: [
   //             { id: 'username', title: 'Username' },
   //             { id: 'url', title: 'Url' },
   //             { id: 'type', title: 'Type' },
   //             { id: 'whiteSpace', title: '' },
   //          ],
   //       });

   //       let toCsvData: Array<{
   //          username: string;
   //          url: string;
   //          type: string;
   //       }> = [];

   //       let toCsvCounter: Array<{
   //          carouselCounter: number;
   //          videoCounter: number;
   //          singlePostCounter: number;
   //       }> = [{ carouselCounter: 0, videoCounter: 0, singlePostCounter: 0 }];

   //       const records: any = await this.sequelize.query(
   //          `SELECT url FROM tbl_scraping WHERE tbl_scraping.ig_username = '${req.body.username}' AND taken_at LIKE '%${req.body.yearWanted}-${req.body.monthWanted}%'`,
   //          {
   //             type: QueryTypes.SELECT,
   //          },
   //       );

   //       for (const record of records) {
   //          const shortcode: string = record.url.split('/p/')[1].split('/')[0];

   //          await delay(5000);
   //          const pageInfo: any = await instagramClient.getPageInfo(
   //             shortcode,
   //          );

   //          if (pageInfo.data.shortcode_media !== null) {
   //             let type: string;
   //             if (
   //                pageInfo.data.shortcode_media.__typename === 'GraphSidecar'
   //             ) {
   //                type = 'carousel';
   //                toCsvCounter[0]!.carouselCounter++;
   //             } else if (
   //                pageInfo.data.shortcode_media.__typename === 'GraphVideo'
   //             ) {
   //                type = 'reels';
   //                toCsvCounter[0]!.videoCounter++;
   //             } else {
   //                type = 'single post';
   //                toCsvCounter[0]!.singlePostCounter++;
   //             }
   //             const url: string = `https://www.instagram.com/p/${shortcode}`;
   //             console.info(`--------------------------`);
   //             console.info(`Username: ${req.body.username}`);
   //             console.info(`URL: ${url}`);
   //             console.info(`Type: ${type}`);
   //             console.info(`--------------------------`);

   //             toCsvData.push({
   //                username: req.body.username,
   //                url: url,
   //                type: type,
   //             });
   //          } else {
   //             logger.logger().info(`Post was deleted`);
   //          }
   //       }

   //       await csvWriter.writeRecords(toCsvData).then(() => {
   //          console.log('Done save to excel...');
   //       });
   //    }

   //    logger.logger().info('Scrape Successfuly!');

   //    return res.status(200).json({
   //       code: 200,
   //       status: 'OK',
   //       data: {
   //          message: 'Scrape successfuly!',
   //       },
   //    });
   // };

   // public crawling = async (req: Request, res: Response): Promise<Response> => {
   //    await instagramClient.init();
   //    const isLogin: boolean = await instagramClient.isLogin();

   //    await delay(5000);

   //    if (isLogin) {
   //       const targets: any = await this.sequelize.query(
   //          `SELECT B.ig_username FROM tbl_users_targets AS A
   //          JOIN tbl_targets AS B ON B.id_target = A.id_target
   //          GROUP BY A.id_target;
   //          `,
   //          {
   //             type: QueryTypes.SELECT,
   //          },
   //       );

   //       // const targets = [{ ig_username: 'humas_bandung' }];

   //       for (const target of targets) {
   //          try {
   //             const userInfoRes = await instagramClient.getUserInfo(
   //                target.ig_username,
   //             );

   //             let isNext: boolean = true;
   //             let cursor: string | null = null;

   //             while (isNext) {
   //                try {
   //                   await delay(5000);
   //                   const feeds = await instagramClient.getUserFeeds(
   //                      userInfoRes.data.user.id,
   //                      cursor,
   //                      10,
   //                   );

   //                   if (
   //                      feeds.data.user.edge_owner_to_timeline_media.count != 0
   //                   ) {
   //                      const likeAverage: number =
   //                         instagramClient.getLikeAverage(
   //                            feeds.data.user.edge_owner_to_timeline_media
   //                               .edges,
   //                         );

   //                      let dateCriteria: Moment = moment();
   //                      dateCriteria.subtract(1, 'days');

   //                      cursor =
   //                         feeds.data.user.edge_owner_to_timeline_media
   //                            .page_info.end_cursor;

   //                      for (const feed of feeds.data.user
   //                         .edge_owner_to_timeline_media.edges) {
   //                         const followerCount: number = parseFloat(
   //                            userInfoRes.data.user.edge_followed_by.count,
   //                         );

   //                         let likeCount: number = parseFloat(
   //                            feed.node.edge_media_preview_like.count,
   //                         );

   //                         if (likeCount === -1) {
   //                            const likers =
   //                               await instagramClient.getLikers(
   //                                  feed.node.shortcode,
   //                               );

   //                            likeCount = await likers.data.shortcode_media
   //                               .edge_liked_by.count;
   //                         }

   //                         const feedCreateTime: Moment = moment(
   //                            feed.node.taken_at_timestamp * 1000,
   //                         );

   //                         const isAlreadySaved: boolean =
   //                            await instagramClient.isAlreadySaved(
   //                               target.ig_username,
   //                               feed.node.shortcode,
   //                            );

   //                         if (
   //                            feedCreateTime.year() == dateCriteria.year() &&
   //                            feedCreateTime.month() == dateCriteria.month() &&
   //                            feedCreateTime.date() == dateCriteria.date() &&
   //                            likeCount >= likeAverage
   //                         ) {
   //                            if (!isAlreadySaved) {
   //                               const url: string = `https://instagram.com/p/${feed.node.shortcode}`;

   //                               const caption: string =
   //                                  feed.node.edge_media_to_caption.edges[0]
   //                                     .node.text;

   //                               const timeFrame =
   //                                  await instagramClient.getTimeFrame(
   //                                     feedCreateTime,
   //                                  );

   //                               console.info(
   //                                  '---------------------------------',
   //                               );
   //                               console.info(
   //                                  `Username : ${target.ig_username}`,
   //                               );
   //                               console.info(`Url : ${url}`);
   //                               console.info(`Follower : ${followerCount}`);
   //                               console.info(`Like : ${likeCount}`);
   //                               console.info(`Caption : ${caption}`);
   //                               console.info(`Taken at : ${feedCreateTime}`);
   //                               console.info(`Time Frame : ${timeFrame}`);
   //                               console.info(
   //                                  '---------------------------------',
   //                               );

   //                               await instagramClient.saveToCrawling(
   //                                  String(target.ig_username),
   //                                  url,
   //                                  followerCount,
   //                                  likeCount,
   //                                  String(caption),
   //                                  feedCreateTime,
   //                                  timeFrame,
   //                               );
   //                            } else {
   //                               loggerUtils
   //                                  .logger()
   //                                  .info(`POST ALREADY EXIST IN DB`);
   //                            }
   //                         }
   //                      }

   //                      let lastPostsCreateTime = moment(
   //                         feeds.data.user.edge_owner_to_timeline_media.edges[
   //                            feeds.data.user.edge_owner_to_timeline_media.edges
   //                               .length - 1
   //                         ].node.taken_at_timestamp * 1000,
   //                      );

   //                      isNext =
   //                         lastPostsCreateTime >= dateCriteria &&
   //                         feeds.data.user.edge_owner_to_timeline_media
   //                            .page_info.has_next_page != false &&
   //                         feeds.data.user.edge_owner_to_timeline_media
   //                            .page_info.end_cursor != null &&
   //                         feeds.data.user.edge_owner_to_timeline_media.count !=
   //                            0;

   //                      isNext
   //                         ? logger
   //                              .logger()
   //                              .info(`Getting next page response...`)
   //                         : logger.logger().info(`Page enough`);
   //                   } else {
   //                      loggerUtils.logger().info(`User Feeds Zero`);
   //                      isNext = false;
   //                   }
   //                } catch (error: any) {
   //                   logger
   //                      .logger()
   //                      .error(`${error.toString()} from controller`);
   //                }
   //             }
   //          } catch (error: any) {
   //             loggerUtils.logWithFile(error.toString(), 'error', 'Error');
   //          }
   //       }
   //    }

   //    loggerUtils.logger().info(`Crawling Data Successfuly!`);

   //    await instagramClient.close();

   //    return res.status(200).json({
   //       code: 200,
   //       status: 'OK',
   //       data: {
   //          message: 'Crawling Successfuly!',
   //       },
   //    });
   // };

   // public scrape = async (req: Request, res: Response): Promise<Response> => {
   //    await instagramClient.init();
   //    const isLogin: boolean = await instagramClient.isLogin();

   //    if (isLogin) {
   //       const targets: Array<string> = ['asumsico'];

   //       let dateCriteria: Moment = moment();
   //       dateCriteria.subtract(req.body.subtract, 'days');

   //       for (const target of targets) {
   //          try {
   //             const userInfoRes = await instagramClient.getUserInfo(
   //                target,
   //             );

   //             let isNext: boolean = true;
   //             let cursor: string | null = null;

   //             while (isNext) {
   //                try {
   //                   await delay(5000);
   //                   const feeds = await instagramClient.getUserFeeds(
   //                      userInfoRes.data.user.id,
   //                      cursor,
   //                   );

   //                   let feedOnPageCount: number =
   //                      feeds.data.user.edge_owner_to_timeline_media.edges
   //                         .length;

   //                   cursor =
   //                      feeds.data.user.edge_owner_to_timeline_media.page_info
   //                         .end_cursor;

   //                   for (const feed of feeds.data.user
   //                      .edge_owner_to_timeline_media.edges) {
   //                      const followerCount: number = parseFloat(
   //                         userInfoRes.data.user.edge_followed_by.count,
   //                      );

   //                      const feedCreateTime: Moment = moment(
   //                         feed.node.taken_at_timestamp * 1000,
   //                      );

   //                      if (
   //                         feedCreateTime.year() == dateCriteria.year() &&
   //                         feedCreateTime.month() == dateCriteria.month() &&
   //                         feedCreateTime.date() == dateCriteria.date()
   //                      ) {
   //                         const url: string = `https://instagram.com/p/${feed.node.shortcode}`;

   //                         let likeCount: number = parseFloat(
   //                            feed.node.edge_media_preview_like.count,
   //                         );

   //                         if (likeCount === -1) {
   //                            const likers =
   //                               await instagramClient.getLikers(
   //                                  feed.node.shortcode,
   //                               );

   //                            likeCount = await likers.data.shortcode_media
   //                               .edge_liked_by.count;
   //                         }

   //                         const commentCount: number = parseFloat(
   //                            feed.node.edge_media_to_comment.count,
   //                         );

   //                         let responsiveness: number = 0;

   //                         if (commentCount > 0) {
   //                            /**
   //                             * Comment cursor 0
   //                             */
   //                            // const comments =
   //                            //    await instagramClient.getCommentList(
   //                            //       feed.node.shortcode,
   //                            //       null,
   //                            //    );

   //                            responsiveness =
   //                               await instagramClient.getResponsiveness(
   //                                  feed.node.shortcode,
   //                                  null,
   //                               );
   //                         }

   //                         console.info('---------------------------------');
   //                         console.info(`Username : ${target}`);
   //                         console.info(`Url : ${url}`);
   //                         console.info(`Follower : ${followerCount}`);
   //                         console.info(`Like : ${likeCount}`);
   //                         console.info(`Comment : ${commentCount}`);
   //                         console.info(`Response : ${responsiveness}`);
   //                         console.info(`Taken at : ${feedCreateTime}`);
   //                         console.info('---------------------------------');
   //                      }
   //                   }

   //                   // if (fs.existsSync(this.failedUserPath)) {
   //                   //    const failedUsers: any = fs.readFileSync(
   //                   //       this.failedUserPath,
   //                   //    );

   //                   //    const users: any = JSON.parse(failedUsers);

   //                   //    const userDeleted: any = users.filter(
   //                   //       (value: any, index: number, arr: any) => {
   //                   //          if (
   //                   //             value.username === target &&
   //                   //             value.cursor === cursor
   //                   //          ) {
   //                   //             logger
   //                   //                .logger()
   //                   //                .info(
   //                   //                   `Delete ${value.secUid} on cursor ${value.cursor} page from failed list`,
   //                   //                );
   //                   //             arr.splice(index, 1);
   //                   //             fs.writeFileSync(
   //                   //                this.failedUserPath,
   //                   //                JSON.stringify(arr),
   //                   //             );
   //                   //             return true;
   //                   //          }
   //                   //          return false;
   //                   //       },
   //                   //    );
   //                   // }
   //                   let lastPostsCreateTime = moment(
   //                      feeds.data.user.edge_owner_to_timeline_media.edges[
   //                         feedOnPageCount - 1
   //                      ].node.taken_at_timestamp * 1000,
   //                   );

   //                   isNext = lastPostsCreateTime >= dateCriteria;

   //                   isNext
   //                      ? logger.logger().info(`Getting next page response...`)
   //                      : logger.logger().info(`Page enough`);
   //                } catch (error: any) {
   //                   logger
   //                      .logger()
   //                      .error(`${error.toString()} from controller`);
   //                }
   //             }
   //          } catch (error: any) {
   //             loggerUtils.logWithFile(error.toString(), 'error', 'Error');
   //          }
   //       }
   //    }

   //    loggerUtils.logger().info(`Scrape Data Successfuly!`);

   //    await instagramClient.close();

   //    return res.status(200).json({
   //       code: 200,
   //       status: 'OK',
   //       data: {
   //          message: 'Scrape Data Successfuly!',
   //       },
   //    });
   // };

   // public researchHghlight = async (
   //    req: Request,
   //    res: Response,
   // ): Promise<Response> => {
   //    await instagramClient.init();
   //    const isLogin: boolean = await instagramClient.isLogin();

   //    if (isLogin) {
   //       const usernameTargets: Array<string> = ['asumsico'];

   //       for (const user of usernameTargets) {
   //          const userInfo = await instagramClient.getUserInfo(user);

   //          const highlights = await instagramClient.getUserHighlight(
   //             userInfo.data.user.id,
   //          );

   //          for (const highlight of highlights.data.user.edge_highlight_reels
   //             .edges) {
   //             const highlightDetail =
   //                await instagramClient.getDetailUserHighlight(
   //                   highlight.node.id,
   //                );

   //             console.info(`ID : ${highlight.node.id}`);
   //             console.info(`LIKERS : ${highlight.node.likers.length}`);
   //             console.info(`LIKERS : ${highlight.node.likers.length}`);
   //             console.info(`CAPTION : ${highlight.node.caption}`);
   //          }

   //          // const userFeeds = await instagramClient.getUserFeeds(
   //          //    userInfo.data.user.id,
   //          //    null,
   //          // );

   //          // const result = await instagramClient.getFollowers(
   //          //    userInfo.data.user.id,
   //          //    null,
   //          // );
   //          // loggerUtils.logFile(result, 'TEST PRIVATE USER FOLLOWER LIST');

   //          /**
   //           * @section GET FOLLOWERS WITH CURSOR
   //           */
   //          // let nextMaxId: string | null = null;
   //          // let isNext: boolean = true;

   //          // while (isNext) {
   //          //    const result = await instagramClient.getFollowers(
   //          //       userInfo.data.user.id,
   //          //       nextMaxId,
   //          //    );
   //          //    console.info(`----------------------`);
   //          //    console.info(result.users.length);
   //          //    console.info(result.page_size);
   //          //    console.info(result.next_max_id);
   //          //    console.info(result.has_more);
   //          //    console.info(`----------------------`);

   //          //    for (const userFollowing of result.users) {
   //          //       console.info(userFollowing.full_name);
   //          //    }

   //          //    nextMaxId = result.next_max_id;

   //          //    isNext = typeof result.next_max_id == 'string';
   //          // }

   //          /**
   //           * @section GET FOLLOWING
   //           */
   //          // const followingUsers = await instagramClient.getFollowing(
   //          //    userInfo.data.user.id,
   //          //    null,
   //          // );

   //          // for (const userFollowing of followingUsers.users) {
   //          //    console.info(userFollowing.full_name);
   //          // }
   //       }
   //    }
   //    return res.status(200);
   // };

   // public researchLikers = async (
   //    req: Request,
   //    res: Response,
   // ): Promise<Response> => {
   //    await instagramClient.init();
   //    const isLogin: boolean = await instagramClient.isLogin();

   //    const targets: Array<string> = ['humas_bandung'];

   //    if (isLogin) {
   //       const userInfoRes = await instagramClient.getUserInfo(
   //          targets[0]!,
   //       );
   //       const likers = await instagramClient.getLikers(
   //          'CxCPySWPWRx',
   //          1,
   //       );

   //       const feedHiddenLiker = await instagramClient.getUserFeeds(
   //          userInfoRes.data.user.id,
   //          null,
   //       );
   //       loggerUtils.logFile(feedHiddenLiker, 'DEBUGG HIDDEN LIKERS');

   //       await delay(60000);
   //    }
   //    return res.status(200);
   // };
}

export default new InstagramScraperController();
