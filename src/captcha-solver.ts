import axios from 'axios';
import { Page } from 'playwright';
import { CaptchaResponse } from './types';
import dotenv from 'dotenv';

dotenv.config();

class CaptchaSolver {
  private apiKey: string | undefined;
  private service: string;
  private baseUrl: string;
  private resultUrl: string;

  constructor() {
    this.apiKey = process.env.CAPTCHA_API_KEY;
    this.service = process.env.CAPTCHA_SERVICE || '2captcha';
    this.baseUrl = 'https://2captcha.com/in.php';
    this.resultUrl = 'https://2captcha.com/res.php';
  }

  async solveCaptcha(page: Page, selector: string): Promise<string | null> {
    try {
      console.log('CAPTCHA detected, attempting to solve...');
      
      if (!this.apiKey) {
        console.error('CAPTCHA API key not found in environment variables');
        return null;
      }
      
      // Take screenshot of the CAPTCHA
      const captchaElement = await page.$(selector);
      if (!captchaElement) {
        console.error('CAPTCHA element not found');
        return null;
      }
      
      const screenshot = await captchaElement.screenshot({ encoding: 'base64' });
      
      // Send CAPTCHA to solving service
      const response = await axios.post<CaptchaResponse>(this.baseUrl, {
        key: this.apiKey,
        method: 'base64',
        body: screenshot,
        json: 1
      });
      
      if (!response.data.status || response.data.status !== 1) {
        console.error('Failed to submit CAPTCHA:', response.data.error_text);
        return null;
      }
      
      const captchaId = response.data.request;
      console.log(`CAPTCHA submitted, ID: ${captchaId}`);
      
      // Wait for the result (polling)
      let attempts = 0;
      const maxAttempts = 30;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const resultResponse = await axios.get<CaptchaResponse>(this.resultUrl, {
          params: {
            key: this.apiKey,
            action: 'get',
            id: captchaId,
            json: 1
          }
        });
        
        if (resultResponse.data.status === 1) {
          console.log('CAPTCHA solved successfully');
          return resultResponse.data.request;
        }
        
        if (resultResponse.data.request !== 'CAPCHA_NOT_READY') {
          console.error('CAPTCHA solving failed:', resultResponse.data.request);
          return null;
        }
        
        attempts++;
      }
      
      console.error('Timed out waiting for CAPTCHA solution');
      return null;
    } catch (error) {
      console.error('Error solving CAPTCHA:', error);
      return null;
    }
  }
}

export default new CaptchaSolver();
