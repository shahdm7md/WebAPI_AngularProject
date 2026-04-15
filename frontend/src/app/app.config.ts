import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { API_BASE_URL, DEFAULT_API_BASE_URL } from './core/config/api.config';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),  // ← الاتنين مع بعض هنا بس
    provideRouter(routes),
    {
      provide: API_BASE_URL,
      useValue: DEFAULT_API_BASE_URL,
    },
  ],
};