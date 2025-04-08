import 'dotenv/config';
import YouTubeRapidRepository from './youtube-rapid-repository';

class YouTubeRapidServices {
    private youtubeRapidRepository = new YouTubeRapidRepository();

    public async getDataUser(kategori: string | null) {
        const result = await this.youtubeRapidRepository.getUserDB(kategori);

        const username = result.map((item: any) => {
            return item.username;
        })

        for (const user of username) {
            console.info("username : ", user);
            await this.youtubeRapidRepository.getUserInfo(user);
        }
    }
}

export default YouTubeRapidServices;