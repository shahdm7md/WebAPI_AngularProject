import { Injectable } from '@angular/core';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number;
            },
          ) => void;
        };
      };
    };
  }
}

@Injectable({
  providedIn: 'root',
})
export class GoogleIdentityService {
  private scriptPromise: Promise<void> | null = null;
  private initializePromise: Promise<void> | null = null;
  private initializedClientId: string | null = null;

  loadScript(): Promise<void> {
    if (this.scriptPromise) {
      return this.scriptPromise;
    }

    this.scriptPromise = new Promise<void>((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }

      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[data-google-identity="true"]',
      );
      if (existingScript) {
        if (window.google?.accounts?.id) {
          resolve();
          return;
        }

        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener(
          'error',
          () => reject(new Error('Failed to load Google identity script.')),
          { once: true },
        );
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset['googleIdentity'] = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google identity script.'));
      document.head.appendChild(script);
    });

    return this.scriptPromise;
  }

  async ensureInitialized(
    clientId: string,
    callback: (response: { credential?: string }) => void,
  ): Promise<void> {
    if (this.initializedClientId === clientId && this.initializePromise) {
      return this.initializePromise;
    }

    this.initializePromise = this.loadScript().then(() => {
      const googleClient = window.google?.accounts?.id;
      if (!googleClient) {
        throw new Error('Google identity script is not available.');
      }

      googleClient.initialize({
        client_id: clientId,
        callback,
      });

      this.initializedClientId = clientId;
    });

    return this.initializePromise;
  }

  getClient(): any | null {
    return window.google?.accounts?.id ?? null;
  }
}