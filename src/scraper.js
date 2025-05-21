const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const randomUseragent = require('random-useragent');
const proxyManager = require('./proxy-manager');
const captchaSolver = require('./captcha-solver');
const HumanBehavior = require('./human-behavior');

class Scraper {
  constructor(config) {
    this.config = config;
    this.browser = null;
    this.page = null;
    this.requestCount = 0;
    this.humanBehavior = new HumanBehavior(config.humanBehavior);
    
    // Add stealth plugin
    chromium.use(stealth);
  }

  async initialize() {
    console.log('Initializing scraper...');
    
    // Load proxies if enabled
    if (this.config.proxy.enabled) {
      await proxyManager.loadProxies();
    }
    
    // Launch browser
    await this.launchBrowser();
  }

  async launchBrowser() {
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

  async rotateProxyIfNeeded() {
    this.requestCount++;
    
    if (this.config.proxy.enabled && 
        this.requestCount % this.config.proxy.rotationInterval === 0) {
      console.log('Rotating proxy...');
      
      // Close current browser
      await this.browser.close();
      
      // Launch new browser with new proxy
      await this.launchBrowser();
    }
  }

  async handleCaptcha() {
    if (!this.config.captcha.enabled) return true;
    
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

    async scrapeAmazonSearch() {
    try {
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
          .filter(el => el.getAttribute('data-asin') && el.getAttribute('data-asin').length > 0);
        
        return productElements.slice(0, maxResults).map(el => {
          // Extract product details
          const titleElement = el.querySelector(selectors.titleSelector);
          const priceElement = el.querySelector(selectors.priceSelector);
          const ratingElement = el.querySelector(selectors.ratingSelector);
          const asin = el.getAttribute('data-asin');
          
          return {
            title: titleElement ? titleElement.innerText.trim() : 'N/A',
            price: priceElement ? priceElement.innerText.trim() : 'N/A',
            rating: ratingElement ? ratingElement.innerText.trim() : 'N/A',
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

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('Browser closed');
    }
  }
}

module.exports = Scraper;

