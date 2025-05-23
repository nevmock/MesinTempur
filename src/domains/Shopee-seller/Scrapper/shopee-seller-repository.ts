import BotEngine from '../../../bot-engine';
import axios from 'axios';
import { delay } from 'bluebird';
import { error } from 'console';
import jsonfile from 'jsonfile';
import readline from 'readline';

class ShopeeSellerRepository {
    private cookiesKey = [
                "REC_T_ID", "SPC_F", "_gcl_au", "_fbp", "SPC_CLIENTID", "SPC_EC", "SPC_ST",
                "SPC_SC_SESSION", "SPC_STK", "SC_DFP", "_QPWSDCXHZQA", "REC7iLP4Q", "SPC_U",
                "SPC_T_IV", "SPC_R_T_ID", "SPC_R_T_IV", "SPC_T_ID", "_ga", "_ga_SW6D8G0HXK",
                "SPC_CDS", "SPC_SEC_SI", "SPC_SI", "CTOKEN", "SPC_CDS_CHAT", "_sapid",
                "shopee_webUnique_ccd", "ds", "SC_SSO", "SC_SSO_U", "SPC_SC_OFFLINE_TOKEN"
            ];

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
            // .filter((session: any) => keysToFilter.includes(session.name))
            .map((session: any) => `${session.name}=${session.value}`)
            .join('; ');
    }

    public fetchCookies = async (): Promise<any> => {
        const homePage = 'https://seller.shopee.co.id/'

        await BotEngine.page?.goto(homePage, { waitUntil: 'load' })
        await delay(10000)
        await BotEngine.writeCookies({ platform: 'shopee_seller', botAccountIndex: 0 })
    }



    public initLoginShopee = async (): Promise<any> => {
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

    };

    public otpLoginShopee = async (): Promise<any> => {
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
        startDate.setHours(0, 0, 0, 0); // 00:00:01 WIB
        const startEpoch = Math.floor((startDate.getTime()) / 1000);

        return startEpoch;
    };

    public getYesterdayEndEpoch = async (): Promise<any> => {
        const WIB_OFFSET = 7 * 60 * 60 * 1000;
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);

        const endDate = new Date(yesterday);
        endDate.setHours(23, 59, 59, 999); // 23:59:59 WIB
        const endEpoch = Math.floor((endDate.getTime()) / 1000);

        return endEpoch;
    };

    public getShopInfo = async (): Promise<any> => {
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


            const cookieHeader = this.generateCookieHeader(cookies, this.cookiesKey);


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

            const shopInfoResponse = await axios(shopInfoRequest);
            return shopInfoResponse.data.data.shop_id

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

            const cookieReqHeader = this.generateCookieHeader(cookies, this.cookiesKey);

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


            const cookieHeader = this.generateCookieHeader(cookies, this.cookiesKey);

            // Request pertama untuk mendapatkan total halaman
            const initialResponse = await axios({
                method: 'GET',
                url: `https://seller.shopee.co.id/api/v3/mpsku/list/v2/get_product_list?SPC_CDS=${spcCookie}&SPC_CDS_VER=2&page_number=1&page_size=12&list_type=live_all&need_ads=true`,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0',
                    'Cookie': cookieHeader,
                },
                timeout: 60000
            });

            const total = initialResponse.data.data.page_info.total;
            const pageSize = initialResponse.data.data.page_info.page_size;

            const totalPages = Math.ceil(total / pageSize);
            const allProducts: any[] = [];

            for (let page = 1; page <= totalPages; page++) {
                const response = await axios({
                    method: 'GET',
                    url: `https://seller.shopee.co.id/api/v3/mpsku/list/v2/get_product_list?SPC_CDS=${spcCookie}&SPC_CDS_VER=2&page_number=${page}&page_size=${pageSize}&list_type=live_all&need_ads=true`,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json, text/plain, */*',
                        'User-Agent': 'Mozilla/5.0',
                        'Cookie': cookieHeader,
                    },
                    timeout: 60000
                });

                const products = response.data.data.products;
                if (Array.isArray(products)) {
                    allProducts.push(...products);
                }
            }

            console.info(`Berhasil mengambil ${allProducts.length} produk dari ${totalPages} halaman.`);
            return allProducts;

        } catch (error: any) {
            console.error('Gagal mengambil data stok produk:', error?.message || error);
            throw new Error(error?.message || 'Unknown error');
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


            const cookieHeader = this.generateCookieHeader(cookies, this.cookiesKey);

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

            const productAdsResponse = await axios(productAdsRequest);
            return productAdsResponse.data

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

            const cookieHeader = this.generateCookieHeader(cookies, this.cookiesKey);
            // const keywordReportRequest = {
            //     method: 'POST',
            //     url: `https://seller.shopee.co.id/api/pas/v1/report/get/?SPC_CDS=${spcCdsValue}&SPC_CDS_VER=2`,
            //     headers: {
            //         'Content-Type': 'application/json;charset=UTF-8',
            //         'Accept': 'application/json, text/plain, */*',
            //         'User-Agent': 'Mozilla/5.0',
            //         'Cookie': cookieHeader,
            //         'Content-Length': 158,
            //         'Accept-Encoding': 'gzip, deflate, br, zstd',
            //         'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            //     },
            //     timeout: 60000,
            //     data: {"start_time":1747501200,"end_time":1748105999,"campaign_type":"product","agg_type":"new_product_boost","filter_params":{"campaign_id":316755336},"header":{}}
            // };

            const keywordReportRequest = {
                method: 'POST',
                url: `https://seller.shopee.co.id/api/pas/v1/report/get/?SPC_CDS=${spcCdsValue}&SPC_CDS_VER=2`,
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8',
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
                    'Cookie': 'SPC_SC_SA_TK=; SPC_SC_SA_UD=; REC_T_ID=4c1484fa-e3c8-11ef-bbec-9ad163857bc6; SPC_F=IY7GzDi9FEw4lWnyRX31zV4Q9gktofmG; _fbp=fb.2.1738763489092.17180720863568830; SPC_CLIENTID=SVk3R3pEaTlGRXc0ogqknsydekmfnrpf; SC_DFP=kOwbJshlfDmSpGJtccCAFWtFnzgBeOJE; _QPWSDCXHZQA=93e8a074-d122-4d1b-8573-a0d7b2ba2384; REC7iLP4Q=7a2306e3-deba-4e42-9d3d-81b2ccb6245d; SPC_CDS_CHAT=46487d2a-47c8-4184-b5fd-4653ee3c39e7; _gcl_gs=2.1.k1$i1740382820$u245648710; _gcl_aw=GCL.1740382823.Cj0KCQiAq-u9BhCjARIsANLj-s1_GxG6WZiUFmsJr4sCsKJ-smYKo-3Qgh5M7ljsgpB-5VnG-pVh_qEaAlTyEALw_wcB; _gac_UA-61904553-8=1.1740382823.Cj0KCQiAq-u9BhCjARIsANLj-s1_GxG6WZiUFmsJr4sCsKJ-smYKo-3Qgh5M7ljsgpB-5VnG-pVh_qEaAlTyEALw_wcB; _ga_PN56VNNPQX=GS1.3.1740995273.1.0.1740995273.0.0.0; _ga_QMX630BLLS=GS1.1.1741222690.1.0.1741222690.60.0.0; fulfillment-language=id; _gcl_au=1.1.1502643919.1746859156; SPC_CDS=d0cb8505-c446-4300-948b-319d7fb17613; _sapid=ca946380b81bcfe7cfc9af82c692d5788c69243f5f75bbac3996539a; SPC_U=-; SPC_EC=-; SPC_R_T_ID=Sbyh2ShrZ85YwKndQuh4cxuoy4VuU15l1fkR9qCLUoNU3CaktexnYyprhDSZzHVooYM19IGCjie90l3C35mYfI0uKDucCuCpg7oJzkFTisH7UZMuhrCkaru8J2Nq0Cv3d6UHwUOsVRnS9tN3jtbwZpb8xlYtgT2vUAO7B8N1efQ=; SPC_R_T_IV=cWxyaTZlOGtiMExmRjFTUw==; SPC_T_ID=Sbyh2ShrZ85YwKndQuh4cxuoy4VuU15l1fkR9qCLUoNU3CaktexnYyprhDSZzHVooYM19IGCjie90l3C35mYfI0uKDucCuCpg7oJzkFTisH7UZMuhrCkaru8J2Nq0Cv3d6UHwUOsVRnS9tN3jtbwZpb8xlYtgT2vUAO7B8N1efQ=; SPC_T_IV=cWxyaTZlOGtiMExmRjFTUw==; SPC_SI=kZUuaAAAAABxclY4c01nOXACeAAAAAAAMjZHbkNEaGw=; AMP_TOKEN=%24NOT_FOUND; _gid=GA1.3.783363592.1748027372; SPC_SI=kZUuaAAAAABxclY4c01nOXACeAAAAAAAMjZHbkNEaGw=; SPC_SEC_SI=v1-RmxGMGQyUE01Qlk5MUl6SXU7klEuV2N9xxB+7O/t95EkC5IPStml/d2RHS9nb1v53Ic2mQHD8NZ/uHzoV24bjda3UPzF8gZQuvun+DI50TY=; _ga=GA1.1.2004969604.1738763489; _ga_SW6D8G0HXK=GS2.1.s1748027373$o41$g0$t1748027378$j55$l0$h0$dvd7Dt5dBNtMdOBbMgArkFnQ7nXlKzP8pOg; SPC_SC_SESSION=g57J0aEvpwdiStmCerl6EKYsnLnFQa0I2iEsCFnbFdgSwk7PcZAyHgGWjKsDw87hLLX66BSBoU7lfSog/qax1R1EGb2chFdrqkGzlsSWtNIXF/9gQb7PJEMYra/azSk2Ho7t1oPE5qg5QmG1vqmWbTqr623kDL0eRWsfNjbdKLiORyKqNuckrl+ii2FA7NVS8/AdVPpYmzRjXRGWrwiOraqZ4/qX0N5lMVY9ycUVI7RmDgXHy7Z+RRiad5ZCF+4KkH+aA6jLApE2pJ4Xx4iha3sKSgoBZbMJcpTa9crQJbgy9OefrFyn2nou7V83QtfNqN1j2AKmA6zyG+F38UnKrHWUaexl0pkxMsUUtM0rCKygF9XS86NzlBr2cMSVUBhzFIUcJeqgB/HDOBEeDuvw0IF9y6kpqKhMMtIEf3LUl5AQ=_2_2095441; SC_SSO=ZlQ1UDhPelczblNWZXRJUJoVzHpIgkW9DUfg8sOFjcE+xQFPN3szolynB025fJKm; SC_SSO_U=2095441; SPC_STK=mVnenP3kMhUIFNe36xvKcoJUbJVzqP9EQEOictIoOXK9ztK9Lznk+QxCXkpjOxSf7LvkNXMRsJK95Qvn/hMbTA4L5w7gkOXbM4xTGpYA4Iht0MvBsN05ylVeLvfipdJnYBk5SEsfBBCemwEyjGzH8ecFyOsKGtohZRAiuOzZ3U9qQYhGqjrODNlNVau8CzKtM39tthaT29ujW1DwuQIivWaBln7s6xuL5+Rup/8sX8RGb29W4K+XCFbfvOXxB/5Ba5qa7kpyOvhDsacpjUSyfzoMT946PhP8Mq5xC/QuXryAl5DisBE1VtArlecN4gWeV+7bY31SFV85/3iqiWkuaabjK+wWx0njm8pZKVqvZOdD5FeiOhns55i0qtwqGik9bswXHBgziRkMGW6jqu+Y5DhDC/vqaK2bEju+13/yzbByQ4yLNJANP+NPCSHhb12i4JTJhrfED+1sOFeXfOUZS/4jKhRX0ciJ8ay1GBQuqxqpD15IDG4xWSye1rB6vSORM3bQ8t+vvDdx9g1qZHwjIqzjuDS7ueoClP+scVfLzaqQTWHgRlvmgUMp5qkv4U+o0f8hXqGJTX0PMMVTmVQrEvypDdxuDK421nOfR5+4Kqucy1BNjx1PNFdJpALYlBiXucsQfickK1BE8jxy6B7OQbph3r7qoWFvd8Lkz3BJOwEScDjoqOdjxSCQl9JjKuldxQaoh3R+8IusmBAd84MS0w==; SPC_SC_OFFLINE_TOKEN=eyJkYXRhIjoiRDltQnBNcGd5UlN1SmkwOXE2YkE1V05SWmhSNzE0TEdXaTRmejJlY3JRMGR3T2xJazVXMlR5cWNsUS9wdjFPS3A1VVFqNUZsVnREMzFmTHdnbXZML3FHU0owVEhwaGNWSlhCY3phWm12ZmVJeXVBUmtwOXZEdFg0NDdkdlJLclh0UDlwN1NGVDFBemR1UEdDN25hZUxuQ1F1d0VuT1lxcjhWZ0R6WVRiTXZnOFJpb1I0U1MxaENQMmNqNWk3OVBqa3ZaSUhFZjh4czhqdjZKY2RHSXJDQT09IiwiaXYiOiJyVENGNVZNWEp3NmhRU0RvQmJBa3NnPT0iLCJzaWduIjoiYVBtNW5iSnl3K21taG4wSnpPZkZOSTgydGpnYzhDNmRZMVkxNzBOall2K3kzMUhFc1NiaXlvSHhDam9JQ1AvYkd2dGwxWlpHMTVpZHl2Z1FKZnpwQmc9PSJ9; CTOKEN=GyQ%2FyTgREfC%2BO34UJQDouQ%3D%3D; shopee_webUnique_ccd=HsdbcbUl0LThaC9szgwI1g%3D%3D%7C9gEiEgyDkcd7XhXrQM1AAG%2FApgQzS%2FHathAS%2B8h0jDDhz1Cv1liyJkGcJag1CCjoToPoS2Oa4XXWy4vvPdU%3D%7CYk8IQ%2BpcvUYiR%2BiO%7C08%7C3; ds=41092852defcf9b3f06fcc3cb21a644f',
                    'Content-Length': 158,
                    'Accept-Encoding': 'gzip, deflate, br, zstd',
                    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                    'DNT': '1',
                    'Origin': 'https://seller.shopee.co.id',
                    'Priority': 'u=1, i',
                    'Referer': 'https://seller.shopee.co.id/portal/marketing/pas/product/manual/314023638?from=1747501200&to=1748105999&group=last_week',
                    'sc-fe-session': 'FB08B866057A8C6C',
                    'sc-fe-ver': '21.99342',
                    'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin'
                },
                timeout: 60000,
                data: {
                    "start_time": 1747501200,
                    "end_time": 1748105999,
                    "campaign_type": "product",
                    "agg_type": "new_product_boost",
                    "filter_params": {
                        "campaign_id": 316755336
                    },
                    "header": {}
                }
            };

            const keywordReportResponse = await axios(keywordReportRequest);
            return keywordReportResponse.data

        } catch (error: any) {
            // console.error('Gagal mengambil kata kunci iklan:', error?.message || error);
            console.error(error);
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


            const cookieHeader = this.generateCookieHeader(cookies, this.cookiesKey);

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


            const profileInfoResponse = await axios(profileInfoRequest);

            console.info('Informasi pengguna berhasil diambil:');
            return profileInfoResponse.data

        } catch (error: any) {
            console.error('Gagal mengambil informasi pengguna:', error?.message || error);
            throw new Error(error);
        }
    }


    public getProductPerformance = async (startTime: any, endTime: any): Promise<any[]> => {
        try {
            const cookies = await this.getCookies() ?? [];
            if (cookies.length === 0) throw new Error('Tidak ditemukan cookie.');
            if (!BotEngine.page) throw new Error('BotEngine.page tidak terdefinisi.');

            await BotEngine.page.setCookie(...this.sanitizeCookies(cookies));

            const spcCdsValue = cookies.find((cookie: any) => cookie.name === 'SPC_CDS')?.value;
            if (!spcCdsValue) throw new Error('Cookie SPC_CDS tidak ditemukan.');

    
            const cookieHeader = this.generateCookieHeader(cookies, this.cookiesKey);

            const pageSize = 50;
            let allItems: any[] = [];

            // Request halaman pertama untuk ambil total
            const firstResponse = await axios({
                method: 'GET',
                url: `https://seller.shopee.co.id/api/mydata/v3/product/performance/?SPC_CDS=${spcCdsValue}&SPC_CDS_VER=2&start_time=${startTime}&end_time=${endTime}&period=real_time&metric_ids=all&order_by=placed_units.desc&page_size=${pageSize}&page_num=1&category_type=shopee&category_id=-1&keyword=`,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0 ...',
                    'Cookie': cookieHeader,
                },
                timeout: 60000
            });

            const totalItems = firstResponse.data?.result?.total ?? 0;
            const totalPages = Math.ceil(totalItems / pageSize);

            // Gabung hasil halaman pertama
            allItems.push(...(firstResponse.data?.result?.items ?? []));

            // Loop halaman selanjutnya (mulai dari page 2)
            for (let pageNum = 2; pageNum <= totalPages; pageNum++) {
                const response = await axios({
                    method: 'GET',
                    url: `https://seller.shopee.co.id/api/mydata/v3/product/performance/?SPC_CDS=${spcCdsValue}&SPC_CDS_VER=2&start_time=${startTime}&end_time=${endTime}&period=real_time&metric_ids=all&order_by=placed_units.desc&page_size=${pageSize}&page_num=${pageNum}&category_type=shopee&category_id=-1&keyword=`,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json, text/plain, */*',
                        'User-Agent': 'Mozilla/5.0 ...',
                        'Cookie': cookieHeader,
                    },
                    timeout: 60000
                });

                const items = response.data?.result?.items ?? [];
                allItems.push(...items);
            }

            console.info(`Berhasil mengambil ${allItems.length} produk dari total ${totalItems}`);
            return allItems;

        } catch (error: any) {
            console.error('Gagal mengambil semua data performa produk:', error?.message || error);
            throw new Error(error);
        }
    };

}

export default ShopeeSellerRepository;