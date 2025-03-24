import BotEngine from '../../../bot-engine';
import axios from 'axios';
import { data } from 'cheerio/dist/commonjs/api/attributes';
import jsonfile from 'jsonfile';

class ShopeeSellerRepository {
    // Method to scrape product ads using BotEngine
    public getProductAds = async (): Promise<any> => {
        try {
            // Navigate to the URL and wait for the page to load
            
            // Promise to handle the product ads data retrieval
            const productAds = new Promise((resolve, reject) => {
                // Timeout for 60 seconds
                const timeoutId = setTimeout(() => reject(new Error('Timeout')), 60000);

                // Event listener to capture the response containing the product ads data
                BotEngine.page?.on('response', async (response: any) => {
                    if (response.url().includes('https://seller.shopee.co.id/api/pas/v1/homepage/query/?SPC_CDS=')) {
                        try {
                            // Clear timeout once the response is received
                            clearTimeout(timeoutId);

                            // Extract and resolve the JSON response from the API
                            const responseJson = await response.json();
                            resolve(responseJson);
                        } catch (error) {
                            reject(error);
                        }
                    }
                });
            });

            // Return the promise that resolves with product ads data
            return productAds;
        } catch (error) {
            console.error('Error scraping product ads:', error);
            throw error;  // Rethrow the error if scraping fails
        }
    };

    private sanitizeCookies = (cookies: any[]): any[] => {
        return cookies.map((v: any) => ({
            name: v?.name,
            value: v?.value,
            domain: v?.domain,
            path: v?.path || '/',
            httpOnly: v?.httpOnly ?? false,
            secure: v?.secure ?? true,
            expires: v?.expires && Number.isFinite(v.expires) ? Math.floor(v.expires) : undefined,
        }));
    };

    private generateCookieHeader = (cookies: any[], keysToFilter: string[]): string => {
        return cookies
            .filter((session: any) => keysToFilter.includes(session.name))
            .map((session: any) => `${session.name}=${session.value}`)
            .join('; ');
    };

    public getProductAds2 = async (start_time: any, end_time: any): Promise<any> => {
        try {
            // Load cookies from session file
            const cookies = await jsonfile.readFile(
                BotEngine.getSessionsPath({ platform: 'shopee_seller', botAccountIndex: 0 })
            );

            // Sanitize cookies and set them in the browser session
            await BotEngine.page?.setCookie(...this.sanitizeCookies(cookies));

            // Extract SPC_CDS cookie value
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

            // Configure request options
            const options = {
                method: 'POST',
                url: `https://seller.shopee.co.id/api/pas/v1/homepage/query/?SPC_CDS=${spcCookie}&SPC_CDS_VER=2`,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Cookie': cookieReqHeader,
                },
                timeout: 60000, // 60 seconds timeout
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
                    limit: 49
                }
            };

            // Fetch product ads data
            const result = await axios(options);
            console.info(result.data)
            console.info('Product ads fetched successfully:', result.data);
            return result.data;
        } catch (error: any) {
            console.info(error)
            console.error('Error fetching product ads:', error?.message || error);
            throw new Error(error);
        }
    };
}

export default ShopeeSellerRepository;
