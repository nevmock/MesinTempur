import axios from "axios";
import db from "../../../models";

class TikTokRapidRepository {
    public async getUserInfo(username = null) {
        const getUser = {
            method: 'GET',
            url: 'https://tiktok-api15.p.rapidapi.com/index/Tiktok/getUserInfo',
            params: {
                unique_id: `@${username}`
            },
            headers: {
                'X-RapidAPI-Key': process.env.RAPIDAPI_TIKTOK_KEY,
                'X-RapidAPI-Host': process.env.RAPIDAPI_TIKTOK_HOST
            }
        };
    
        const response = await axios.request(getUser);

        console.info("getUserInfo", response.data.data);

        return response.data.data;
    }

    public async getUserDB(kategori : string | null) {
        const data = await db.listAkun.findAll({
            where: {
                kategori: kategori,
                platform: "TikTok"
            }
        })

        return data;
    }
}

export default TikTokRapidRepository;