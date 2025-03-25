import axios from "axios";
import db from "../../../models";
import { AxiosRequestConfig } from "axios";

class TikTokRapidRepository {

    public async getUserDB(kategori: string | null) {
        const data = await db.listAkun.findAll({
            where: {
                kategori,
                platform: "TikTok"
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
            url: 'https://tiktok-api15.p.rapidapi.com/index/Tiktok/getUserInfo',
            params: {
                unique_id: `@${username}`
            },
            headers: {
                'X-RapidAPI-Key': process.env.RAPIDAPI_TIKTOK_KEY!,
                'X-RapidAPI-Host': process.env.RAPIDAPI_TIKTOK_HOST!
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

        let cursor: string | null = null;
        let hasMore = true;
        let pageCount = 0;

        const endDate = new Date();
        endDate.setDate(endDate.getDate() - 2);
        const endDateTimestamp = endDate.getTime();

        while (hasMore) {
            const getPost : AxiosRequestConfig = {
                method: 'GET',
                url: 'https://tiktok-api15.p.rapidapi.com/index/Tiktok/getUserVideos',
                params: {
                    unique_id: `@${username}`,
                    count: 35,
                    cursor: cursor || null
                },
                headers: {
                    'X-RapidAPI-Key': process.env.RAPIDAPI_TIKTOK_KEY!,
                    'X-RapidAPI-Host': process.env.RAPIDAPI_TIKTOK_HOST!
                }
            };

            try {
                const response = await axios.request(getPost);
                const posts = response.data?.data?.videos;

                if (!posts || posts.length === 0) {
                    console.warn(`No videos found for user: ${username}`);
                    break;
                }

                for (const post of posts) {
                    const isPinned = post.is_top ? 1 : 0;
                    const postDate = new Date(post.create_time * 1000).getTime();

                    if (isPinned) {
                        // console.info('Pinned Post:', post);
                        continue;
                    }

                    if (postDate < endDateTimestamp) {
                        return; // Stop looping jika sudah lewat dari batas tanggal
                    }

                    // console.info('Post:', post);
                }

                cursor = response.data?.data?.cursor || null;
                hasMore = response.data?.data?.hasMore ?? false;
                pageCount++;
                console.info(`Page count: ${pageCount}`);

            } catch (error: any) {
                console.error("Error fetching posts:", error.message);
                break;
            }
        }
    }

    public async getUserAndPostData(username: string | null) {
        if (!username) {
            console.warn("Username is required for getUserAndPostData");
            return [];
        }
    
        const hasilGabungan: any[] = [];
    
        // Step 1: Ambil user info
        let userInfo: any = null;
        try {
            const response = await axios.request({
                method: 'GET',
                url: 'https://tiktok-api15.p.rapidapi.com/index/Tiktok/getUserInfo',
                params: { unique_id: `@${username}` },
                headers: {
                    'X-RapidAPI-Key': process.env.RAPIDAPI_TIKTOK_KEY!,
                    'X-RapidAPI-Host': process.env.RAPIDAPI_TIKTOK_HOST!
                }
            });
    
            userInfo = response.data?.data;
            if (!userInfo) {
                console.warn(`User info not found for ${username}`);
                return [];
            }
    
        } catch (err: any) {
            console.error(`Gagal ambil user info untuk ${username}:`, err.message);
            return [];
        }
    
        // Step 2: Ambil data postingan
        let cursor: string | null = null;
        let hasMore = true;
    
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - 2);
        const endDateTimestamp = endDate.getTime();
    
        while (hasMore) {
            try {
                const response : AxiosRequestConfig = await axios.request({
                    method: 'GET',
                    url: 'https://tiktok-api15.p.rapidapi.com/index/Tiktok/getUserVideos',
                    params: {
                        unique_id: `@${username}`,
                        count: 35,
                        cursor: cursor || null
                    },
                    headers: {
                        'X-RapidAPI-Key': process.env.RAPIDAPI_TIKTOK_KEY!,
                        'X-RapidAPI-Host': process.env.RAPIDAPI_TIKTOK_HOST!
                    }
                });
    
                const videos = response.data?.data?.videos;
                if (!videos || videos.length === 0) break;
    
                for (const post of videos) {
                    const isPinned = post.is_top ? 1 : 0;
                    const postDate = new Date(post.create_time * 1000).getTime();
    
                    if (isPinned || postDate < endDateTimestamp) continue;
    
                    hasilGabungan.push({
                        username,
                        ...userInfo,
                        ...post
                    });
                }
    
                cursor = response.data?.data?.cursor || null;
                hasMore = response.data?.data?.hasMore ?? false;
    
            } catch (err: any) {
                console.error(`Gagal ambil video untuk ${username}:`, err.message);
                break;
            }
        }
    
        return hasilGabungan;
    }    

    public async getDataComment(){

    }

    public async getDataChildComment(){
        
    }
}

export default TikTokRapidRepository;
