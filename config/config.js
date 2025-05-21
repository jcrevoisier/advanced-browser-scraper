module.exports = {
  // Browser settings
  browser: {
    headless: false,
    defaultViewport: { width: 1366, height: 768 },
    slowMo: 50, // Slow down operations by 50ms
  },
  
  // Target settings (Amazon search example)
  target: {
    url: 'https://www.amazon.com/s?k=',
    searchTerm: 'gaming laptop',
    resultsSelector: '.s-result-item',
    titleSelector: 'h2 a span',
    priceSelector: '.a-price .a-offscreen',
    ratingSelector: '.a-icon-star-small .a-icon-alt',
    maxResults: 20,
  },
  
  // Proxy settings
  proxy: {
    enabled: true,
    rotationInterval: 5, // Rotate proxy every 5 requests
  },
  
  // CAPTCHA settings
  captcha: {
    enabled: true,
    service: '2captcha',
    selector: '.captcha-image', // Amazon CAPTCHA image selector
  },
  
  // Human behavior settings
  humanBehavior: {
    scrollEnabled: true,
    randomClicks: true,
    minDelay: 500,
    maxDelay: 3000,
    scrollDepth: 0.8, // Scroll 80% of the page
  }
};
