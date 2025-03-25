import 'dotenv/config';
import TikTokRapidRepository from './tiktok-rapid-repository';

class TikTokRapidServices {
    private tikTokRapidRepository = new TikTokRapidRepository();
    public async getDataUser(kategori : string | null) {
        const result = await this.tikTokRapidRepository.getUserDB(kategori);

        const username = result.map((item : any) => {
            return item.username;
        })

        for (const user of username) {
            console.info("username : ", user);
            await this.tikTokRapidRepository.getUserInfo(user);
        }
    }

    public async getDataPost(kategori : string | null) {
        const result = await this.tikTokRapidRepository.getUserDB(kategori)

        const username = result.map((item : any) => {
            return item.username;
        })

        for (const user of username) {
            console.info("username : ", user);
            await this.tikTokRapidRepository.getDataPost(user);
        }
    }

    public async getUserAndPostData(kategori: string | null) {
        const result = await this.tikTokRapidRepository.getUserDB(kategori);
    
        const usernames = result.map((item: any) => item.username);
    
        const semuaDataGabungan: any[] = [];
    
        for (const user of usernames) {
            console.info("Getting data for:", user);
            const dataGabunganPerUser = await this.tikTokRapidRepository.getUserAndPostData(user);
            semuaDataGabungan.push(...dataGabunganPerUser); // gabungkan semua post ke array utama
        }
    
        return semuaDataGabungan;
    }
        
}

export default TikTokRapidServices;
