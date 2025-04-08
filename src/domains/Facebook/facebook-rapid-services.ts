import 'dotenv/config';
import FacebookRapidRepository from './facebook-rapid-repository';

class FacebookRapidServices {
    private facebookRapidRepository = new FacebookRapidRepository();

    public async getDataUser(kategori: string | null) {
        const result = await this.facebookRapidRepository.getUserDB(kategori);

        const username = result.map((item: any) => {
            return item.username;
        })

        for (const user of username) {
            console.info("username : ", user);
            await this.facebookRapidRepository.getUserInfo(user);
        }
    }
    public async getDataPost(kategori: string | null) {
        const result = await this.facebookRapidRepository.getUserDB(kategori)

        const username = result.map((item: any) => {
            return item.username;
        })

        for (const user of username) {
            console.info("username : ", user);
            await this.facebookRapidRepository.getDataPost(user);
        }
    }
    
}
export default FacebookRapidServices;