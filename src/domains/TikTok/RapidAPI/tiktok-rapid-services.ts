import 'dotenv/config';
import TikTokRapidRepository from './tiktok-rapid-repository';

class TikTokRapidServices {
    private tikTokRapidRepository = new TikTokRapidRepository();
    public async getDataUser(kategori : string | null) {
        const result = await this.tikTokRapidRepository.getUserDB(kategori);

        // console.info("service", result);

        const username = result.map((item : any) => {
            return item.username;
        })

        for (const user of username) {
            console.info("username : ", user);
            await this.tikTokRapidRepository.getUserInfo(user);
        }
    }
}

export default TikTokRapidServices;
