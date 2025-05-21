// Configuration types
export interface BrowserConfig {
  headless: boolean;
  defaultViewport: {
    width: number;
    height: number;
  };
  slowMo: number;
}

export interface TargetConfig {
  url: string;
  searchTerm: string;
  resultsSelector: string;
  titleSelector: string;
  priceSelector: string;
  ratingSelector: string;
  maxResults: number;
}

export interface ProxyConfig {
  enabled: boolean;
  rotationInterval: number;
}

export interface CaptchaConfig {
  enabled: boolean;
  service: string;
  selector: string;
}

export interface HumanBehaviorConfig {
  scrollEnabled: boolean;
  randomClicks: boolean;
  minDelay: number;
  maxDelay: number;
  scrollDepth: number;
}

export interface AppConfig {
  browser: BrowserConfig;
  target: TargetConfig;
  proxy: ProxyConfig;
  captcha: CaptchaConfig;
  humanBehavior: HumanBehaviorConfig;
}

// Proxy types
export interface ProxyInfo {
  server: string;
  username?: string;
  password?: string;
}

// Product types
export interface Product {
  title: string;
  price: string;
  rating: string;
  asin: string;
  url: string;
}

// CAPTCHA types
export interface CaptchaResponse {
  status: number;
  request: string;
  error_text?: string;
}

// Click element type
export interface ClickableElement {
  x: number;
  y: number;
}
