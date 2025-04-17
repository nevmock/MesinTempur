import 'dotenv/config';
import loggerUtils from '../../../utils/logger';
import accounts from '../../../configs/instagram/instagram-bot-account';
import path from 'path';
import fs from 'fs';
import Taccount from '../../../interfaces/instagram-account-interface';
import logger from '../../../utils/logger';
import db from '../../../models';
import { Op } from 'sequelize';
import delay from '../../../utils/delay';
import moment, { Moment } from 'moment';
import errorCapture from '../../../utils/errorCapture';
import BotEngine from '../../../bot-engine';
import InstagramRapidRepository from './instagram-rapid-repository';
import { getDiffTime } from '../../../utils/feeds';
import { createObjectCsvWriter } from 'csv-writer';
import OurApp from '../../../app';
import { TChallengeValidateOptions } from '../../../types/bot-engine-types';

class InstagramRapidServices {
   private BASE_URL: string = 'https://instagram.com/';
   private botAccountIndex: number = 0;
   private botAccount: Taccount = accounts[this.botAccountIndex]!;
   private hasSession: boolean = false;
   private userAgent: string =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 12_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 105.0.0.11.118 (iPhone11,8; iOS 12_3_1; en_US; en-US; scale=2.00; 828x1792; 165586599)';

   private repository: InstagramRapidRepository ;

   constructor() {
      this.repository = new InstagramRapidRepository();
   }

   public challengeValidate = async (): Promise<void> => {
      await BotEngine.page?.on('response', async (response: any) => {
         if (response.status == '401') {
            // accounts[this.botAccountIndex]!.username
            fs.unlink(
               path.join(`./src/sessions/instagram/${accounts[this.botAccountIndex]!.username}.json`),
               (err: any) => {
                  if (err) {
                     loggerUtils.logWithFile(
                        `Delete session error : ${err}`,
                        'error',
                        'Error',
                     );
                  }
               },
            );
         }
         if (
            response
               .url()
               .includes(
                  `https://www.instagram.com/api/v1/challenge/web/action/`,
               )
         ) {
            try {
               const challengeShowed = await response.json();

               loggerUtils.logWithFile(
                  `[CHALLENGE] ${challengeShowed.challengeType} : ${challengeShowed?.originalResponse.extraData?.content[0]?.banner_text} | ${challengeShowed?.originalResponse.extraData?.content[1]?.title} | ${challengeShowed?.originalResponse.extraData?.content[2]?.text}`,
                  'error',
                  'Error',
               );

               // await BotEngine.page.waitForNavigation();
               // await this.init();
               // BotEngine.page = await this.browser.newPage();
               // await BotEngine.page.waitForNavigation();
               // await BotEngine.page.goto('https://www.google.com/');
               // await delay(30000);

               // BotEngine.page = await this.browser.newPage();
               // if (this.browsers.length) {
               //    for (let browser of this.browsers) {
               //       await browser.close();
               //    }
               // }
               // await this.init();

               // await this.autoSwitchAccount();

               //return challengeShowed;
               // return {
               //    originalResponse: challengeShowed,
               //    challengeType: 'Security Code',
               //    handleWorks: 'Relogin, switch account',
               // };
               loggerUtils.logFile(
                  challengeShowed,
                  '[CHALLENGE] Security Code',
               );
               // console.info(challengeResponse);
               // return challengeResponse;
            } catch (error: any) {
               loggerUtils.logWithFile(
                  `[CHALLENGE] Try get invalid format SelectVerificationMethodForm challenge response | ${error}`,
                  'error',
                  'Error',
               );
            }
         } else if (
            response
               .url()
               .includes(`https://www.instagram.com/api/v1/challenge/web/?next`)
         ) {
            try {
               const challengeShowed = await response.json();

               // const solve = new solver({
               //    page: BotEngine.page,
               //    apiKey: 'PFG57FZ2EATUWFIK3RNOETO46TJL6E7M',
               //    maxRetries: 10,
               // });

               // await solve.solve();

               // await solve(BotEngine.page, { retry: 5, delay: 3000 });
               // await BotEngine.page.goto('https://www.google.com/');
               // await delay(30000);

               // if (this.browsers.length) {
               //    for (let browser of this.browsers) {
               //       await browser.close();
               //    }
               // }
               // await this.init();

               // await this.autoSwitchAccount();
               // await BotEngine.page.solveRecaptchas();

               // const secretKey = '6Lc9qjcUAAAAADTnJq5kJMjN9aD1lxpRLMnCS2TR';

               // const query = stringify({
               //    secret: secretKey,
               //    response: '6LdpvDEUAAAAAMy8x0y8PS99j4BavfO2oBdVTQGZ',
               //    remoteip: response.remoteAddress(),
               // });

               // const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${responseKey}`;

               // // Make a request to verifyURL
               // const body = await fetch(verifyURL).then((res) => res.json());

               // console.info(`THIS RESPONSEEEE`);
               // console.info(body);

               // // If not successful
               // if (body.success !== undefined && !body.success) {
               //    console.info(`FAILL PASSS`);
               // } else {
               //    console.info(body);
               //    console.info(`SUCCESS PASS`);
               // }

               loggerUtils.logWithFile(
                  `[CHALLENGE] ${challengeShowed.challengeType}`,
                  'error',
                  'Error',
               );

               // await BotEngine.page.waitForNavigation();
               // await this.autoSwitchAccount();

               //return challengeShowed;
               // return {
               //    originalResponse: challengeShowed,
               //    challengeType: 'Recaptcha Checkbox',
               //    handleWorks: 'BELUM',
               // };
               loggerUtils.logFile(
                  challengeShowed,
                  '[CHALLENGE] Recaptcha Checkbox',
               );
               // console.info(challengeResponse);
               // return challengeResponse;
            } catch (error: any) {
               loggerUtils.logWithFile(
                  `[CHALLENGE] Try get invalid format RecaptchaRestrictChallengeForm challenge response | ${error}`,
                  'error',
                  'Error',
               );
            }
         }
      });

      // await delay(30000 * 30);
   };
   public login = async (nextAccount: boolean = false): Promise<boolean> => {
      if (nextAccount) {
         if (this.botAccountIndex === accounts.length - 1) {
            this.botAccountIndex = 0;
         } else {
            this.botAccountIndex++;
         }
         loggerUtils.logWithFile(
            `[Switching Bot Account] Now using ${
               accounts[this.botAccountIndex]!.username
            } | ${accounts[this.botAccountIndex]!.password} | ${
               accounts[this.botAccountIndex]!.status
            }`,
         );
      }

      try {
         await BotEngine.page!.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
         );
         // await this.challengeValidate();

         // await BotEngine.page!.setUserAgent(
         //    `Instagram 126.0.0.25.121 Android (23/6.0.1; 320dpi; 720x1280; samsung; SM-A310F; a3xelte; samsungexynos7580; en_GB; 110937453)`,
         // );

         const hasSession = await BotEngine.hasSession({platform: 'instagram', botAccountIndex: this.botAccountIndex});
         if (hasSession) {
            return true;
         }

         logger
            .logger()
            .info(
               `Trying login to ${accounts[this.botAccountIndex]!.username}:${
                  accounts[this.botAccountIndex]!.password
               }...`,
            );

         await BotEngine.page!.goto(`https://www.instagram.com/accounts/login/`, {
            waitUntil: 'load',
         });


         await BotEngine.page!.type(
            'input[name="username"]',
            accounts[this.botAccountIndex]!.username,
            {
               delay: 120,
            },
         );
         await BotEngine.page!.type(
            'input[name="password"]',
            accounts[this.botAccountIndex]!.password,
            {
               delay: 130,
            },
         );
         await BotEngine.page!.click('button[type="submit"]');
         await delay(20000);
         await BotEngine.writeCookies({platform: 'instagram', botAccountIndex: this.botAccountIndex});

         // await BotEngine.page!.waitForNavigation({ waitUntil: 'load' });

         loggerUtils.logWithFile(
            `Logged In with ${accounts[this.botAccountIndex]!.username} | ${
               accounts[this.botAccountIndex]!.password
            } | ${accounts[this.botAccountIndex]!.status}`,
         );
         setTimeout(() => {
            loggerUtils.logFile(`Login Timeout`);
            return false;
         }, 30000);
         return true;
      } catch (e: any) {
         loggerUtils.logWithFile(
            `[Auth Error] Login Error : ${e}`,
            'error',
            'Error',
         );
         return false;
      }
   };
   public isLogin = async (): Promise<boolean> => {
      const hasSession = await BotEngine.hasSession({platform: 'instagram', botAccountIndex: this.botAccountIndex});
      if (!hasSession) {
         loggerUtils.logWithFile(`Cannot read session file`);
         const isLogin = await this.login();
         if (!isLogin) {
            logger.logger().error('Login failed');
            return false;
         }
      }
      return true;
   };
   public autoSwitchAccount = async () => {
      if (this.botAccountIndex === accounts.length - 1) {
         this.botAccountIndex = 0;
      } else {
         this.botAccountIndex++;
      }
      loggerUtils.logWithFile(
         `[Switching Bot Account] Now using ${
            accounts[this.botAccountIndex]!.username
         } | ${accounts[this.botAccountIndex]!.password} | ${
            accounts[this.botAccountIndex]!.status
         }`,
      );

      let isLogin: boolean = await this.login();

      while (!isLogin) {
         isLogin = await this.login();
      }
   };
   public test = async (): Promise<any> => {
      let responsiveness = 0;
      let commentsCursor = null;

      do {
         let comments: any = await this.repository.getCommentList(
            'C2W1lyqy5rD',
            commentsCursor,
         );

         while (comments.status === 'fail') {
            loggerUtils.logWithFile(
               `[SESSION LOST] Get Comment List fail | ${
                  comments.message
               } | Required Login | On Shortcode : ${'C2W1lyqy5rD'} | Comment Cursor : ${commentsCursor} `,
            );
            await this.autoSwitchAccount();

            comments = await this.repository.getCommentList('C2W1lyqy5rD', commentsCursor);
         }

         await delay(5000);

         for (const comment of comments.data.shortcode_media
            .edge_media_to_parent_comment.edges) {
            let commentResponsiveness = this.getCommentResponsiveness(
               comment,
               'awreceh.id',
            );

            responsiveness += commentResponsiveness;

            if (comment.node?.edge_threaded_comments.count > 0) {
               let replyCursor: string | null = null;
               let i: number = 0;
               do {
                  await delay(5000);
                  let replyes = await this.repository.getReplyCommentList(
                     comment.node.id,
                     replyCursor,
                  );

                  while (replyes.status === 'fail') {
                     loggerUtils.logWithFile(
                        `[SESSION LOST] Get Reply Comment List fail | ${replyes.message} | Required Login | On Comment ID : ${comment.node.id} | Reply Cursor : ${replyCursor} `,
                     );
                     await this.autoSwitchAccount();

                     replyes = await this.repository.getReplyCommentList(
                        comment.node.id,
                        replyCursor,
                     );
                  }

                  for (const reply of replyes.data.comment
                     .edge_threaded_comments.edges) {
                     if (reply.node.owner?.username === 'awreceh.id') {
                        responsiveness++;
                     }
                  }

                  replyCursor =
                     replyes.data.comment.edge_threaded_comments.page_info
                        .end_cursor;

                  i++;
               } while (i < 10 && replyCursor != null);
            }
         }

         commentsCursor =
            comments.data.shortcode_media.edge_media_to_parent_comment.page_info
               .end_cursor;

         console.info(`CURSOR COMMENT : ${commentsCursor}`);
      } while (commentsCursor != null);

      return responsiveness;
   };
   public getCommentResponsiveness = (
      comment: any,
      username: string,
   ): number => {
      let responsivenessCount: number = 0;
      if (comment.node.owner?.username === username) {
         responsivenessCount++;
      }

      return responsivenessCount;
   };
   public getCrawlingTargets = async (): Promise<any> => {
      const result = await db.tbl_users_targets.findAll({
         include: [{ model: db.tbl_targets, as: 'tbl_targets' }],
      });

      return result;
   };
   public isAlreadySaved = async (
      username: string,
      shortcode: string,
   ): Promise<boolean> => {
      const userData = await db.tbl_crawling.findAll({
         where: {
            ig_username: username,
            url: {
               [Op.like]: `%${shortcode}`,
            },
         },
      });

      if (userData.length) return true;
      return false;
   };

   public isPostByHashtagAlreadySaved = async (
      shortcode: string,
   ): Promise<boolean> => {
      const userData = await db.tbl_spider_raw.findAll({
         where: {
            source_url: {
               [Op.like]: `%${shortcode}`,
            },
         },
      });

      if (userData.length) return true;
      return false;
   };

   public getLikeAverage = (feeds: any): number => {
      let likeSum: number = 0;

      for (const feed of feeds) {
         likeSum += feed.node.edge_media_preview_like.count;
      }

      return likeSum / feeds.length;
   };

   public getTimeFrame = async (time: any): Promise<number> => {
      if (
         time.hours() >= 2 &&
         time.minute() >= 0 &&
         time.hours() <= 7 &&
         time.minute() <= 59
      ) {
         return 1;
      }
      //08:00 - 12:59
      else if (
         time.hours() >= 8 &&
         time.minute() >= 0 &&
         time.hours() <= 12 &&
         time.minute() <= 59
      ) {
         return 2;
      }
      //13:00 - 15:59
      else if (
         time.hours() >= 13 &&
         time.minute() >= 0 &&
         time.hours() <= 15 &&
         time.minute() <= 59
      ) {
         return 3;
      }
      //16:00 - 17:59
      else if (
         time.hours() >= 16 &&
         time.minute() >= 0 &&
         time.hours() <= 17 &&
         time.minute() <= 59
      ) {
         return 4;
      }
      //18:00 - 21:59
      else if (
         time.hours() >= 18 &&
         time.minute() >= 0 &&
         time.hours() <= 21 &&
         time.minute() <= 59
      ) {
         return 5;
      } else {
         return 6;
      }
   };

   public saveToCrawling = async (
      username: string,
      url: string,
      followerCount: number,
      likeCount: number,
      caption: string,
      feedCreateTime: any,
      timeFrame: number,
   ): Promise<any> => {
      const userTarget = await db.tbl_crawling.create({
         ig_username: username,
         url: url,
         follower_count: followerCount,
         like_count: likeCount,
         caption_text: caption,
         taken_at: feedCreateTime,
         time_frame: timeFrame,
      });
   };

   public saveToSpiderRaw = async (
      datetime: string | Moment,
      username: string,
      postUrl: string,
      caption: string,
   ): Promise<any> => {
      const alreadySave: boolean = await this.isPostByHashtagAlreadySaved(postUrl.split('/')[2]!);

      if (!alreadySave) {
         await db.tbl_spider_raw.create({
            date_time: datetime,
            media_name: username,
            source_url: postUrl,
            title: caption,
            content: '-',
            platform: 'instagram',
            
         });
      }
   };

   public scrape = async (target: string, dateCriteria: any): Promise<any> => {
      let scrapeResult: Array<any> = [];

      try {
         const userInfoRes = await this.repository.getUserInfo(target);

         if (userInfoRes.error) {
            // await BotEngine.page!.screenshot({
            //    path: `./error-capture/getUserInfo_${moment()
            //       .format('YYYY-MM-DD HH;mm;ss')
            //       .toString()}.jpg`,
            // });
            // logger.logger().error(userInfoRes.error.message);
            // await writeFailScrapedUser(
            //    target,
            //    null,
            //    null,
            //    userInfoRes.error.message,
            //    null,
            // );

            await errorCapture(BotEngine.page, 'getUserInfo', {
               usernameTarget: target,
               userId: null,
               cursor: null,
               commentCursor: null,
               replyCursor: null,
               problem: userInfoRes.error.message,
               dateCriteria: dateCriteria,
            });
         } else {
            let isNext: boolean = true;
            let cursor: string | null = null;
            while (isNext) {
               try {
                  await delay(5000);
                  const feeds = await this.repository.getUserFeeds(
                     userInfoRes.data.user.id,
                     cursor,
                  );

                  if (feeds.error) {
                     const failInfo: string = `[Page Not Response] ${feeds.error.code} : ${feeds.error.message} | User ID : ${userInfoRes.data.user.id} on Cursor : ${cursor}`;
                     loggerUtils.logWithFile(failInfo);

                     isNext = false;
                     logger.logFailedUserWithFile(failInfo);
                     // await writeFailScrapedUser(
                     //    target,
                     //    userInfoRes.data.user.id,
                     //    cursor,
                     //    failInfo,
                     //    dateCriteria,
                     // );
                     await errorCapture(BotEngine.page, 'getUserFeeds', {
                        usernameTarget: target,
                        userId: userInfoRes.data.user.id,
                        cursor: cursor,
                        commentCursor: null,
                        replyCursor: null,
                        problem: feeds.error.message,
                        dateCriteria: dateCriteria,
                     });
                  } else {
                     let feedOnPageCount: number =
                        feeds.data.user.edge_owner_to_timeline_media.edges
                           .length;
                     if (feedOnPageCount != 0) {
                        cursor =
                           feeds.data.user.edge_owner_to_timeline_media
                              .page_info.end_cursor;

                        for (const feed of feeds.data.user
                           .edge_owner_to_timeline_media.edges) {
                           const followerCount: number = parseFloat(
                              userInfoRes.data.user.edge_followed_by.count,
                           );

                           const feedCreateTime: any = moment(
                              feed.node.taken_at_timestamp * 1000,
                           );

                           if (
                              feedCreateTime.year() == dateCriteria.year() &&
                              feedCreateTime.month() == dateCriteria.month() &&
                              feedCreateTime.date() == dateCriteria.date()
                           ) {
                              const url: string = `https://instagram.com/p/${feed.node.shortcode}`;

                              let likeCount: number = parseFloat(
                                 feed.node.edge_media_preview_like.count,
                              );

                              if (likeCount === -1) {
                                 const likers = await this.repository.getLikers(
                                    feed.node.shortcode,
                                 );

                                 likeCount = await likers.data.shortcode_media
                                    .edge_liked_by.count;
                              }

                              const commentCount: number = parseFloat(
                                 feed.node.edge_media_to_comment.count,
                              );

                              let responsiveness: number = 0;

                              if (commentCount > 0) {
                                 let commentsCursor: string | null = null;

                                 do {
                                    let comments: any =
                                       await this.repository.getCommentList(
                                          feed.node.shortcode,
                                          commentsCursor,
                                       );

                                    while (comments.status === 'fail') {
                                       loggerUtils.logWithFile(
                                          `[SESSION LOST] Get Comment List fail | ${comments.message} | Required Login | On Shortcode : ${feed.node.shortcode} | Comment Cursor : ${commentsCursor} `,
                                       );
                                       await errorCapture(
                                          BotEngine.page,
                                          'getCommentList',
                                          {
                                             usernameTarget: target,
                                             userId: userInfoRes.data.user.id,
                                             cursor: cursor,
                                             commentCursor: commentsCursor,
                                             replyCursor: null,
                                             problem: comments.message,
                                             dateCriteria: dateCriteria,
                                          },
                                       );

                                       await this.autoSwitchAccount();

                                       comments = await this.repository.getCommentList(
                                          feed.node.shortcode,
                                          commentsCursor,
                                       );
                                    }

                                    await delay(5000);

                                    for (const comment of comments.data
                                       .shortcode_media
                                       .edge_media_to_parent_comment.edges) {
                                       let commentResponsiveness =
                                          this.getCommentResponsiveness(
                                             comment,
                                             target,
                                          );

                                       responsiveness += commentResponsiveness;

                                       if (
                                          comment.node?.edge_threaded_comments
                                             .count > 0
                                       ) {
                                          let replyCursor: string | null = null;
                                          let i: number = 0;
                                          do {
                                             await delay(5000);
                                             let replyes =
                                                await this.repository.getReplyCommentList(
                                                   comment.node.id,
                                                   replyCursor,
                                                );

                                             while (replyes.status === 'fail') {
                                                loggerUtils.logWithFile(
                                                   `[SESSION LOST] Get Reply Comment List fail | ${replyes.message} | Required Login | On Comment ID : ${comment.node.id} | Reply Cursor : ${replyCursor} `,
                                                );

                                                await errorCapture(
                                                   BotEngine.page,
                                                   'getReplyCommentList',
                                                   {
                                                      usernameTarget: target,
                                                      userId:
                                                         userInfoRes.data.user
                                                            .id,
                                                      cursor: cursor,
                                                      commentCursor:
                                                         commentsCursor,
                                                      replyCursor: replyCursor,
                                                      problem: replyes.message,
                                                      dateCriteria:
                                                         dateCriteria,
                                                   },
                                                );

                                                await this.autoSwitchAccount();

                                                replyes =
                                                   await this.repository.getReplyCommentList(
                                                      comment.node.id,
                                                      replyCursor,
                                                   );
                                             }

                                             for (const reply of replyes.data
                                                .comment.edge_threaded_comments
                                                .edges) {
                                                if (
                                                   reply.node.owner
                                                      ?.username === target
                                                ) {
                                                   responsiveness++;
                                                }
                                             }

                                             replyCursor =
                                                replyes.data.comment
                                                   .edge_threaded_comments
                                                   .page_info.end_cursor;

                                             i++;
                                          } while (
                                             i < 10 &&
                                             replyCursor != null
                                          );
                                       }
                                    }

                                    commentsCursor =
                                       comments.data.shortcode_media
                                          .edge_media_to_parent_comment
                                          .page_info.end_cursor;

                                    console.info(
                                       comments.data.shortcode_media
                                          .edge_media_to_parent_comment
                                          .page_info,
                                    );
                                    console.info(
                                       `CURSOR COMMENT : ${commentsCursor}`,
                                    );
                                 } while (commentsCursor != null);
                              }

                              console.info('---------------------------------');
                              console.info(`Username : ${target}`);
                              console.info(`Url : ${url}`);
                              console.info(`Follower : ${followerCount}`);
                              console.info(`Like : ${likeCount}`);
                              console.info(`Comment : ${commentCount}`);
                              console.info(`Response : ${responsiveness}`);
                              console.info(`Taken at : ${feedCreateTime}`);
                              console.info('---------------------------------');

                              await db.tbl_scraping.create({
                                 ig_username: target,
                                 url: url,
                                 follower_count: followerCount,
                                 like_count: likeCount,
                                 comment_count: commentCount,
                                 response_count: responsiveness,
                                 taken_at: feedCreateTime,
                                 completed: 1,
                                 category: 'H',
                              });

                              scrapeResult.push({
                                 ig_username: target,
                                 url: url,
                                 follower_count: followerCount,
                                 like_count: likeCount,
                                 comment_count: commentCount,
                                 response_count: responsiveness,
                                 taken_at: feedCreateTime,
                                 completed: 1,
                                 category: 'H',
                              });
                           }
                        }

                        let lastPostsCreateTime = moment(
                           feeds.data.user.edge_owner_to_timeline_media.edges[
                              feedOnPageCount - 1
                           ].node.taken_at_timestamp * 1000,
                        );

                        isNext = lastPostsCreateTime >= dateCriteria;

                        isNext
                           ? loggerUtils.logWithFile(
                                `Getting next page response...`,
                             )
                           : loggerUtils.logWithFile(`Page enough`);
                     } else {
                        loggerUtils.logWithFile(`Zero (0) Post in user feeds`);
                        isNext = false;
                     }
                  }
               } catch (error: any) {
                  loggerUtils.logWithFile(
                     `${error.toString()} from scrape`,
                     'error',
                     'Error',
                  );
               }
            }
         }
      } catch (error: any) {
         loggerUtils.logWithFile(error.toString(), 'error', 'Error');
      }

      loggerUtils.logWithFile(`Success Scrape ${target}!`);

      return scrapeResult;
   };

   public scrapeFailedUser = async (fileName: string): Promise<void> => {
      let userFailedScrapeResults = [];

      let isLogin: boolean = await this.login();

      while (!isLogin) {
         isLogin = await this.login();
      }

      await delay(5000);

      const failedUserPath: string = path.join(
         './failed_user/' + fileName + '.json',
      );
      const failedUsers: any = fs.readFileSync(failedUserPath);

      for (const user of JSON.parse(failedUsers)) {
         if (user.userId === null) {
            logger
               .logger()
               .info(`skip for ${user.username} | Reason : ${user.problem}`);
         } else {
            try {
               await delay(5000);

               const userInfoRes = await this.repository.getUserInfo(user);

               const feeds = await this.repository.getUserFeeds(user.userId, user.cursor);

               let feedOnPageCount: number =
                  feeds.data.user.edge_owner_to_timeline_media.edges.length;
               if (feedOnPageCount != 0) {
                  for (const feed of feeds.data.user
                     .edge_owner_to_timeline_media.edges) {
                     const followerCount: number = parseFloat(
                        userInfoRes.data.user.edge_followed_by.count,
                     );

                     const feedCreateTime: any = moment(
                        feed.node.taken_at_timestamp * 1000,
                     );

                     if (
                        feedCreateTime.year() == user.dateCriteria.year() &&
                        feedCreateTime.month() == user.dateCriteria.month() &&
                        feedCreateTime.date() == user.dateCriteria.date()
                     ) {
                        const url: string = `https://instagram.com/p/${feed.node.shortcode}`;

                        let likeCount: number = parseFloat(
                           feed.node.edge_media_preview_like.count,
                        );

                        if (likeCount === -1) {
                           const likers = await this.repository.getLikers(
                              feed.node.shortcode,
                           );

                           likeCount = await likers.data.shortcode_media
                              .edge_liked_by.count;
                        }

                        const commentCount: number = parseFloat(
                           feed.node.edge_media_to_comment.count,
                        );

                        let responsiveness: number = 0;

                        if (commentCount > 0) {
                           /**
                            * Comment cursor 0
                            */
                           // let commentsCursor: null = null;
                           // const comments = await this.getCommentList(
                           //    feed.node.shortcode,
                           //    null,
                           // );
                           // responsiveness = this.getResponsiveness(
                           //    feed.node.edge_media_to_comment.edges,
                           //    null,
                           // );
                        }

                        console.info('---------------------------------');
                        console.info(`Username : ${user.username}`);
                        console.info(`Url : ${url}`);
                        console.info(`Follower : ${followerCount}`);
                        console.info(`Like : ${likeCount}`);
                        console.info(`Comment : ${commentCount}`);
                        console.info(`Response : ${responsiveness}`);
                        console.info(`Taken at : ${feedCreateTime}`);
                        console.info('---------------------------------');

                        await db.tbl_scraping.create({
                           ig_username: user.username,
                           url: url,
                           follower_count: followerCount,
                           like_count: likeCount,
                           comment_count: commentCount,
                           response_count: responsiveness,
                           taken_at: feedCreateTime,
                           completed: 1,
                           category: 'H',
                        });

                        userFailedScrapeResults.push({
                           ig_username: user.username,
                           url: url,
                           follower_count: followerCount,
                           like_count: likeCount,
                           comment_count: commentCount,
                           response_count: responsiveness,
                           taken_at: feedCreateTime,
                           completed: 1,
                           category: 'H',
                        });
                     }
                  }
               } else {
                  logger.logger().info(`Zero (0) Post in user feeds`);
               }
            } catch (error: any) {
               logger
                  .logger()
                  .error(`${error.toString()} from scrapeFailedUser`);
            }
         }
      }
   };

   public __hashtagResearch_V1 = async (endCursor?: string | null): Promise<any> => {
      const hashTagUrl = `https://www.instagram.com/explore/tags/july/?hl=id-ID`;


      const tagPosts: any = new Promise(async (resolve, reject) => {

         BotEngine.page!.on('response', async (response: any) => {
            if (
               response
                  .url()
                  .includes(`/api/v1/tags`)
            ) {
               try {
                  const newRespon = await response.json();
                  console.info(newRespon.data.hashtag.edge_hashtag_to_media.page_info.end_cursor)
                  loggerUtils.logFile(newRespon, `HASHTAG_${newRespon.data.hashtag.edge_hashtag_to_media.page_info.end_cursor}`);
                  resolve(newRespon);
               } catch (error: any) {
                  logger.logger().error(error);
               }
            }
         });

         logger.logger().info(`Go to ${hashTagUrl} page...`);
         await BotEngine.page!.goto(hashTagUrl, { waitUntil: 'networkidle2' });
         await delay(5000);
         await BotEngine.page!.content();
         setTimeout(() => {
            reject('Get hashtag page timeout');
         }, 30000);
      });
      return tagPosts;
   }

   public __hashTagMorePageResearch = async (tagName: string, maxPage: number, subtract: number): Promise<any> => {
      let currentPage: number = 1;
      let cursor: string | null = null;
      // const tagPosts = JSON.parse(fs.readFileSync('./dummy_response.json', {encoding: 'utf-8'}));

      let hasNextPage: boolean = true;
      while (hasNextPage && currentPage <= maxPage) {
         const tagPosts = await this.repository.getPostByHashtag(tagName, cursor);

         hasNextPage = tagPosts.data.top.more_available;
         cursor = tagPosts.data.top.next_max_id;

         for (const posts of tagPosts.data.top.sections) {
            let medias = [];
            if (posts.layout_type === 'one_by_two_left') {
               medias = posts.layout_content.fill_items;
            } else {
               medias = posts.layout_content.medias
            }

            for (const post of medias) {
               const feedCreateTime: Moment = moment(
                  post.media.taken_at * 1000,
               );

               const dateCriteria = moment().subtract(subtract, 'days');

               if (feedCreateTime.year() == dateCriteria.year() &&
                  feedCreateTime.month() == dateCriteria.month() &&
                  feedCreateTime.date() == dateCriteria.date()) {
                  const username: string = post.media.owner.username;
                  const postUrl: string = `instagram.com/p/${post.media.code}`;
                  const caption: string = post.media.caption.text;

                  console.info('---------------------------------');
                  console.info(`Datetime : ${feedCreateTime}`);
                  console.info(`Media name : ${username}`);
                  console.info(`Source URL : ${postUrl}`);
                  console.info(`Title : ${caption}`);
                  console.info(`Content : -`);
                  console.info(`Platform : instagram`);
                  // console.info('---------------------------------');

                  await this.saveToSpiderRaw(feedCreateTime, username, postUrl, caption)
               }

            }
         }

         currentPage++;
      }



      return 0;
      // if (tagPosts.status === 'ok' && tagPosts.data) {
      //    let hasNextPage: boolean = tagPosts.data.top.more_available;
      //
      //    while (hasNextPage) {
      //       let endCursor: string = tagPosts.data.top.more_available.next_max_id;
      //
      //       const nextResponse = await this.__hashtagResearch_V2(endCursor);
      //       return nextResponse;
      //    }
      // }
   }

   public scrapeCommentsToCSV = async (yearWanted: string, monthWanted: string): Promise<void> => {
      let isLogin: boolean = await this.isLogin();

      while (!isLogin) {
         isLogin = await this.isLogin();
      }

      const currentDate = new Date().toJSON().slice(0, 10);
      let toCsvData: Array<any> = [];
      /**
       * TARGET TARUH SINI
       */
      const targets = [
         // 'bappelitbang.bdg',
         'infobdgcom',
         // 'dishubkotabandung',
         // 'disnakerbandung',
         // 'kesra_kotabandung',
         // 'disdagin_bdg',
         // 'dppkb.bandung',
      ];

      for (const target of targets) {
         // const records: any = await this.sequelize.query(
         //    `SELECT url FROM tbl_scraping WHERE tbl_scraping.ig_username = '${target}' AND taken_at LIKE '%${monthWantedmonthWantedmonthWanted}-${req.body.monthWanted}%'`,
         //    {
         //       type: QueryTypes.SELECT,
         //    },
         // );
         let username: string = '';
         const records: any = [
            {
               url: 'https://www.instagram.com/p/DAfKSmkPwLe/',
            },
         ];
         logger.logger().info(`Record length : ${records.length}`);

         let results: any = [];

         if (records.length > 0 && records) {
            for (const record of records) {
               let sumComments: number = 0;
               const shortcode: string = record.url
                  .split('/p/')[1]
                  .split('/')[0];

               await delay(5000);
               let pageInfo: any = await this.repository.getPageInfo(shortcode);
               username = pageInfo.data?.shortcode_media.owner?.username || target;

               while (pageInfo.status === 'fail') {
                  logger.logWithFile(`[SESSION LOST] Get Page Info fail`);
                  await this.autoSwitchAccount();

                  pageInfo = await this.repository.getPageInfo(shortcode);
               }

               // console.info(pageInfo)

               if (pageInfo.data.shortcode_media !== null) {
                  let waktuPosting: any;
                  let urlPosting: string;
                  let comments: any = [];

                  waktuPosting = moment(
                     pageInfo.data.shortcode_media.taken_at_timestamp * 1000,
                  );
                  urlPosting = `https://www.instagram.com/p/${shortcode}`;

                  await delay(5000);

                  let commentsCursor: string | null = null;

                  do {
                     let commentList: any =
                        await this.repository.getCommentList(
                           shortcode,
                           commentsCursor,
                        );

                     // while (commentList.status === 'fail') {
                     //    logger.logWithFile(
                     //       `[SESSION LOST] Get Comment List fail | ${commentList.message} | Required Login | On Shortcode : ${shortcode} | Comment Cursor : ${commentsCursor} `,
                     //    );
                     //    await this.autoSwitchAccount();
                     //
                     //    comments = await this.repository.getCommentList(
                     //       shortcode,
                     //       commentsCursor,
                     //    );
                     // }

                     console.info(JSON.parse(JSON.stringify(commentList)))

                     if (JSON.parse(JSON.stringify(commentList)).errors) {
                        commentsCursor = null
                     } else {
                        sumComments +=
                           commentList.data.shortcode_media?.edge_media_to_parent_comment?.count || 0;

                        if (commentList != null && commentList.data != null && commentList.data && commentList.data.shortcode_media != null) {
                           for (const comment of commentList.data.shortcode_media?.edge_media_to_parent_comment?.edges) {
                              let commentId: string = '';
                              let intervalPostToComment: string = '';
                              let waktuComment: any;
                              let usernameCommenter: string = '';
                              let valueComment: string = '';
                              let replies: any = [];

                              commentId = comment.node.id;
                              intervalPostToComment = getDiffTime(
                                 parseInt(
                                    pageInfo.data.shortcode_media.taken_at_timestamp,
                                 ),
                                 comment.node.created_at,
                              );

                              waktuComment = moment(comment.node.created_at * 1000);
                              usernameCommenter = comment.node.owner?.username;
                              valueComment = comment.node.text;


                              if (comment.node.edge_threaded_comments.count > 0) {
                                 let replyCursor: string | null = null;

                                 do {
                                    await delay(5000);
                                    let replyes =
                                       await this.repository.getReplyCommentList(
                                          comment.node.id,
                                          replyCursor,
                                       );

                                    while (replyes.status === 'fail') {
                                       logger.logWithFile(
                                          `[SESSION LOST] Get Reply Comment List fail | ${replyes.message} | Required Login | On Comment ID : ${comment.node.id} | Reply Cursor : ${replyCursor} `,
                                       );
                                       await this.autoSwitchAccount();

                                       replyes =
                                          await this.repository.getReplyCommentList(
                                             comment.node.id,
                                             replyCursor,
                                          );
                                    }

                                    sumComments +=
                                       replyes.data.comment.edge_threaded_comments
                                          .count;

                                    for (const reply of replyes.data.comment
                                       .edge_threaded_comments.edges) {
                                       const intervalCommentToReplies: string =
                                          getDiffTime(
                                             comment.node.created_at,
                                             reply.node.created_at,
                                          );
                                       const waktuReplies: any = moment(
                                          reply.node.created_at * 1000,
                                       );
                                       const usernameReplier: string =
                                          reply.node.owner?.username;

                                       const valueReplies: string = reply.node.text;

                                       replies.push({
                                          interval_comment_to_replies:
                                          intervalCommentToReplies,
                                          waktu_replies: waktuReplies.toString(),
                                          username_replier: usernameReplier,
                                          value_replies: valueReplies,
                                       });

                                       delay(5000);
                                    }

                                    replyCursor =
                                       replyes.data.comment.edge_threaded_comments
                                          .page_info.end_cursor;
                                 } while (replyCursor != null);

                                 // TODO : IMPLEMENT PAGINATION reply.edge_threaded_comments.page_info.end_cursor
                                 for (const reply of comment.node
                                    .edge_threaded_comments.edges) {
                                    sumComments +=
                                       comment.node.edge_threaded_comments.count;
                                    const intervalCommentToReplies: string =
                                       getDiffTime(
                                          comment.node.created_at,
                                          reply.node.created_at,
                                       );
                                    const waktuReplies: any = moment(
                                       reply.node.created_at * 1000,
                                    );
                                    const usernameReplier: string =
                                       reply.node.owner?.username;

                                    const valueReplies: string = reply.node.text;

                                    replies.push({
                                       interval_comment_to_replies:
                                       intervalCommentToReplies,
                                       waktu_replies: waktuReplies.toString(),
                                       username_replier: usernameReplier,
                                       value_replies: valueReplies,
                                    });

                                    delay(5000);
                                 }
                              }

                              comments.push({
                                 url_comment: `${this.BASE_URL}/p/${shortcode}/c/${commentId}`,
                                 interval_post_to_comment: intervalPostToComment,
                                 waktu_comment: waktuComment.toString(),
                                 user_commenter: usernameCommenter,
                                 value_comment: valueComment,
                                 replies: replies,
                              });

                              delay(5000);
                           }

                           const result: any = {
                              username: username,
                              waktu_posting: waktuPosting.toString(),
                              url_posting: urlPosting,
                              comments: comments,
                           };

                           results.push(result);

                           commentsCursor =
                              JSON.parse(commentList.data.shortcode_media
                                 .edge_media_to_parent_comment.page_info.end_cursor).cached_comments_cursor;

                           delay(5000);
                        }
                     }
                  } while (commentsCursor != null);
               } else {
                  logger.logger().info(`${shortcode} page was deleted`);
               }
            }

            let rows: Array<any> = [];

            console.info(results[0])
            rows.push({
               username: results[0].username,
               waktu_posting: results[0].waktu_posting,
               url_posting: results[0].url_posting,
               interval_post_to_comment:
               results[0].comments[0]?.interval_post_to_comment,
               waktu_comment: results[0].comments[0]?.waktu_comment,
               user_commenter: results[0].comments[0]?.user_commenter,
               value_comment: results[0].comments[0]?.value_comment,
               url_comment: results[0].comments[0]?.url_comment,
               interval_comment_to_replies:
               results[0].comments[0]?.replies[0]
                  ?.interval_comment_to_replies,
               waktu_replies: results[0].comments[0]?.replies[0]?.waktu_replies,
               username_replier:
               results[0].comments[0]?.replies[0]?.username_replier,
               value_replies: results[0].comments[0]?.replies[0]?.value_replies,
            });

            if (results[0].comments[0]?.replies.length > 1) {
               for (
                  let i: number = 1;
                  i < results[0].comments[0]?.replies.length;
                  i++
               ) {
                  rows.push({
                     username: '',
                     waktu_posting: '',
                     url_posting: '',
                     interval_post_to_comment: '',
                     waktu_comment: '',
                     user_commenter: '',
                     value_comment: '',
                     url_comment: '',
                     interval_comment_to_replies:
                     results[0].comments[0]?.replies[i]
                        ?.interval_comment_to_replies,
                     waktu_replies:
                     results[0].comments[0]?.replies[i]?.waktu_replies,
                     username_replier:
                     results[0].comments[0]?.replies[i]?.username_replier,
                     value_replies:
                     results[0].comments[0]?.replies[i]?.value_replies,
                  });
               }
            }

            if (results[0].comments.length > 1) {
               for (let j: number = 1; j < results[0].comments.length; j++) {
                  rows.push({
                     username: '',
                     waktu_posting: '',
                     url_posting: '',
                     interval_post_to_comment:
                     results[0].comments[j]?.interval_post_to_comment,
                     waktu_comment: results[0].comments[j]?.waktu_comment,
                     user_commenter: results[0].comments[j]?.user_commenter,
                     value_comment: results[0].comments[j]?.value_comment,
                     url_comment: results[0].comments[j]?.url_comment,
                     interval_comment_to_replies:
                     results[0].comments[j]?.replies[0]
                        ?.interval_comment_to_replies,
                     waktu_replies:
                     results[0].comments[j]?.replies[0]?.waktu_replies,
                     username_replier:
                     results[0].comments[j]?.replies[0]?.username_replier,
                     value_replies:
                     results[0].comments[j]?.replies[0]?.value_replies,
                  });

                  if (results[0].comments[j]?.replies.length > 1) {
                     for (
                        let k: number = 0;
                        k < results[0].comments[j]?.replies.length;
                        k++
                     ) {
                        rows.push({
                           username: '',
                           waktu_posting: '',
                           url_posting: '',
                           interval_post_to_comment: '',
                           waktu_comment: '',
                           user_commenter: '',
                           value_comment: '',
                           url_comment: '',
                           interval_comment_to_replies:
                           results[0].comments[j]?.replies[k]
                              ?.interval_comment_to_replies,
                           waktu_replies:
                           results[0].comments[j]?.replies[k]?.waktu_replies,
                           username_replier:
                           results[0].comments[j]?.replies[k]
                              ?.username_replier,
                           value_replies:
                           results[0].comments[j]?.replies[k]?.value_replies,
                        });
                     }
                  }
               }
            }

            for (let i: number = 1; i < results.length; i++) {
               rows.push({
                  username: results[i].username,
                  waktu_posting: results[i].waktu_posting,
                  url_posting: results[i].url_posting,
                  interval_post_to_comment:
                  results[i].comments[0]?.interval_post_to_comment,
                  waktu_comment: results[i].comments[0]?.waktu_comment,
                  user_commenter: results[i].comments[0]?.user_commenter,
                  value_comment: results[i].comments[0]?.value_comment,
                  url_comment: results[i].comments[0]?.url_comment,
                  interval_comment_to_replies:
                  results[i].comments[0]?.replies[0]
                     ?.interval_comment_to_replies,
                  waktu_replies:
                  results[i].comments[0]?.replies[0]?.waktu_replies,
                  username_replier:
                  results[i].comments[0]?.replies[0]?.username_replier,
                  value_replies:
                  results[i].comments[0]?.replies[0]?.value_replies,
               });

               if (results[i].comments[0]?.replies.length > 1) {
                  for (
                     let x: number = 1;
                     x < results[i].comments[0]?.replies.length;
                     x++
                  ) {
                     rows.push({
                        username: '',
                        waktu_posting: '',
                        url_posting: '',
                        interval_post_to_comment: '',
                        waktu_comment: '',
                        user_commenter: '',
                        value_comment: '',
                        url_comment: '',
                        interval_comment_to_replies:
                        results[i].comments[0]?.replies[x]
                           ?.interval_comment_to_replies,
                        waktu_replies:
                        results[i].comments[0]?.replies[x]?.waktu_replies,
                        username_replier:
                        results[i].comments[0]?.replies[x]?.username_replier,
                        value_replies:
                        results[i].comments[0]?.replies[x]?.value_replies,
                     });
                  }
               }

               if (results[i].comments.length > 1) {
                  for (let j: number = 1; j < results[i].comments.length; j++) {
                     rows.push({
                        username: '',
                        waktu_posting: '',
                        url_posting: '',
                        interval_post_to_comment:
                        results[i].comments[j]?.interval_post_to_comment,
                        waktu_comment: results[i].comments[j]?.waktu_comment,
                        user_commenter: results[i].comments[j]?.user_commenter,
                        value_comment: results[i].comments[j]?.value_comment,
                        url_comment: results[i].comments[j]?.url_comment,
                        interval_comment_to_replies:
                        results[i].comments[j]?.replies[0]
                           ?.interval_comment_to_replies,
                        waktu_replies:
                        results[i].comments[j]?.replies[0]?.waktu_replies,
                        username_replier:
                        results[i].comments[j]?.replies[0]?.username_replier,
                        value_replies:
                        results[i].comments[j]?.replies[0]?.value_replies,
                     });

                     if (results[i].comments[j]?.replies.length > 1) {
                        for (
                           let k: number = 0;
                           k < results[i].comments[j]?.replies.length;
                           k++
                        ) {
                           rows.push({
                              username: '',
                              waktu_posting: '',
                              url_posting: '',
                              interval_post_to_comment: '',
                              waktu_comment: '',
                              user_commenter: '',
                              value_comment: '',
                              url_comment: '',
                              interval_comment_to_replies:
                              results[i].comments[j]?.replies[k]
                                 ?.interval_comment_to_replies,
                              waktu_replies:
                              results[i].comments[j]?.replies[k]
                                 ?.waktu_replies,
                              username_replier:
                              results[i].comments[j]?.replies[k]
                                 ?.username_replier,
                              value_replies:
                              results[i].comments[j]?.replies[k]
                                 ?.value_replies,
                           });
                        }
                     }
                  }
               }
            }

            let csvWriter: any;
            if (
               !fs.existsSync(
                  `./excel/${username}-${yearWanted}-${monthWanted}.csv`,
               )
            ) {
               csvWriter = createObjectCsvWriter({
                  path: `./excel/${username}-${yearWanted}-${monthWanted}.csv`,
                  header: [
                     { id: 'username', title: 'Username' },
                     { id: 'waktu_posting', title: 'Waktu Posting' },
                     { id: 'url_posting', title: 'Url Posting' },
                     {
                        id: 'interval_post_to_comment',
                        title: 'Interval post to comment',
                     },
                     {
                        id: 'waktu_comment',
                        title: 'Waktu Comment',
                     },
                     {
                        id: 'user_commenter',
                        title: 'User Commenter',
                     },
                     {
                        id: 'value_comment',
                        title: 'Value Comment',
                     },
                     {
                        id: 'url_comment',
                        title: 'URL Comment',
                     },
                     {
                        id: 'interval_comment_to_replies',
                        title: 'interval comment to replies',
                     },
                     {
                        id: 'waktu_replies',
                        title: 'Waktu replies',
                     },
                     {
                        id: 'username_replier',
                        title: 'Username replier',
                     },
                     {
                        id: 'value_replies',
                        title: 'Value replies',
                     },
                  ],
               });
            } else {
               csvWriter = createObjectCsvWriter({
                  path: `./excel/${username}-${yearWanted}-${monthWanted}.csv`,
                  header: [
                     { id: 'username', title: 'Username' },
                     { id: 'waktu_posting', title: 'Waktu Posting' },
                     { id: 'url_posting', title: 'Url Posting' },
                     {
                        id: 'interval_post_to_comment',
                        title: 'Interval post to comment',
                     },
                     {
                        id: 'waktu_comment',
                        title: 'Waktu Comment',
                     },
                     {
                        id: 'user_commenter',
                        title: 'User Commenter',
                     },
                     {
                        id: 'value_comment',
                        title: 'Value Comment',
                     },
                     {
                        id: 'url_comment',
                        title: 'URL Comment',
                     },
                     {
                        id: 'interval_comment_to_replies',
                        title: 'interval comment to replies',
                     },
                     {
                        id: 'waktu_replies',
                        title: 'Waktu replies',
                     },
                     {
                        id: 'username_replier',
                        title: 'Username replier',
                     },
                     {
                        id: 'value_replies',
                        title: 'Value replies',
                     },
                  ],
                  append: true,
               });
            }

            await csvWriter.writeRecords(rows).then(() => {
               console.log('Done save to excel...');
            });
         }
      }
   }

   public scrapePostByUrl = async (username: string): Promise<void> => {
      let isLogin: boolean = await this.isLogin();

      while (!isLogin) {
         isLogin = await this.isLogin();
      }

      if (isLogin) {
         const currentDate = new Date().toJSON().slice(0, 10);
         const csvWriter = createObjectCsvWriter({
            path: `./excel/${currentDate}.csv`,
            header: [
               { id: 'username', title: 'Username' },
               { id: 'url', title: 'Url' },
               { id: 'type', title: 'Type' },
            ],
         });
         let toCsvData: Array<{ username: string; url: string; type: string }> =
            [];

         const records: Array<any> = [
            'https://www.instagram.com/p/Cw1qzHKrg2Y/',
         ];
         console.info(`Records length : ${records.length}`);

         for (const record of records) {
            const shortcode: string = record?.split('/p/')[1]?.split('/')[0];
            await delay(5000);
            const pageInfo: any = await this.repository.getPageInfo(shortcode);

            const username = pageInfo.data.shortcode_media.owner?.username;

            if (pageInfo.data.shortcode_media !== null) {
               let type: string;
               if (
                  pageInfo.data.shortcode_media.__typename === 'GraphSidecar'
               ) {
                  type = 'carousel';
               } else if (
                  pageInfo.data.shortcode_media.__typename === 'GraphVideo'
               ) {
                  type = 'reels';
               } else {
                  type = 'single post';
               }
               const url: string = `https://www.instagram.com/p/${shortcode}`;

               console.info(`--------------------------`);
               console.info(`Username: ${username}`);
               console.info(`URL: ${url}`);
               console.info(`Type: ${type}`);
               toCsvData.push({
                  username: username,
                  url: url,
                  type: type,
               });
            } else {
               logger.logger().info(`Post was deleted`);
            }
         }

         await csvWriter.writeRecords(toCsvData).then(() => {
            console.log('Done save to excel...');
         });
      }
   }

   // public getReplyCommentResponsiveness = (replyes: any, username: string) {
   //    if (comment.node?.edge_threaded_comments.count > 0) {
   //       let replyCursor: string | null = null;

   //       let i: number = 0;

   //       do {
   //          const replyes = await this.getReplyCommentList(
   //             comment.node.id,
   //             replyCursor,
   //          );

   //          if (replyes.status === 'fail') {
   //             loggerUtils.logWithFile(
   //                `[SESSION LOST] Get Reply Comment List fail | ${replyes.message} | Required Login | On Comment ID : ${comment.node.id} | Reply Cursor : ${replyCursor} `,
   //             );
   //             await this.autoSwitchAccount();
   //             // replyCursor = null;
   //             // isStop = true;
   //          } else {
   //             await delay(5000);

   //             for (const reply of replyes.data.comment
   //                .edge_threaded_comments.edges) {
   //                if (reply.node.owner?.username === username) {
   //                   responsivenessCount++;
   //                }
   //             }

   //             replyCursor =
   //                replyes.data.comment.edge_threaded_comments.page_info
   //                   .end_cursor;
   //          }
   //          i++;
   //       } while (i < 10 && replyCursor != null);
   //       // do {
   //       //
   //       // } while (replyCursor != null && !isStop);
   //       // replyCursor != null && !isStop
   //    }
   // };

}

export default InstagramRapidServices;
