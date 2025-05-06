import BotEngine from '../../../bot-engine';
import axios from 'axios';
import { delay } from 'bluebird';
import { error } from 'console';
import jsonfile from 'jsonfile';
import readline from 'readline';

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



    public LoginShopee = async (): Promise<any> => {
        const loginUrl = 'https://accounts.shopee.co.id/seller/login';

        // Navigasi ke halaman login
        await BotEngine.page?.goto(loginUrl, { waitUntil: 'load' });

        // Klik tombol login awal
        await BotEngine.page?.waitForSelector('.gLYGM2');
        await BotEngine.page?.click('.gLYGM2');
        console.log('Tombol login diklik.');

        // Tunggu input email
        await BotEngine.page?.waitForSelector('.shopee-input__input');

        // Cek apakah input email sudah terisi
        const emailValue = await BotEngine.page?.$eval('.shopee-input__input', el => (el as HTMLInputElement).value);
        if (!emailValue || emailValue.trim() === '') {
            await BotEngine.page?.type('.shopee-input__input', 'SCA.AMK:ananda', { delay: 100 });
        } else {
            await BotEngine.page?.click('.shopee-input__input');
            await BotEngine.page?.keyboard.press('Tab');
            console.log('Email sudah terisi, lanjut ke password.');
        }

        // Isi password
        await BotEngine.page?.waitForSelector('.password.form-item');
        await BotEngine.page?.click('.password.form-item');
        await BotEngine.page?.type('.password.form-item', 'Jkt123$.', { delay: 100 });

        // Klik tombol login setelah isi password
        await BotEngine.page?.waitForSelector('.shopee-button.login-btn.shopee-button--primary.shopee-button--large.shopee-button--block');
        await BotEngine.page?.click('.shopee-button.login-btn.shopee-button--primary.shopee-button--large.shopee-button--block');
        console.log('Tombol login utama diklik.');

        // Klik tombol berdasarkan teks "Kirim ke No. Handphone"
        const [otpButton] = await (BotEngine.page as any).$x("//button[contains(text(), 'Kirim ke No. Handphone')]");
        if (otpButton) {
            await otpButton.click();
            console.log('Tombol "Kirim ke No. Handphone" diklik berdasarkan teks.');
        } else {
            console.log('Tombol tidak ditemukan berdasarkan teks.');
        }



        // Tunggu input OTP muncul
        await BotEngine.page?.waitForSelector('.otp-input-class'); // Ganti dengan class OTP input yang benar

        // Ambil input OTP dari console
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const otp: string = await new Promise((resolve) => {
            rl.question('Masukkan OTP yang diterima: ', (answer) => {
                rl.close();
                resolve(answer.trim());
            });
        });

        // Input OTP ke form
        await BotEngine.page?.type('.otp-input-class', otp, { delay: 100 }); // Ganti dengan class input OTP yang benar

        // Klik tombol verifikasi
        await BotEngine.page?.click('.verify-button-class'); // Ganti dengan class tombol verifikasi OTP

        // Tunggu proses selesai
        await BotEngine.page?.waitForNavigation({ waitUntil: 'load' });

        console.log('Login berhasil dengan OTP.');
    };

    public getYesterdayStartEpoch = async (): Promise<any> => {
        const WIB_OFFSET = 7 * 60 * 60 * 1000;
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
    
        const startDate = new Date(yesterday);
        startDate.setHours(0, 0, 1, 0); // 00:00:01 WIB
        const startEpoch = Math.floor((startDate.getTime() - WIB_OFFSET) / 1000);
    
        return startEpoch;
    };

    public getYesterdayEndEpoch = async (): Promise<any> => {
        const WIB_OFFSET = 7 * 60 * 60 * 1000;
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
    
        const endDate = new Date(yesterday);
        endDate.setHours(23, 59, 59, 0); // 23:59:59 WIB
        const endEpoch = Math.floor((endDate.getTime() - WIB_OFFSET) / 1000);
    
        return endEpoch;
    };

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
            return resultId.data
        } catch (error: any) {
            console.error('Gagal mengambil iklan produk:', error?.message || error);
            throw new Error(error);
        }
    };

    public getProductKey = async (startTime: any, endTime: any, campaignIdValue: any): Promise<any> => {
        try {
            console.info('masuk')
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
                    agg_type: "keyword",
                    campaign_type: "product",
                    end_time: endTime,
                    filter_params: {
                      campaign_id: campaignIdValue
                    },
                    header: {},
                    need_ratio: true,
                    start_time: startTime
                  }
            };
            console.info(keywordReportRequest)

            const keywordReportResponse = await axios(keywordReportRequest);
            console.info('ini', keywordReportRequest)
            console.info('Kata kunci iklan berhasil diambil:', keywordReportResponse.data);
            return {
                campaignId: campaignIdValue,
                keyword_info: keywordReportResponse.data
            };

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

            const finalResponse = await axios(previewRequestOptions);
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