import 'dotenv/config';
import InstagramRapidRepository from './instagram-rapid-repository';

class InstagramRapidServices {
   private instagramRapidRepository = new InstagramRapidRepository();
   public async getDataUser(kategori: string | null) {
      const result = await this.instagramRapidRepository.getUserDB(kategori);

      const username = result.map((item: any) => {
         return item.username;
      })

      for (const user of username) {
         console.info("username : ", user);
         await this.instagramRapidRepository.getUserInfo(user);
      }
   }

   public async getDataPost(kategori: string | null) {
      const result = await this.instagramRapidRepository.getUserDB(kategori)

      const username = result.map((item: any) => {
         return item.username;
      })

      for (const user of username) {
         console.info("username : ", user);
         await this.instagramRapidRepository.getDataPost(user);
      }
   }
}

export default InstagramRapidServices;
