export interface IBotEngineOptions {
   platform: string,
   botAccountIndex: number
}

export interface IBotEngine {
   init(): Promise<void>;
}