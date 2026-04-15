import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="bg-slate-100 w-full py-12 border-t border-slate-200">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 px-8 max-w-7xl mx-auto">
        <div>
          <div class="text-lg font-black text-slate-900 mb-4">Architectural Curator</div>
          <p class="text-sm leading-relaxed text-slate-500">
            Curating the world's finest architectural elements for discerning designers.
          </p>
        </div>
        <div>
          <h5 class="text-xs font-bold uppercase tracking-widest text-slate-900 mb-4">Navigation</h5>
          <ul class="space-y-2">
            <li><a href="#" class="text-slate-500 hover:text-teal-500 text-sm transition-colors">Shop</a></li>
            <li><a href="#" class="text-slate-500 hover:text-teal-500 text-sm transition-colors">Collections</a></li>
            <li><a href="#" class="text-slate-500 hover:text-teal-500 text-sm transition-colors">About</a></li>
          </ul>
        </div>
        <div>
          <h5 class="text-xs font-bold uppercase tracking-widest text-slate-900 mb-4">Legal</h5>
          <ul class="space-y-2">
            <li><a href="#" class="text-slate-500 hover:text-teal-500 text-sm transition-colors">Terms of Service</a></li>
            <li><a href="#" class="text-slate-500 hover:text-teal-500 text-sm transition-colors">Privacy Policy</a></li>
          </ul>
        </div>
        <div>
          <h5 class="text-xs font-bold uppercase tracking-widest text-slate-900 mb-4">Concierge</h5>
          <p class="text-slate-500 text-sm mb-3">Need help with your order?</p>
          <a href="#" class="text-teal-600 font-bold text-sm">Contact Specialist →</a>
        </div>
      </div>
      <div class="mt-12 pt-8 border-t border-slate-200 text-center">
        <p class="text-xs text-slate-400">© 2024 Architectural Curator. All rights reserved.</p>
      </div>
    </footer>
  `
})
export class FooterComponent {}