import { IBotEngineOptions } from '../interfaces/bot-engine-interface';
import path from 'path';
import accounts from '../configs/instagram/instagram-bot-account';

export const getSessionsPath = (options: IBotEngineOptions): string => {
   return path.join(
      `./src/sessions/${options.platform}/${accounts[options.botAccountIndex]!.username}.json`
   )
};