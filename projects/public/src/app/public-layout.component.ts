import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { BrandComponent } from "@shared/ui/brand.component";

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet, BrandComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-white">
      <header
        class="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur"
      >
        <div
          class="mx-auto flex h-18 max-w-7xl items-center px-4 sm:px-6 lg:px-8"
        >
          <an-brand />
          <nav
            class="ml-auto hidden items-center gap-1 md:flex"
            aria-label="Main navigation"
          >
            <a
              routerLink="/"
              [routerLinkActiveOptions]="{ exact: true }"
              routerLinkActive="text-brand"
              class="btn btn-ghost"
              >Product</a
            >
            <a
              routerLink="/pricing"
              routerLinkActive="text-brand"
              class="btn btn-ghost"
              >Pricing</a
            >
            <a
              routerLink="/security"
              routerLinkActive="text-brand"
              class="btn btn-ghost"
              >Security</a
            >
            <a routerLink="/sign-in" class="btn btn-secondary ml-3">Sign in</a>
            <a routerLink="/signup" class="btn btn-primary">Start free</a>
          </nav>
          <button
            class="btn btn-ghost ml-auto px-2 md:hidden"
            (click)="menuOpen.set(!menuOpen())"
            aria-label="Toggle navigation"
          >
            ☰
          </button>
        </div>
        @if (menuOpen()) {
          <nav class="border-t border-line px-4 py-3 md:hidden">
            <a
              routerLink="/"
              class="block rounded-lg px-3 py-2 font-semibold"
              (click)="menuOpen.set(false)"
              >Product</a
            >
            <a
              routerLink="/pricing"
              class="block rounded-lg px-3 py-2 font-semibold"
              (click)="menuOpen.set(false)"
              >Pricing</a
            >
            <a
              routerLink="/security"
              class="block rounded-lg px-3 py-2 font-semibold"
              (click)="menuOpen.set(false)"
              >Security</a
            >
            <div class="mt-2 grid grid-cols-2 gap-2">
              <a
                routerLink="/sign-in"
                class="btn btn-secondary"
                (click)="menuOpen.set(false)"
                >Sign in</a
              ><a
                routerLink="/signup"
                class="btn btn-primary"
                (click)="menuOpen.set(false)"
                >Start free</a
              >
            </div>
          </nav>
        }
      </header>
      <main><router-outlet /></main>
      <footer class="border-t border-line bg-ink-deep text-slate-300">
        <div
          class="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto_auto] lg:px-8"
        >
          <div>
            <an-brand href="/" />
            <p class="mt-4 max-w-md text-sm leading-6 text-slate-400">
              Clarity in every transaction. Built for accountable financial
              operations across Afghanistan.
            </p>
          </div>
          <div>
            <p
              class="mb-3 text-xs font-bold tracking-wider text-white uppercase"
            >
              Product
            </p>
            <a routerLink="/pricing" class="block py-1 text-sm hover:text-white"
              >Pricing</a
            ><a
              routerLink="/security"
              class="block py-1 text-sm hover:text-white"
              >Security</a
            >
          </div>
          <div>
            <p
              class="mb-3 text-xs font-bold tracking-wider text-white uppercase"
            >
              Account
            </p>
            <a
              routerLink="/find-workspace"
              class="block py-1 text-sm hover:text-white"
              >Find workspace</a
            ><a routerLink="/signup" class="block py-1 text-sm hover:text-white"
              >Create workspace</a
            >
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class PublicLayoutComponent {
  readonly menuOpen = signal(false);
}
