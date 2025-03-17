import BotEngine from '../../../bot-engine';
import axios from 'axios';
import jsonfile from 'jsonfile';

class ShopeeSellerRepository {
    private async getCookies(): Promise<any[]> {
        return await jsonfile.readFile(
            BotEngine.getSessionsPath({ platform: 'shopee_seller', botAccountIndex: 0 })
        );
    }

    private sanitizeCookies(cookies: any[]): any[] {
        return cookies.map((v: any) => ({
            name: v?.name,
            value: v?.value,
            domain: v?.domain,
            path: v?.path || '/',
            httpOnly: v?.httpOnly ?? false,
            secure: v?.secure ?? true,
            expires: v?.expires && Number.isFinite(v.expires) ? Math.floor(v.expires) : undefined,
        }));
    }

    private generateCookieHeader(cookies: any[], keysToFilter: string[]): string {
        return cookies
            .filter((session: any) => keysToFilter.includes(session.name))
            .map((session: any) => `${session.name}=${session.value}`)
            .join('; ');
    }

    public getProductAds2 = async (start_time: any, end_time: any): Promise<any> => {
        try {
            let cookies = await this.getCookies() ?? []; // Pastikan cookies selalu array
            
            if (cookies.length === 0) {
                throw new Error('No cookies found.');
            }
    
            // Pastikan BotEngine.page tersedia sebelum memanggil setCookie
            if (BotEngine.page) {
                await BotEngine.writeCookies
                await BotEngine.page.setCookie(...this.sanitizeCookies(cookies));
            } else {
                throw new Error('BotEngine.page is undefined.');
            }
    
            const spcCookie = cookies.find((cookie: any) => cookie.name === 'SPC_CDS')?.value;
            if (!spcCookie) {
                throw new Error('SPC_CDS cookie not found.');
            }
    
            const keysToFilter = [
                "REC_T_ID", "SPC_F", "_gcl_au", "_fbp", "SPC_CLIENTID", "SPC_EC", "SPC_ST",
                "SPC_SC_SESSION", "SPC_STK", "SC_DFP", "_QPWSDCXHZQA", "REC7iLP4Q", "SPC_U",
                "SPC_T_IV", "SPC_R_T_ID", "SPC_R_T_IV", "SPC_T_ID", "_ga", "_ga_SW6D8G0HXK",
                "SPC_CDS", "SPC_SEC_SI", "SPC_SI", "CTOKEN", "SPC_CDS_CHAT", "_sapid",
                "shopee_webUnique_ccd", "ds"
            ];
    
            const cookieReqHeader = this.generateCookieHeader(cookies, keysToFilter);
    
            const options = {
                method: 'POST',
                url: `https://seller.shopee.co.id/api/pas/v1/homepage/query/?SPC_CDS=${spcCookie}&SPC_CDS_VER=2`,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Cookie': cookieReqHeader,
                },
                timeout: 60000,
                data: {
                    filter_list: [
                        {
                            campaign_type: "new_cpc_homepage",
                            state: "all",
                            search_term: "",
                        }
                    ],
                    start_time: parseInt(String(start_time)),
                    end_time: parseInt(String(end_time)),
                    offset: 0,
                    limit: 1546
                }
            };
    
            const result = await axios(options);
            console.info('Product ads fetched successfully:', result.data);
            return result.data;
        } catch (error: any) {
            console.error('Error fetching product ads:', error?.message || error);
            throw new Error(error);
        }
    };    

    // public getProductKey = async (start_time: any, end_time: any, campaign_id_value: any): Promise<any> => {
    //     try {
    //         let cookies = await this.getCookies() ?? []; // Pastikan cookies selalu array
            
    //         if (cookies.length === 0) {
    //             throw new Error('No cookies found.');
    //         }
    
    //         // Pastikan BotEngine.page tersedia sebelum memanggil setCookie
    //         if (BotEngine.page) {
    //             await BotEngine.page.setCookie(...this.sanitizeCookies(cookies));
    //         } else {
    //             throw new Error('BotEngine.page is undefined.');
    //         }
    
    //         const spcCookie = cookies.find((cookie: any) => cookie.name === 'SPC_CDS')?.value;
    //         if (!spcCookie) {
    //             throw new Error('SPC_CDS cookie not found.');
    //         }
    
    //         const keysToFilter = [
    //             "REC_T_ID", "SPC_F", "_gcl_au", "_fbp", "SPC_CLIENTID", "SPC_EC", "SPC_ST",
    //             "SPC_SC_SESSION", "SPC_STK", "SC_DFP", "_QPWSDCXHZQA", "REC7iLP4Q", "SPC_U",
    //             "SPC_T_IV", "SPC_R_T_ID", "SPC_R_T_IV", "SPC_T_ID", "_ga", "_ga_SW6D8G0HXK",
    //             "SPC_CDS", "SPC_SEC_SI", "SPC_SI", "CTOKEN", "SPC_CDS_CHAT", "_sapid",
    //             "shopee_webUnique_ccd", "ds"
    //         ];
    
    //         const cookieReqHeader = this.generateCookieHeader(cookies, keysToFilter);
    
    //         const options = {
    //             method: 'POST',
    //             url: `https://seller.shopee.co.id/api/pas/v1/report/get/?SPC_CDS=${spcCookie}&SPC_CDS_VER=2`,
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Accept': 'application/json, text/plain, */*',
    //                 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    //                 'Cookie': cookieReqHeader,
    //             },
    //             timeout: 60000,
    //             data: {
    //                 filter_params: [
    //                     {
    //                         campaign_id: campaign_id_value
    //                     }
    //                 ],

    //                 start_time: parseInt(String(start_time)),
    //                 end_time: parseInt(String(end_time)),
    //             }
    //         };
    
    //         const result = await axios(options);
    //         console.info('Product ads fetched successfully:', result.data);
    //         return result.data;
    //     } catch (error: any) {
    //         console.error('Error fetching product ads:', error?.message || error);
    //         throw new Error(error);
    //     }
    // }; 

    public getUserInfo = async (): Promise<any> => {

        try {
            let cookies = await this.getCookies() ?? [];
            
            if (cookies.length === 0) {
                throw new Error('No cookies found.');
            }
    
            if (BotEngine.page) {
                await BotEngine.page.setCookie(...this.sanitizeCookies(cookies));
            } else {
                throw new Error('BotEngine.page is undefined.');
            }
    
            const spcCookie = cookies.find((cookie: any) => cookie.name === 'SPC_CDS')?.value;
            if (!spcCookie) {
                throw new Error('SPC_CDS cookie not found.');
            }
    
            const keysToFilter = [
                "REC_T_ID", "SPC_F", "_gcl_au", "_fbp", "SPC_CLIENTID", "SPC_EC", "SPC_ST",
                "SPC_SC_SESSION", "SPC_STK", "SC_DFP", "_QPWSDCXHZQA", "REC7iLP4Q", "SPC_U",
                "SPC_T_IV", "SPC_R_T_ID", "SPC_R_T_IV", "SPC_T_ID", "_ga", "_ga_SW6D8G0HXK",
                "SPC_CDS", "SPC_SEC_SI", "SPC_SI", "CTOKEN", "SPC_CDS_CHAT", "_sapid",
                "shopee_webUnique_ccd", "ds"
            ];
    
            const cookieReqHeader = this.generateCookieHeader(cookies, keysToFilter);
    
            const options = {
                method: 'GET',
                url: `https://seller.shopee.co.id/api/sellermanagement_seller/v1/shop/profile/info?SPC_CDS=${spcCookie}&SPC_CDS_VER=2`,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                    'Cookie': cookieReqHeader,
                },
                timeout: 60000,
            };
    
            const result = await axios(options);
            console.info('Product ads fetched successfully:', result.data);
            return result.data;
        } catch (error: any) {
            console.error('Error fetching product ads:', error?.message || error);
            throw new Error(error);
        }
    }; 
    

public getProductStock = async (): Promise<any> => {
    try {
        let cookies = await this.getCookies() ?? [];
        
        if (cookies.length === 0) {
            throw new Error('No cookies found.');
        }

        if (BotEngine.page) {
            await BotEngine.page.setCookie(...this.sanitizeCookies(cookies));
        } else {
            throw new Error('BotEngine.page is undefined.');
        }

        const spcCookie = cookies.find((cookie: any) => cookie.name === 'SPC_CDS')?.value;
        if (!spcCookie) {
            throw new Error('SPC_CDS cookie not found.');
        }

        const keysToFilter = [
            "REC_T_ID", "SPC_F", "_gcl_au", "_fbp", "SPC_CLIENTID", "SPC_EC", "SPC_ST",
            "SPC_SC_SESSION", "SPC_STK", "SC_DFP", "_QPWSDCXHZQA", "REC7iLP4Q", "SPC_U",
            "SPC_T_IV", "SPC_R_T_ID", "SPC_R_T_IV", "SPC_T_ID", "_ga", "_ga_SW6D8G0HXK",
            "SPC_CDS", "SPC_SEC_SI", "SPC_SI", "CTOKEN", "SPC_CDS_CHAT", "_sapid",
            "shopee_webUnique_ccd", "ds"
        ];

        const cookieReqHeader = this.generateCookieHeader(cookies, keysToFilter);

        const optionsTest = {
            method: 'GET',
            url: `https://seller.shopee.co.id/api/v3/mpsku/list/v2/get_product_list?SPC_CDS=${spcCookie}&SPC_CDS_VER=2&page_number=1&page_size=12&list_type=live_all&need_ads=true`,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Cookie': cookieReqHeader,
            },
            timeout: 60000,
            data: {
                SPC_CDS: spcCookie,
                SPC_CDS_VER: 2,
                page_number: 1,
                page_size: 12,
                list_type: "live_all",
                need_ads: true
            }
        };

        const resultTest = await axios(optionsTest);

        console.log('API Response:', JSON.stringify(resultTest.data, null, 2));

        const page_number = resultTest?.data?.page_info?.page_number
        const page_size = resultTest?.data?.page_info?.page_size

        const optionsFinal = {
            method: 'GET',
            url: `https://seller.shopee.co.id/api/v3/mpsku/list/v2/get_product_list?SPC_CDS=${spcCookie}&SPC_CDS_VER=2&`,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Cookie': cookieReqHeader,
            },
            timeout: 60000,
            data: {
                need_ads: true,
                page_number: page_number,
                page_size: page_size 
            }
        };

        const resultFinal = await axios(optionsTest);
        console.info('Product ads fetched successfully:', resultFinal);
        return resultFinal.data;
    } catch (error: any) {
        console.error('Error fetching product ads:', error?.message || error);
        throw new Error(error);
    }
};

    
}

export default ShopeeSellerRepository;
