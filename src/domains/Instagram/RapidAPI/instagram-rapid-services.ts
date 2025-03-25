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

   public async getUserAndPostData(kategori: string | null) {
      const result = await this.instagramRapidRepository.getUserDB(kategori);

      const usernames = result.map((item: any) => item.username);

      const semuaDataGabungan: any[] = [];

      for (const user of usernames) {
         console.info("Getting data for:", user);
         const dataGabunganPerUser = await this.instagramRapidRepository.getUserAndPostData(user);
         semuaDataGabungan.push(...dataGabunganPerUser); // gabungkan semua post ke array utama
      }

      return semuaDataGabungan;
   }
}

export default InstagramRapidServices;
