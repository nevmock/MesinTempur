import axios from "axios";
import db from "../../../models";
import { AxiosRequestConfig } from "axios";

class InstagramRapidRepository {

   public async getUserDB(kategori: string | null) {
      const data = await db.listAkun.findAll({
         where: {
            kategori,
            platform: "Instagram"
         }
      });

      return data;
   }

   public async getUserInfo(username: string | null) {
      if (!username) {
         console.warn("Username is required for getUserInfo");
         return;
      }

      const getUser = {
         method: 'GET',
         url: 'https://instagram-scraper-api2.p.rapidapi.com/v1/info',
         params: {
            username_or_id_or_url: username,
            include_about: 'true',
            url_embed_safe: 'true'
         },
         headers: {
            'X-RapidAPI-Key': process.env.RAPIDAPI_IG_KEY!,
            'X-RapidAPI-Host': process.env.RAPIDAPI_IG_HOST!
         }
      };

      try {
         const response = await axios.request(getUser);
         console.info("getUserInfo:", response.data?.data || "No data found");
      } catch (error: any) {
         console.error("Error fetching user info:", error.message);
      }
   }

   public async getDataPost(username: string | null) {
      if (!username) {
         console.warn("Username is required for getDataPost");
         return;
      }

      let paginationToken: string | null = null;
      let morePosts = true;
      let pageCount = 0;

      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 2);
      const endDateTimestamp = endDate.getTime();

      while (morePosts) {
         const getPost: AxiosRequestConfig = {
            method: 'GET',
            url: 'https://instagram-scraper-api2.p.rapidapi.com/v1/posts',
            params: {
               username_or_id_or_url: username,
               url_embed_safe: 'true',
               pagination_token: paginationToken || null
            },
            headers: {
               'X-RapidAPI-Key': process.env.RAPIDAPI_IG_KEY!,
               'X-RapidAPI-Host': process.env.RAPIDAPI_IG_HOST!
            }
         };

         try {
            const response = await axios.request(getPost);
            const posts = response.data?.data?.items;

            if (!posts || posts.length === 0) {
               console.warn(`No videos found for user: ${username}`);
               break;
            }

            for (const post of posts) {
               const isPinned = post.is_pinned ? 1 : 0;
               const postDate = new Date(post.taken_at * 1000).getTime();

               if (isPinned) {
                  // console.info('Pinned Post:', post);
                  continue;
               }

               if (postDate < endDateTimestamp) {
                  return; // Stop looping jika sudah lewat dari batas tanggal
               }

               // console.info('Post:', post);
            }

            paginationToken = response.data?.pagination_token || null;
            if (!paginationToken) morePosts = false;
            pageCount++;
            console.info(`Page count: ${pageCount}`);

         } catch (error: any) {
            console.error("Error fetching posts:", error.message);
            break;
         }
      }
   }

   public async getDataComment() {

   }

   public async getDataChildComment() {

   }
}

export default InstagramRapidRepository;
