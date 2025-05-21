import { chromium, Browser, Page } from 'playwright-extra';
import { PlaywrightExtraPlugin } from 'playwright-extra/dist/plugin';
import stealth from 'puppeteer-extra-plugin-stealth';
import randomUseragent from 'random-useragent';
import proxyManager from './proxy-manager';
import captchaSolver from './captcha-solver';
import HumanBehavior from './human-behavior';
import { AppConfig, Product } from './types';

class Scraper {
  private config: AppConfig;
  private browser: Browser | null = null;
  private page: Page | null = null;
  private requestCount: number = 0;
  private humanBehavior: HumanBehavior;
  
  constructor(config: AppConfig) {
    this.config = config;
    this.humanBehavior = new HumanBehavior(config.humanBehavior);
    
    // Add stealth plugin
    chromium.use(stealth() as unknown as PlaywrightExtraPlugin);
  }

  async initialize(): Promise<void> {
    console.log('Initializing scraper...');
    
    // Load proxies if enabled
    if (this.config.proxy.enabled) {
      await proxyManager.loadProxies();
    }
    
    // Launch browser
    await this.launchBrowser();
  }

  async launchBrowser(): Promise<void> {
    let proxyServer = null;
    
    // Get proxy if enabled
    if (this.config.proxy.enabled) {
      const proxyString = proxyManager.getNextProxy();
      proxyServer = proxyManager.formatProxyForPlaywright(proxyString);
      console.log(`Using proxy: ${proxyString}`);
    }
    
    // Generate random user agent
    const userAgent = randomUseragent.getRandom();
    console.log(`Using user agent: ${userAgent}`);
    
    // Launch browser with configurations
    this.browser = await chromium.launch({
      headless: this.config.browser.headless,
      slowMo: this.config.browser.slowMo,
      proxy: proxyServer,
    });
    
    // Create new page
    this.page = await this.browser.newPage();
    
    // Set viewport and user agent
    await this.page.setViewportSize(this.config.browser.defaultViewport);
    await this.page.setExtraHTTPHeaders({
      'User-Agent': userAgent,
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0',
    });
  }

  async rotateProxyIfNeeded(): Promise<void> {
    this.requestCount++;
    
    if (this.config.proxy.enabled && 
        this.requestCount % this.config.proxy.rotationInterval === 0) {
      console.log('Rotating proxy...');
      
      // Close current browser
      if (this.browser) {
        await this.browser.close();
      }
      
      // Launch new browser with new proxy
      await this.launchBrowser();
    }
  }

  async handleCaptcha(): Promise<boolean> {
    if (!this.config.captcha.enabled || !this.page) return true;
    
    // Check if CAPTCHA is present
    const captchaExists = await this.page.$(this.config.captcha.selector);
    if (!captchaExists) return true;
    
    console.log('CAPTCHA detected!');
    
    // Solve CAPTCHA
    const solution = await captchaSolver.solveCaptcha(
      this.page, 
      this.config.captcha.selector
    );
    
    if (!solution) {
      console.error('Failed to solve CAPTCHA');
      return false;
    }
    
    // Input CAPTCHA solution (Amazon example)
    await this.page.fill('#captchacharacters', solution);
    await this.page.click('button[type="submit"]');
    
    // Wait for navigation
    await this.page.waitForNavigation();
    
    // Check if CAPTCHA is still present
    const captchaStillExists = await this.page.$(this.config.captcha.selector);
    return !captchaStillExists;
  }

  async scrapeAmazonSearch(): Promise<Product[]> {
    try {
      if (!this.page) {
        throw new Error('Browser page not initialized');
      }
      
      const searchUrl = `${this.config.target.url}${encodeURIComponent(this.config.target.searchTerm)}`;
      console.log(`Navigating to: ${searchUrl}`);
      
      // Navigate to search URL
      await this.page.goto(searchUrl, { waitUntil: 'networkidle' });
      
      // Handle CAPTCHA if present
      const captchaSolved = await this.handleCaptcha();
      if (!captchaSolved) {
        console.error('Failed to solve CAPTCHA, aborting scrape');
        return [];
      }
      
      // Simulate human behavior
      await this.humanBehavior.simulateHumanBehavior(this.page);
      
      // Extract product data
      console.log('Extracting product data...');
      const products = await this.page.evaluate((selectors, maxResults) => {
        const productElements = Array.from(document.querySelectorAll(selectors.resultsSelector))
          .filter(el => el.getAttribute('data-asin') && el.getAttribute('data-asin')!.length > 0);
        
        return productElements.slice(0, maxResults).map(el => {
          // Extract product details
          const titleElement = el.querySelector(selectors.titleSelector);
          const priceElement = el.querySelector(selectors.priceSelector);
          const ratingElement = el.querySelector(selectors.ratingSelector);
          const asin = el.getAttribute('data-asin');
          
          return {
            title: titleElement ? titleElement.textContent?.trim() || 'N/A' : 'N/A',
            price: priceElement ? priceElement.textContent?.trim() || 'N/A' : 'N/A',
            rating: ratingElement ? ratingElement.textContent?.trim() || 'N/A' : 'N/A',
            asin: asin || 'N/A',
            url: asin ? `https://www.amazon.com/dp/${asin}` : '#',
          };
        });
      }, this.config.target, this.config.target.maxResults);
      
      console.log(`Scraped ${products.length} products`);
      return products;
    } catch (error) {
      console.error('Error scraping Amazon search:', error);
      return [];
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log('Browser closed');
    }
  }
}

export default Scraper;