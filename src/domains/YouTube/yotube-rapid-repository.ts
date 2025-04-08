import axios from 'axios';
import db from '../../../models';
import { AxiosRequestConfig } from 'axios';

class YouTubeRapidRepository {

    public async getUserDB(kategori: string | null) {
        const data = await db.listAkun.findAll({
            where: {
                kategori,
                platform: "YouTube"
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
            url: 'https://youtube-v31.p.rapidapi.com/channels',
            params: {
                part: 'snippet,contentDetails,statistics',
                id: username
            },
            headers: {
                'X-RapidAPI-Key': process.env.RAPIDAPI_YOUTUBE_KEY!,
                'X-RapidAPI-Host': process.env.RAPIDAPI_YOUTUBE_HOST!
            }
        };

        try {
            const response = await axios.request(getUser);
            console.info("getUserInfo:", response.data?.data || "No data found");
        } catch (error: any) {
            console.error("Error fetching user info:", error.message);
        }
    }
}

export default YouTubeRapidRepository;