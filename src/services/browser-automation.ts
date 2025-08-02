/**
 * Browser-based automation service
 * 
 * This service provides browser automation capabilities without requiring
 * a separate backend server. It uses iframe-based web interaction and
 * direct DOM manipulation where possible.
 */

export interface BrowserAutomationAction {
  type: 'navigate' | 'search' | 'click' | 'type' | 'scroll' | 'wait' | 'extract';
  target?: string;
  value?: string;
  selector?: string;
  description: string;
  timeout?: number;
}

export interface BrowserAutomationResult {
  success: boolean;
  message: string;
  data?: any;
  screenshot?: string;
}

export interface PageInfo {
  url: string;
  title: string;
  content?: string;
  elements?: ElementInfo[];
  links?: string[];
  images?: string[];
}

export interface ElementInfo {
  tagName: string;
  id?: string;
  className?: string;
  text?: string;
  href?: string;
  src?: string;
}

export class BrowserAutomationService {
  private iframe: HTMLIFrameElement | null = null;
  private currentUrl: string = '';
  
  constructor(iframe?: HTMLIFrameElement) {
    this.iframe = iframe || null;
  }

  setIframe(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
  }

  async executeAction(action: BrowserAutomationAction): Promise<BrowserAutomationResult> {
    if (!this.iframe) {
      return {
        success: false,
        message: 'Browser iframe not available'
      };
    }

    try {
      switch (action.type) {
        case 'navigate':
          return await this.navigate(action.target || '');
        
        case 'search':
          return await this.search(action.value || action.target || '');
        
        case 'click':
          return await this.click(action.selector || action.target || '');
        
        case 'type':
          return await this.type(action.selector || action.target || '', action.value || '');
        
        case 'scroll':
          return await this.scroll(action.value || 'down');
        
        case 'wait':
          return await this.wait(parseInt(action.value || '1000'));
        
        case 'extract':
          return await this.extractData(action.selector);
        
        default:
          return {
            success: false,
            message: `Unknown action type: ${action.type}`
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Action failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async navigate(url: string): Promise<BrowserAutomationResult> {
    return new Promise((resolve) => {
      if (!this.iframe) {
        resolve({ success: false, message: 'Iframe not available' });
        return;
      }

      // Ensure URL has protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const handleLoad = () => {
        this.currentUrl = url;
        this.iframe?.removeEventListener('load', handleLoad);
        resolve({
          success: true,
          message: `Successfully navigated to ${url}`
        });
      };

      const handleError = () => {
        this.iframe?.removeEventListener('error', handleError);
        resolve({
          success: false,
          message: `Failed to navigate to ${url}`
        });
      };

      this.iframe.addEventListener('load', handleLoad);
      this.iframe.addEventListener('error', handleError);
      this.iframe.src = url;

      // Timeout after 10 seconds
      setTimeout(() => {
        this.iframe?.removeEventListener('load', handleLoad);
        this.iframe?.removeEventListener('error', handleError);
        resolve({
          success: true,
          message: `Navigation to ${url} initiated (may still be loading)`
        });
      }, 10000);
    });
  }

  private async search(query: string): Promise<BrowserAutomationResult> {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    return this.navigate(searchUrl);
  }

  private async click(selector: string): Promise<BrowserAutomationResult> {
    try {
      if (!this.iframe?.contentWindow) {
        return {
          success: false,
          message: 'Cannot access iframe content due to cross-origin restrictions'
        };
      }

      // For same-origin content, we can manipulate the DOM
      const doc = this.iframe.contentDocument;
      if (doc) {
        const element = doc.querySelector(selector);
        if (element && element instanceof HTMLElement) {
          element.click();
          return {
            success: true,
            message: `Clicked element: ${selector}`
          };
        }
      }

      return {
        success: false,
        message: `Element not found or not clickable: ${selector}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Click action failed due to security restrictions. Element: ${selector}`
      };
    }
  }

  private async type(selector: string, text: string): Promise<BrowserAutomationResult> {
    try {
      if (!this.iframe?.contentWindow) {
        return {
          success: false,
          message: 'Cannot access iframe content due to cross-origin restrictions'
        };
      }

      const doc = this.iframe.contentDocument;
      if (doc) {
        const element = doc.querySelector(selector);
        if (element && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
          element.value = text;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          return {
            success: true,
            message: `Typed "${text}" into element: ${selector}`
          };
        }
      }

      return {
        success: false,
        message: `Input element not found: ${selector}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Type action failed due to security restrictions. Element: ${selector}`
      };
    }
  }

  private async scroll(direction: string): Promise<BrowserAutomationResult> {
    try {
      if (!this.iframe?.contentWindow) {
        return {
          success: false,
          message: 'Cannot access iframe content due to cross-origin restrictions'
        };
      }

      const scrollAmount = 300;
      let x = 0, y = 0;

      switch (direction.toLowerCase()) {
        case 'down':
          y = scrollAmount;
          break;
        case 'up':
          y = -scrollAmount;
          break;
        case 'left':
          x = -scrollAmount;
          break;
        case 'right':
          x = scrollAmount;
          break;
        default:
          // Try to parse as number for pixel amount
          const pixels = parseInt(direction);
          if (!isNaN(pixels)) {
            y = pixels;
          }
      }

      this.iframe.contentWindow.scrollBy(x, y);
      return {
        success: true,
        message: `Scrolled ${direction}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Scroll action failed due to security restrictions`
      };
    }
  }

  private async wait(milliseconds: number): Promise<BrowserAutomationResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `Waited ${milliseconds}ms`
        });
      }, milliseconds);
    });
  }

  private async extractData(selector?: string): Promise<BrowserAutomationResult> {
    try {
      if (!this.iframe?.contentWindow) {
        return {
          success: false,
          message: 'Cannot access iframe content due to cross-origin restrictions'
        };
      }

      const doc = this.iframe.contentDocument;
      if (!doc) {
        return {
          success: false,
          message: 'Cannot access page content'
        };
      }

      if (selector) {
        // Extract specific element(s)
        const elements = doc.querySelectorAll(selector);
        const data = Array.from(elements).map(el => ({
          tagName: el.tagName.toLowerCase(),
          text: el.textContent?.trim(),
          href: (el as HTMLAnchorElement).href,
          src: (el as HTMLImageElement).src,
          className: el.className,
          id: el.id
        }));

        return {
          success: true,
          message: `Extracted ${data.length} elements`,
          data
        };
      } else {
        // Extract page info
        const pageInfo: PageInfo = {
          url: this.currentUrl,
          title: doc.title,
          content: doc.body?.textContent?.substring(0, 1000),
          links: Array.from(doc.querySelectorAll('a[href]')).map(a => (a as HTMLAnchorElement).href).slice(0, 20),
          images: Array.from(doc.querySelectorAll('img[src]')).map(img => (img as HTMLImageElement).src).slice(0, 10)
        };

        return {
          success: true,
          message: 'Extracted page information',
          data: pageInfo
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Data extraction failed due to security restrictions`
      };
    }
  }

  async getPageInfo(): Promise<PageInfo | null> {
    const result = await this.extractData();
    return result.success ? result.data : null;
  }

  async executeSequence(actions: BrowserAutomationAction[]): Promise<BrowserAutomationResult[]> {
    const results: BrowserAutomationResult[] = [];
    
    for (const action of actions) {
      const result = await this.executeAction(action);
      results.push(result);
      
      // Stop execution if an action fails (unless it's a non-critical action)
      if (!result.success && !['extract', 'wait'].includes(action.type)) {
        break;
      }
      
      // Add small delay between actions
      await this.wait(500);
    }
    
    return results;
  }

  // Utility methods for creating common action sequences
  static createGoogleSearch(query: string): BrowserAutomationAction[] {
    return [
      {
        type: 'navigate',
        target: 'https://www.google.com',
        description: 'Navigate to Google'
      },
      {
        type: 'wait',
        value: '2000',
        description: 'Wait for page to load'
      },
      {
        type: 'search',
        value: query,
        description: `Search for: ${query}`
      }
    ];
  }

  static createWebsiteVisit(url: string): BrowserAutomationAction[] {
    return [
      {
        type: 'navigate',
        target: url,
        description: `Navigate to ${url}`
      },
      {
        type: 'wait',
        value: '3000',
        description: 'Wait for page to load'
      },
      {
        type: 'extract',
        description: 'Extract page information'
      }
    ];
  }

  static createSocialMediaCheck(platform: 'twitter' | 'linkedin' | 'facebook'): BrowserAutomationAction[] {
    const urls = {
      twitter: 'https://x.com',
      linkedin: 'https://linkedin.com',
      facebook: 'https://facebook.com'
    };

    return [
      {
        type: 'navigate',
        target: urls[platform],
        description: `Navigate to ${platform}`
      },
      {
        type: 'wait',
        value: '3000',
        description: 'Wait for page to load'
      },
      {
        type: 'extract',
        description: `Extract ${platform} content`
      }
    ];
  }
}

export default BrowserAutomationService;
