import fs from 'fs/promises';
import path from 'path';
import { ProxyInfo } from './types';

class ProxyManager {
  private proxies: string[] = [];
  private currentProxyIndex: number = 0;
  private proxyFilePath: string;

  constructor() {
    this.proxyFilePath = path.join(__dirname, '../proxies/proxies.txt');
  }

  async loadProxies(): Promise<void> {
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

  getNextProxy(): string | null {
    if (this.proxies.length === 0) {
      return null;
    }
    
    const proxy = this.proxies[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
    return proxy;
  }

  formatProxyForPlaywright(proxyString: string | null): ProxyInfo | null {
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

export default new ProxyManager();