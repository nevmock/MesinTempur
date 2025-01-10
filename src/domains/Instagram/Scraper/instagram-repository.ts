import loggerUtils from '../../../utils/logger';
import delay from '../../../utils/delay';
import IInstagramRepository from '../../../interfaces/instagram-repository-interface';
import { Browser, Page } from 'puppeteer';
import BotEngine from '../../../bot-engine';
import OurApp from '../../../app';

class InstagramRepository implements IInstagramRepository {
   private DEFAULT_FEED_PAGE_SIZE: number = 12;
   private DEFAULT_LIKE_PAGE_SIZE: number = 100;
   private DEFAULT_COMMENT_SIZE: number = 50;
   private DEFAULT_REPLY_COMMENT_SIZE: number = 50;

   public getUserInfo = async (username: string): Promise<any> => {
      loggerUtils.logWithFile(`Go to ${username} page...`);

      const response = await BotEngine.page?.goto(
         `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
         {
            waitUntil: 'networkidle0',
         },
      );

      const statusCode = response?.status();

      const result = await response?.json();

      if (statusCode === 400) {
         return {
            data: null,
            error: {
               code: statusCode,
               message: result.message,
            },
         };
      } else if (result.data.user == null) {
         return {
            data: null,
            error: {
               code: statusCode,
               message: `Username ${username} Not Found`,
            },
         };
      }

      return result;
   };

   public getUserFeeds = async (
      userId: string,
      cursor: string | null,
      pageSize: number = this.DEFAULT_FEED_PAGE_SIZE,
   ): Promise<any> => {
      let feedUrl: string;
      if (cursor === null) {
         feedUrl = `https://www.instagram.com/graphql/query/?query_hash=e769aa130647d2354c40ea6a439bfc08&variables={"id":"${userId}","first":${pageSize}}`;
      } else {
         feedUrl = `https://www.instagram.com/graphql/query/?query_hash=e769aa130647d2354c40ea6a439bfc08&variables={"id":"${userId}","first":${pageSize},"after":"${cursor}"}`;
      }

      loggerUtils.logWithFile(`Scrape ${userId} on cursor ${cursor} page...`);
      await delay(5000);
      const response = await BotEngine.page?.goto(feedUrl, {
         waitUntil: 'load',
      });

      const statusCode = await response?.status();

      if (statusCode !== 200) {
         return {
            data: null,
            error: {
               code: statusCode,
               message: 'INTERNAL SERVER ERROR FROM INSTAGRAM',
            },
         };
      }

      const result = await response?.json();
      return result;
   };

   public getPageInfo = async (shortcode: string) => {
      let url = `https://www.instagram.com/graphql/query/?query_hash=b3055c01b4b222b8a47dc12b090e4e64&variables={"shortcode":"${shortcode}"}`;

      await delay(5000);

      const response = await BotEngine.page?.goto(url, {
         waitUntil: 'networkidle0',
      });

      const result = await response?.json();
      return result;
   };

   public getUserStrories = async (userId: string): Promise<any> => {
      let storiesUrl: string = `https://i.instagram.com/api/v1/feed/user/${userId}/reel_media/`;

      const response = await BotEngine.page?.goto(storiesUrl, {
         waitUntil: 'networkidle0',
      });
      const result = await response?.json();
      return result;
   };

   public getUserHighlight = async (userId: string): Promise<any> => {
      const highlightListUrl: string = `https://www.instagram.com/graphql/query/?query_hash=d4d88dc1500312af6f937f7b804c68c3&user_id=${userId}&include_chaining=false&include_reel=true&include_suggested_users=false&include_logged_out_extras=false&include_live_status=false&include_highlight_reels=true`;

      const response = await BotEngine.page?.goto(highlightListUrl, {
         waitUntil: 'networkidle0',
      });
      const result = await response?.json();
      // console.info(result);
      // loggerUtils.logFile(result, 'USER HIGHLIGHT LIST');
      return result;
   };

   public getDetailUserHighlight = async (
      highlightId: string,
   ): Promise<any> => {
      let highlight: string = `https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=highlight%3A${highlightId}`;

      const response = await BotEngine.page?.goto(highlight, {
         waitUntil: 'networkidle0',
      });
      const result = await response?.json();
      // console.info(result);
      // loggerUtils.logFile(result, 'TEST DETAIL HIGHLIGHT');
      return result;
   };

   public getFollowers = async (
      userId: string,
      nextMaxId: string | null,
   ): Promise<any> => {
      let followerUrl: string;
      if (nextMaxId) {
         followerUrl = `https://www.instagram.com/api/v1/friendships/${userId}/followers/?count=${12}&max_id=${nextMaxId}`;
      } else {
         followerUrl = `https://www.instagram.com/api/v1/friendships/${userId}/followers/?count=${12}`;
      }

      const response = await BotEngine.page?.goto(followerUrl, {
         waitUntil: 'networkidle0',
      });
      const result = await response?.json();
      return result;
   };

   public getFollowing = async (
      userId: string,
      nextMaxId: string | null,
   ): Promise<any> => {
      let followerUrl: string;
      if (nextMaxId) {
         followerUrl = `https://www.instagram.com/api/v1/friendships/${userId}/following/?count=${12}&max_id=${nextMaxId}`;
      } else {
         followerUrl = `https://www.instagram.com/api/v1/friendships/${userId}/following/?count=${12}`;
      }

      const response = await BotEngine.page?.goto(followerUrl, {
         waitUntil: 'networkidle0',
      });
      const result = await response?.json();
      // console.info(result.users.length);
      // loggerUtils.logFile(result, 'FOLLOWING LIST');
      return result;
   };

   public getLikers = async (
      shortcode: string,
      untilPage: number = 0,
   ): Promise<any> => {
      const likerList = new Promise(async (resolve, reject) => {
         let likers: Array<any> = [];
         let likeListUrl: string = '';
         let cursor: string = '';

         if (untilPage > 1) {
            likeListUrl = `https://www.instagram.com/graphql/query/?query_hash=d5d763b1e2acf209d62d22d184488e57&variables={"shortcode":"${shortcode}","first":${this.DEFAULT_LIKE_PAGE_SIZE}}"`;
            const response = await BotEngine.page?.goto(likeListUrl, {
               waitUntil: 'networkidle0',
            });

            const result = await response?.json();

            likers.push(result);

            cursor =
               result.data.shortcode_media.edge_liked_by.page_info.end_cursor;

            for (let i: number = 0; i < untilPage - 1; i++) {
               likeListUrl = `https://www.instagram.com/graphql/query/?query_hash=d5d763b1e2acf209d62d22d184488e57&variables={"shortcode":"${shortcode}","first":${this.DEFAULT_LIKE_PAGE_SIZE}},"after":"${cursor}"`;

               await delay(5000);

               const response = await BotEngine.page?.goto(likeListUrl, {
                  waitUntil: 'networkidle0',
               });

               const result = await response?.json();

               likers.push(result);
            }
            resolve(likers);
         } else {
            likeListUrl = `https://www.instagram.com/graphql/query/?query_hash=d5d763b1e2acf209d62d22d184488e57&variables={"shortcode":"${shortcode}","first":${this.DEFAULT_LIKE_PAGE_SIZE}}`;

            const response = await BotEngine.page?.goto(likeListUrl, {
               waitUntil: 'networkidle0',
            });

            const result = await response?.json();

            resolve(result);
         }

         setTimeout(() => {
            reject('Get likers timeout');
         }, 60000);
      });

      return likerList;
   };

   public getPostByHashtag = async (tagName: string, cursor?: string | null): Promise<any> => {
      let hashTagUrl = '';
      loggerUtils.logWithFile(
         `Trying get post on hashtag : ${tagName} | Cursor : ${cursor}`,
      );

      if (cursor === null) {
         hashTagUrl = `https://www.instagram.com/api/v1/tags/web_info/?tag_name=${tagName}&hl=id-ID`;
      } else {
         hashTagUrl = `https://www.instagram.com/api/v1/tags/web_info/?tag_name=${tagName}&hl=id-ID&next_max_id=${cursor}`;
      }

      const response = await BotEngine.page?.goto(hashTagUrl, {
         waitUntil: 'load',
      });
      await delay(5000);
      const result = await response?.json();
      return result;
   }

   public getCommentList = async (
      shortcode: string,
      cursor: string | null,
   ): Promise<any> => {
      let commentsUrl: string;

      loggerUtils.logWithFile(
         `Trying get comment on shortcode : ${shortcode} | Cursor : ${cursor}`,
      );

      if (cursor === null) {
         commentsUrl = `https://www.instagram.com/graphql/query/?query_hash=bc3296d1ce80a24b1b6e40b1e72903f5&variables={"shortcode":"${shortcode}","first":${this.DEFAULT_COMMENT_SIZE}}`;
      } else {
         commentsUrl = `https://www.instagram.com/graphql/query/?query_hash=bc3296d1ce80a24b1b6e40b1e72903f5&variables={"shortcode":"${shortcode}","first":${this.DEFAULT_COMMENT_SIZE},"after":"${cursor}"}`;
      }

      const response = await BotEngine.page?.goto(commentsUrl, {
         waitUntil: 'load',
      });
      await delay(5000);
      const result = await response?.json();
      return result;
   };

   public getReplyCommentList = async (
      commentId: string,
      cursor: string | null,
   ): Promise<any> => {
      loggerUtils.logWithFile(
         `Trying get reply comment on ID : ${commentId} | Cursor : ${cursor}`,
      );
      let replyCommentList: string;

      if (cursor === null) {
         replyCommentList = `https://www.instagram.com/graphql/query/?query_hash=1ee91c32fc020d44158a3192eda98247&variables={"comment_id":"${commentId}","first":${this.DEFAULT_REPLY_COMMENT_SIZE}}`;
      } else {
         replyCommentList = `https://www.instagram.com/graphql/query/?query_hash=1ee91c32fc020d44158a3192eda98247&variables={"comment_id":"${commentId}","first":${this.DEFAULT_REPLY_COMMENT_SIZE},"after":"${cursor}"}`;
      }

      const response = await BotEngine.page?.goto(replyCommentList, {
         waitUntil: 'networkidle0',
      });

      await delay(5000);
      const result = await response?.json();
      return result;
   };
}

export default InstagramRepository;