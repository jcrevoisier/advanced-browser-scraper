import dotenv from 'dotenv';
import fs from 'fs';
import config from '../config/config';
import Scraper from './scraper';
import { Product } from './types';

dotenv.config();

async function main(): Promise<void> {
  console.log('Starting advanced browser scraper...');
  console.log(`Target: Amazon search for "${config.target.searchTerm}"`);
  
  const scraper = new Scraper(config);
  
  try {
    // Initialize scraper
    await scraper.initialize();
    
    // Scrape Amazon search results
    const products = await scraper.scrapeAmazonSearch();
    
    // Save results to file
    if (products.length > 0) {
      const resultsPath = './results.json';
      fs.writeFileSync(resultsPath, JSON.stringify(products, null, 2));
      console.log(`Results saved to ${resultsPath}`);
      
      // Display sample results
      console.log('\nSample results:');
      products.slice(0, 3).forEach((product, index) => {
        console.log(`\n[${index + 1}] ${product.title}`);
        console.log(`   Price: ${product.price}`);
        console.log(`   Rating: ${product.rating}`);
        console.log(`   URL: ${product.url}`);
      });
    } else {
      console.log('No products found');
    }
  } catch (error) {
    console.error('Error in scraping process:', error);
  } finally {
    // Close browser
    await scraper.close();
  }
}

// Run the main function
main().catch(console.error);
