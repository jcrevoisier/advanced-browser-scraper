const fs = require('fs').promises;
const path = require('path');

class ProxyManager {
  constructor() {
    this.proxies = [];
    this.currentProxyIndex = 0;
    this.proxyFilePath = path.join(__dirname, '../proxies/proxies.txt');
  }

  async loadProxies() {
    try {
      const data = await fs.readFile(this.proxyFilePath, 'utf8');
      this.proxies = data
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
      
      console.log(`Loaded ${this.proxies.length} proxies`);
    } catch (error) {
      console.error('Error loading proxies:', error);
      // Add some fallback proxies in case the file doesn't exist
      this.proxies = [
        'http://user:pass@123.123.123.123:8080',
        'http://user:pass@124.124.124.124:8080',
      ];
    }
  }

  getNextProxy() {
    if (this.proxies.length === 0) {
      return null;
    }
    
    const proxy = this.proxies[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
    return proxy;
  }

  formatProxyForPlaywright(proxyString) {
    if (!proxyString) return null;
    
    try {
      // Parse proxy string (format: protocol://user:pass@host:port)
      const match = proxyString.match(/^(https?):\/\/(?:([^:@]+):([^@]+)@)?([^:]+):(\d+)$/);
      
      if (!match) {
        console.error(`Invalid proxy format: ${proxyString}`);
        return null;
      }
      
      const [, protocol, username, password, host, port] = match;
      
      return {
        server: `${protocol}://${host}:${port}`,
        username: username || undefined,
        password: password || undefined,
      };
    } catch (error) {
      console.error(`Error parsing proxy: ${proxyString}`, error);
      return null;
    }
  }
}

module.exports = new ProxyManager();
