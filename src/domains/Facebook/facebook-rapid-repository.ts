import axios from 'axios';
import db from '../../../models';
import { AxiosRequestConfig } from 'axios';

class FacebookRapidRepository {

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
            url: 'https://social-api4.p.rapidapi.com/v1/info',
            params: {
                username_or_id_or_url: username,
                url_embed_safe: 'true'
            },
            headers: {
                'X-RapidAPI-Key': process.env.RAPIDAPI_FB_KEY!,
                'X-RapidAPI-Host': process.env.RAPIDAPI_FB_HOST!
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
        let hasMore = true;
        let pageCount = 0;

        const endDate = new Date();
        endDate.setDate(endDate.getDate() - 2);
        const endDateTimestamp = endDate.getTime();

        while (hasMore) {
            const getPost: AxiosRequestConfig = {
                method: 'GET',
                url: 'https://social-api4.p.rapidapi.com/v1/user/posts',
                params: {
                    username_or_id_or_url: username,
                    url_embed_safe: 'true',
                    pagination_token: paginationToken,
                    count: '10'
                },
                headers: {
                    'X-RapidAPI-Key': process.env.RAPIDAPI_FB_KEY!,
                    'X-RapidAPI-Host': process.env.RAPIDAPI_FB_HOST!
                }
            };

            try {
                const response = await axios.request(getPost);
                console.info("getDataPost:", response.data?.data || "No data found");
                
                // Check if the post date is before the end date
                if (response.data?.data && response.data.data.length > 0) {
                    const postDate = new Date(response.data.data[0].created_time * 1000);
                    if (postDate.getTime() < endDateTimestamp) {
                        hasMore = false; // Stop fetching if the post date is older than 2 days
                    }
                }

                paginationToken = response.data.pagination_token || null;
                hasMore = response.data.has_more || false;
                pageCount++;
            } catch (error: any) {
                console.error("Error fetching user posts:", error.message);
                hasMore = false; // Stop on error
            }
        }
    }

}

export default FacebookRapidRepository;