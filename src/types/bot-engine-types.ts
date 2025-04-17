import { IBotEngineOptions } from '../interfaces/bot-engine-interface';

export type THasSessionOption = IBotEngineOptions & {
   platform: string,
   botAccountIndex: number
}

export type TChallengeValidateOptions = IBotEngineOptions &  {
   platform: string,
   botAccountIndex: number
}

export type TWriteCookiesOptions = IBotEngineOptions & {
   platform: string,
   botAccountIndex: number
}

export type TBotInitOptions = {
   useRecaptchaSolver?: boolean
   headless: boolean
}

