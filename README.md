# Advanced Browser Scraper

A sophisticated web scraper built with TypeScript and Playwright including:

- Browser automation with stealth mode
- Proxy rotation
- CAPTCHA solving (2Captcha integration)
- Human behavior emulation (scrolling, clicking, random delays)

## Features

- **TypeScript Implementation**: Type-safe code with interfaces for better maintainability
- **Browser Automation**: Uses Playwright with stealth plugins to avoid detection
- **Proxy Rotation**: Automatically rotates between proxies to prevent IP blocking
- **CAPTCHA Solving**: Integrates with 2Captcha service to solve CAPTCHAs automatically
- **Human Behavior Emulation**: Simulates realistic user behavior with:
  - Natural scrolling patterns
  - Random clicks on non-interactive elements
  - Variable timing between actions
  - Realistic mouse movements

## Example Use Case

This scraper is configured to extract product information from Amazon search results, including:
- Product titles
- Prices
- Ratings
- Product URLs

## Installation

```bash
# Clone the repository
git clone https://github.com/jcrevoisier/advanced-browser-scraper.git
cd advanced-browser-scraper

# Install dependencies
npm install
```

## Configuration

1. Create a `.env` file with your API keys:
```
CAPTCHA_API_KEY=your_2captcha_api_key_here
CAPTCHA_SERVICE=2captcha
```

2. Add your proxies to `proxies/proxies.txt` (one proxy per line):
```
http://username:password@host:port
```

3. Adjust settings in `config/config.ts` as needed.

## Usage

```bash
# Build the project
npm run build

# Run the scraper
npm start
```

## Disclaimer

This project is for educational purposes only. Always respect websites' terms of service and robots.txt files. Use responsibly and ethically.

## License

MIT
