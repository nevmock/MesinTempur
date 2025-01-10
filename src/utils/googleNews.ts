import { BasicAcceptedElems, CheerioAPI } from 'cheerio';
import loggerUtils from './logger';

class GoogleNewsUtils {
   public getTitle = ($: CheerioAPI, article: BasicAcceptedElems<any>, articleType: string) => {
      try {
         switch(articleType) {
            case "regular":
               return $(article).find('h4').text() || $(article).find('div > div + div > div a').text()
            case "topicFeatured":
               return $(article).find('a[target=_blank]').text() || $(article)?.find('button')?.attr('aria-label')?.replace('More - ', '')
            case "topicSmall":
               return $(article).find('a[target=_blank]').text() || $(article)?.find('button')?.attr('aria-label')?.replace('More - ', '')
         }
      } catch (err) {
         return false;
      }
   }

   public getArticleType = ($: CheerioAPI, article: BasicAcceptedElems<any>) => {
      if (
         $(article).find('h4').text() ||
         $(article).find('div > div + div > div a').text()
      ) return "regular";

      if (
         $(article).find('figure').length
      ) {
         return "topicFeatured";
      }

      if (
         $(article).find('> a').text()
      ) return "topicSmall";

      loggerUtils.logWithFile(`[News Utils] : getArticleType failed get type info`)
      return 'FAILED';
   }
}

export default GoogleNewsUtils;