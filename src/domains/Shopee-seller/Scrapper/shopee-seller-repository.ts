import BotEngine from '../../../bot-engine';
import axios from 'axios';
import { delay } from 'bluebird';
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

    public fetchCookies = async (): Promise<any> => {
        const homePage = 'https://seller.shopee.co.id/'

        await BotEngine.page?.goto(homePage, { waitUntil: 'load' })
        await delay(10000)
        await BotEngine.writeCookies({ platform: 'shopee_seller', botAccountIndex: 0 })
    }

    public getProductStock = async (): Promise<any> => {
        try {
            const cookies = await this.getCookies() ?? [];

            if (cookies.length === 0) {
                throw new Error('Cookie tidak ditemukan.');
            }

            if (!BotEngine.page) {
                throw new Error('BotEngine.page tidak tersedia.');
            }

            await BotEngine.page.setCookie(...this.sanitizeCookies(cookies));

            const spcCookie = cookies.find((cookie: any) => cookie.name === 'SPC_CDS')?.value;
            if (!spcCookie) {
                throw new Error('Cookie SPC_CDS tidak ditemukan.');
            }

            const keysToFilter = [
                "REC_T_ID", "SPC_F", "_gcl_au", "_fbp", "SPC_CLIENTID", "SPC_EC", "SPC_ST",
                "SPC_SC_SESSION", "SPC_STK", "SC_DFP", "_QPWSDCXHZQA", "REC7iLP4Q", "SPC_U",
                "SPC_T_IV", "SPC_R_T_ID", "SPC_R_T_IV", "SPC_T_ID", "_ga", "_ga_SW6D8G0HXK",
                "SPC_CDS", "SPC_SEC_SI", "SPC_SI", "CTOKEN", "SPC_CDS_CHAT", "_sapid",
                "shopee_webUnique_ccd", "ds"
            ];

            const cookieHeader = this.generateCookieHeader(cookies, keysToFilter);

            const baseHeaders = {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0',
                'Cookie': cookieHeader,
            };

            const firstResponse = await axios({
                method: 'GET',
                url: `https://seller.shopee.co.id/api/v3/mpsku/list/v2/get_product_list?SPC_CDS=${spcCookie}&SPC_CDS_VER=2&page_number=1&page_size=12&list_type=live_all&need_ads=true`,
                headers: baseHeaders,
                timeout: 60000
            });

            const { page_number, page_size } = firstResponse?.data?.page_info ?? { page_number: 1, page_size: 12 };

            const stockResponse = await axios({
                method: 'GET',
                url: `https://seller.shopee.co.id/api/v3/mpsku/list/v2/get_product_list?SPC_CDS=${spcCookie}&SPC_CDS_VER=2&page_number=${page_number}&page_size=${page_size}&list_type=live_all&need_ads=true`,
                headers: baseHeaders,
                timeout: 60000
            });

            const shopInfoResponse = await axios({
                method: 'GET',
                url: `https://seller.shopee.co.id/api/framework/selleraccount/shop_info/?SPC_CDS=${spcCookie}&SPC_CDS_VER=2&_cache_api_sw_v1_=1`,
                headers: baseHeaders,
                timeout: 60000
            });

            console.info('Data stok produk berhasil diambil.');
            return {
                shop_id: shopInfoResponse.data?.shop_id,
                stock_info: stockResponse.data
            };

        } catch (error: any) {
            console.error('Gagal mengambil data stok produk:', error?.message || error);
            throw new Error(error);
        }
    };


    public getProductAds2 = async (startTime: any, endTime: any): Promise<any> => {
        try {
            const cookies = await this.getCookies() ?? [];

            if (cookies.length === 0) {
                throw new Error('Cookie tidak ditemukan.');
            }

            if (!BotEngine.page) {
                throw new Error('BotEngine.page tidak tersedia.');
            }

            await BotEngine.page.setCookie(...this.sanitizeCookies(cookies));

            const spcCdsValue = cookies.find((cookie: any) => cookie.name === 'SPC_CDS')?.value;
            if (!spcCdsValue) {
                throw new Error('Cookie SPC_CDS tidak ditemukan.');
            }

            const cookieKeys = [
                "REC_T_ID", "SPC_F", "_gcl_au", "_fbp", "SPC_CLIENTID", "SPC_EC", "SPC_ST",
                "SPC_SC_SESSION", "SPC_STK", "SC_DFP", "_QPWSDCXHZQA", "REC7iLP4Q", "SPC_U",
                "SPC_T_IV", "SPC_R_T_ID", "SPC_R_T_IV", "SPC_T_ID", "_ga", "_ga_SW6D8G0HXK",
                "SPC_CDS", "SPC_SEC_SI", "SPC_SI", "CTOKEN", "SPC_CDS_CHAT", "_sapid",
                "shopee_webUnique_ccd", "ds"
            ];

            const cookieHeader = this.generateCookieHeader(cookies, cookieKeys);

            const productAdsRequest = {
                method: 'POST',
                url: `https://seller.shopee.co.id/api/pas/v1/homepage/query/?SPC_CDS=${spcCdsValue}&SPC_CDS_VER=2`,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0',
                    'Cookie': cookieHeader,
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
                    start_time: parseInt(String(startTime)),
                    end_time: parseInt(String(endTime)),
                    offset: 0,
                    limit: 9999
                }
            };

            const shopInfoRequest = {
                method: 'GET',
                url: `https://seller.shopee.co.id/api/framework/selleraccount/shop_info/?SPC_CDS=${spcCdsValue}&SPC_CDS_VER=2&_cache_api_sw_v1_=1`,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0',
                    'Cookie': cookieHeader,
                },
                timeout: 60000,
            };

            const productAdsResponse = await axios(productAdsRequest);
            const shopInfoResponse = await axios(shopInfoRequest);

            console.info('Iklan produk berhasil diambil:', productAdsResponse.data);

            return {
                shop_id: shopInfoResponse.data.shop_id,
                profile_info: productAdsResponse.data
            };

        } catch (error: any) {
            console.error('Gagal mengambil iklan produk:', error?.message || error);
            throw new Error(error);
        }
    };


    public getProductAdsInfo = async (): Promise<any> => {
        try {
            let cookies = await this.getCookies() ?? [];

            if (cookies.length === 0) {
                throw new Error('Cookie tidak ditemukan.');
            }

            if (BotEngine.page) {
                await BotEngine.page.setCookie(...this.sanitizeCookies(cookies));
            } else {
                throw new Error('BotEngine.page tidak tersedia.');
            }

            const spcCookie = cookies.find((cookie: any) => cookie.name === 'SPC_CDS')?.value;
            if (!spcCookie) {
                throw new Error('Cookie SPC_CDS tidak ditemukan.');
            }

            const keysToFilter = [
                "REC_T_ID", "SPC_F", "_gcl_au", "_fbp", "SPC_CLIENTID", "SPC_EC", "SPC_ST",
                "SPC_SC_SESSION", "SPC_STK", "SC_DFP", "_QPWSDCXHZQA", "REC7iLP4Q", "SPC_U",
                "SPC_T_IV", "SPC_R_T_ID", "SPC_R_T_IV", "SPC_T_ID", "_ga", "_ga_SW6D8G0HXK",
                "SPC_CDS", "SPC_SEC_SI", "SPC_SI", "CTOKEN", "SPC_CDS_CHAT", "_sapid",
                "shopee_webUnique_ccd", "ds"
            ];

            const cookieReqHeader = this.generateCookieHeader(cookies, keysToFilter);

            const optionsId = {
                method: 'GET',
                url: `https://seller.shopee.co.id/api/framework/selleraccount/shop_info/?SPC_CDS=${spcCookie}&SPC_CDS_VER=2&_cache_api_sw_v1_=1`,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0',
                    'Cookie': cookieReqHeader,
                },
                timeout: 60000,
            };

            const resultId = await axios(optionsId);
            console.info(resultId);
            return resultId.data
        } catch (error: any) {
            console.error('Gagal mengambil iklan produk:', error?.message || error);
            throw new Error(error);
        }
    };

    public getProductKey = async (startTime: any, endTime: any, campaignIdValue: any): Promise<any> => {
        try {
            const cookies = await this.getCookies() ?? [];
            if (cookies.length === 0) {
                throw new Error('Cookie tidak ditemukan.');
            }

            if (!BotEngine.page) {
                throw new Error('BotEngine.page tidak tersedia.');
            }

            await BotEngine.page.setCookie(...this.sanitizeCookies(cookies));

            const spcCdsValue = cookies.find((cookie: any) => cookie.name === 'SPC_CDS')?.value;
            if (!spcCdsValue) {
                throw new Error('Cookie SPC_CDS tidak ditemukan.');
            }

            const cookieKeys = [
                "REC_T_ID", "SPC_F", "_gcl_au", "_fbp", "SPC_CLIENTID", "SPC_EC", "SPC_ST",
                "SPC_SC_SESSION", "SPC_STK", "SC_DFP", "_QPWSDCXHZQA", "REC7iLP4Q", "SPC_U",
                "SPC_T_IV", "SPC_R_T_ID", "SPC_R_T_IV", "SPC_T_ID", "_ga", "_ga_SW6D8G0HXK",
                "SPC_CDS", "SPC_SEC_SI", "SPC_SI", "CTOKEN", "SPC_CDS_CHAT", "_sapid",
                "shopee_webUnique_ccd", "ds"
            ];

            const cookieHeader = this.generateCookieHeader(cookies, cookieKeys);

            const keywordReportRequest = {
                method: 'POST',
                url: `https://seller.shopee.co.id/api/pas/v1/report/get/?SPC_CDS=${spcCdsValue}&SPC_CDS_VER=2`,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0',
                    'Cookie': cookieHeader,
                },
                timeout: 60000,
                data: {
                    start_time: parseInt(String(startTime)),
                    end_time: parseInt(String(endTime)),
                    campaign_type: "product",
                    agg_type: "keyword",
                    campaign_id: campaignIdValue,
                    need_ratio: true
                }
            };

            const keywordReportResponse = await axios(keywordReportRequest);
            console.info('Kata kunci iklan berhasil diambil:', keywordReportResponse.data);
            return keywordReportResponse.data;

        } catch (error: any) {
            console.error('Gagal mengambil kata kunci iklan:', error?.message || error);
            throw new Error(error);
        }
    };


    public getUserInfo = async (): Promise<any> => {
        try {
            const cookies = await this.getCookies() ?? [];

            if (cookies.length === 0) {
                throw new Error('Cookie tidak ditemukan.');
            }

            if (!BotEngine.page) {
                throw new Error('BotEngine.page tidak tersedia.');
            }

            await BotEngine.page.setCookie(...this.sanitizeCookies(cookies));

            const spcCdsValue = cookies.find((cookie: any) => cookie.name === 'SPC_CDS')?.value;
            if (!spcCdsValue) {
                throw new Error('Cookie SPC_CDS tidak ditemukan.');
            }

            const cookieKeys = [
                "REC_T_ID", "SPC_F", "_gcl_au", "_fbp", "SPC_CLIENTID", "SPC_EC", "SPC_ST",
                "SPC_SC_SESSION", "SPC_STK", "SC_DFP", "_QPWSDCXHZQA", "REC7iLP4Q", "SPC_U",
                "SPC_T_IV", "SPC_R_T_ID", "SPC_R_T_IV", "SPC_T_ID", "_ga", "_ga_SW6D8G0HXK",
                "SPC_CDS", "SPC_SEC_SI", "SPC_SI", "CTOKEN", "SPC_CDS_CHAT", "_sapid",
                "shopee_webUnique_ccd", "ds"
            ];

            const cookieHeader = this.generateCookieHeader(cookies, cookieKeys);

            const profileInfoRequest = {
                method: 'GET',
                url: `https://seller.shopee.co.id/api/sellermanagement_seller/v1/shop/profile/info?SPC_CDS=${spcCdsValue}&SPC_CDS_VER=2`,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0',
                    'Cookie': cookieHeader,
                },
                timeout: 60000,
            };

            const shopInfoRequest = {
                method: 'GET',
                url: `https://seller.shopee.co.id/api/framework/selleraccount/shop_info/?SPC_CDS=${spcCdsValue}&SPC_CDS_VER=2&_cache_api_sw_v1_=1`,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0',
                    'Cookie': cookieHeader,
                },
                timeout: 60000,
            };

            const profileInfoResponse = await axios(profileInfoRequest);
            const shopInfoResponse = await axios(shopInfoRequest);

            console.info('Informasi pengguna berhasil diambil:');
            return {
                shop_info: shopInfoResponse.data,
                profile_info: profileInfoResponse.data
            };

        } catch (error: any) {
            console.error('Gagal mengambil informasi pengguna:', error?.message || error);
            throw new Error(error);
        }
    }


    public getProductPerformance = async (startTime: any, endTime: any): Promise<any> => {
        try {
            const cookies = await this.getCookies() ?? [];

            if (cookies.length === 0) {
                throw new Error('Tidak ditemukan cookie.');
            }

            if (!BotEngine.page) {
                throw new Error('BotEngine.page tidak terdefinisi.');
            }

            await BotEngine.page.setCookie(...this.sanitizeCookies(cookies));

            const spcCdsValue = cookies.find((cookie: any) => cookie.name === 'SPC_CDS')?.value;
            if (!spcCdsValue) {
                throw new Error('Cookie SPC_CDS tidak ditemukan.');
            }

            const cookieKeys = [
                "REC_T_ID", "SPC_F", "_gcl_au", "_fbp", "SPC_CLIENTID", "SPC_EC", "SPC_ST",
                "SPC_SC_SESSION", "SPC_STK", "SC_DFP", "_QPWSDCXHZQA", "REC7iLP4Q", "SPC_U",
                "SPC_T_IV", "SPC_R_T_ID", "SPC_R_T_IV", "SPC_T_ID", "_ga", "_ga_SW6D8G0HXK",
                "SPC_CDS", "SPC_SEC_SI", "SPC_SI", "CTOKEN", "SPC_CDS_CHAT", "_sapid",
                "shopee_webUnique_ccd", "ds"
            ];

            const cookieHeader = this.generateCookieHeader(cookies, cookieKeys);

            const previewRequestOptions = {
                method: 'GET',
                url: `https://seller.shopee.co.id/api/mydata/v3/product/performance/?SPC_CDS=${spcCdsValue}&SPC_CDS_VER=2&start_time=${startTime}&end_time=${endTime}&period=real_time&metric_ids=all&order_by=placed_units.desc&page_size=20&page_num=1&category_type=shopee&category_id=-1&keyword=`,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Cookie': cookieHeader,
                },
                timeout: 60000,
                data: {
                    SPC_CDS: spcCdsValue,
                    SPC_CDS_VER: 2,
                    page_number: 1,
                    page_size: 20,
                    start_time: parseInt(String(startTime)),
                    end_time: parseInt(String(endTime))
                }
            };

            const previewResponse = await axios(previewRequestOptions);
            console.log('Respons API awal berhasil diambil:', JSON.stringify(previewResponse.data, null, 2));

            const currentPage = previewResponse?.data?.page_info?.page_number;
            const currentPageSize = previewResponse?.data?.page_info?.page_size;

            const finalRequestOptions = {
                method: 'GET',
                url: `https://seller.shopee.co.id/api/mydata/v3/product/performance/?SPC_CDS=${spcCdsValue}&SPC_CDS_VER=2&start_time=${startTime}&end_time=${endTime}&period=real_time&metric_ids=all&order_by=placed_units.desc&page_size=${currentPageSize}&page_num=${currentPage}&category_type=shopee&category_id=-1&keyword=`,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Cookie': cookieHeader,
                },
                timeout: 60000,
                data: {
                    page_number: currentPage,
                    page_size: currentPageSize,
                    SPC_CDS: spcCdsValue,
                    SPC_CDS_VER: 2,
                    start_time: parseInt(String(startTime)),
                    end_time: parseInt(String(endTime))
                }
            };

            const shopInfoRequest = {
                method: 'GET',
                url: `https://seller.shopee.co.id/api/framework/selleraccount/shop_info/?SPC_CDS=${spcCdsValue}&SPC_CDS_VER=2&_cache_api_sw_v1_=1`,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0',
                    'Cookie': cookieHeader,
                },
                timeout: 60000,
            };

            const finalResponse = await axios(finalRequestOptions);
            const shopInfoResponse = await axios(shopInfoRequest);

            console.info('Data iklan produk berhasil diambil:', finalResponse);

            return {
                shop_info: shopInfoResponse.data,
                product_performance: finalResponse.data
            };

        } catch (error: any) {
            console.error('Terjadi kesalahan saat mengambil data iklan produk:', error?.message || error);
            throw new Error(error);
        }
    };
}

export default ShopeeSellerRepository;