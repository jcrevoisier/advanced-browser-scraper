class HumanBehavior {
  constructor(config) {
    this.config = config || {
      scrollEnabled: true,
      randomClicks: true,
      minDelay: 500,
      maxDelay: 3000,
      scrollDepth: 0.8,
    };
  }

  async randomDelay() {
    const delay = Math.floor(
      Math.random() * (this.config.maxDelay - this.config.minDelay) + this.config.minDelay
    );
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async simulateHumanBehavior(page) {
    // Random delay before starting
    await this.randomDelay();

    // Perform random scrolling if enabled
    if (this.config.scrollEnabled) {
      await this.simulateScrolling(page);
    }

    // Perform random clicks if enabled
    if (this.config.randomClicks) {
      await this.simulateRandomClicks(page);
    }
  }

  async simulateScrolling(page) {
    console.log('Simulating human scrolling behavior...');
    
    // Get page height
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    const targetScrollDepth = pageHeight * this.config.scrollDepth;
    
    // Scroll in small increments with random delays
    let currentPosition = 0;
    const maxScrollStep = 300;
    
    while (currentPosition < targetScrollDepth) {
      const scrollStep = Math.floor(Math.random() * maxScrollStep) + 50;
      currentPosition += scrollStep;
      
      await page.evaluate((scrollY) => {
        window.scrollTo({
          top: scrollY,
          behavior: 'smooth'
        });
      }, currentPosition);
      
      // Random pause between scrolls
      await this.randomDelay();
    }
    
    // Sometimes scroll back up a bit
    if (Math.random() > 0.7) {
      const scrollUpAmount = Math.floor(Math.random() * (currentPosition / 3));
      currentPosition -= scrollUpAmount;
      
      await page.evaluate((scrollY) => {
        window.scrollTo({
          top: scrollY,
          behavior: 'smooth'
        });
      }, currentPosition);
      
      await this.randomDelay();
    }
  }

  async simulateRandomClicks(page) {
    console.log('Simulating random clicks...');
    
    // Find non-critical elements to click (like images, empty space, etc.)
    const clickableElements = await page.evaluate(() => {
      const elements = [];
      
      // Find some non-interactive elements to click
      document.querySelectorAll('div, span, p, img').forEach(el => {
        // Skip elements with event listeners or links
        if (el.onclick || el.closest('a, button, input, select, textarea')) {
          return;
        }
        
        const rect = el.getBoundingClientRect();
        if (rect.width > 10 && rect.height > 10 && rect.top > 0) {
          elements.push({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          });
        }
      });
      
      // Return random subset of elements
      return elements
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
    });
    
    // Perform random clicks
    for (const element of clickableElements) {
      await this.randomDelay();
      await page.mouse.click(element.x, element.y);
    }
  }
}

module.exports = HumanBehavior;
