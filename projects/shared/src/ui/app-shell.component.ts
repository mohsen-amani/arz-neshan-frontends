import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { CdkMenuModule } from "@angular/cdk/menu";
import { BrandComponent } from "./brand.component";
import { NavItem } from "../core/models";

@Component({
  selector: "an-app-shell",
  imports: [RouterLink, RouterLinkActive, CdkMenuModule, BrandComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-canvas lg:grid lg:grid-cols-[288px_1fr]">
      <aside
        class="fixed inset-y-0 z-40 w-[288px] overflow-hidden border-r border-slate-800 bg-[linear-gradient(165deg,#0b2134_0%,#071522_55%,#06111c_100%)] text-white shadow-2xl shadow-slate-950/20 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none"
        [class.-translate-x-full]="!menuOpen()"
        [class.translate-x-0]="menuOpen()"
      >
        <div
          class="pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full bg-emerald-400/8 blur-3xl"
        ></div>
        <div class="relative flex h-full flex-col px-4 py-5">
          <div class="flex items-center justify-between px-2">
            <an-brand [showTagline]="false" [inverse]="true" />
            <button
              class="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Close menu"
              (click)="menuOpen.set(false)"
            >
              <svg viewBox="0 0 24 24" class="h-5 w-5" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>
          <div
            class="mt-6 rounded-2xl border border-white/8 bg-white/[.055] px-4 py-3.5 shadow-[inset_0_1px_0_rgb(255_255_255/.04)]"
          >
            <p
              class="mb-1.5 text-[10px] font-bold tracking-[.18em] text-emerald-300 uppercase"
            >
              {{ eyebrow() }}
            </p>
            <p class="mb-0 truncate text-sm font-semibold text-white">
              {{ productName() }}
            </p>
          </div>
          <nav
            class="sidebar-scroll mt-5 flex-1 overflow-y-auto pr-1"
            aria-label="Primary navigation"
          >
            @for (group of navGroups(); track group.label) {
              <div class="mb-5 last:mb-2">
                <div class="mb-2 flex items-center gap-3 px-3">
                  <p
                    class="mb-0 shrink-0 text-[10px] font-bold tracking-[.16em] text-slate-500 uppercase"
                  >
                    {{ group.label }}
                  </p>
                  <span class="h-px flex-1 bg-white/6"></span>
                </div>
                @for (item of group.items; track item.route) {
                  <a
                    [routerLink]="item.route"
                    routerLinkActive="shell-link-active"
                    [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                    class="shell-link group"
                    (click)="closeOnMobile()"
                  >
                    <span class="shell-link-dot" aria-hidden="true"></span>
                    <span class="min-w-0 flex-1 truncate">{{
                      item.label
                    }}</span>
                    <svg
                      viewBox="0 0 20 20"
                      class="h-4 w-4 -translate-x-1 text-slate-500 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100"
                      aria-hidden="true"
                    >
                      <path
                        d="M7.5 5l5 5-5 5"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </a>
                }
              </div>
            }
          </nav>
          <div
            class="mt-3 rounded-2xl border border-white/8 bg-white/[.045] p-2"
          >
            <div class="flex min-w-0 items-center gap-3 px-2 py-2">
              <span
                class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-400/15 text-xs font-bold text-emerald-200 ring-1 ring-emerald-300/15"
                >{{ initials() }}</span
              >
              <div class="min-w-0">
                <p class="mb-0 truncate text-sm font-semibold text-white">
                  {{ userLabel() }}
                </p>
                <p class="mt-0.5 mb-0 truncate text-[11px] text-slate-500">
                  {{ contextLabel() }}
                </p>
              </div>
            </div>
            <button
              class="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-400 transition hover:bg-white/8 hover:text-white"
              (click)="signOut.emit()"
            >
              <span>Sign out</span>
              <svg viewBox="0 0 20 20" class="h-4 w-4" aria-hidden="true">
                <path
                  d="M8 4H5.5A1.5 1.5 0 004 5.5v9A1.5 1.5 0 005.5 16H8m3-3l3-3-3-3m3 3H7"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </aside>
      @if (menuOpen()) {
        <button
          aria-label="Close menu"
          class="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          (click)="menuOpen.set(false)"
        ></button>
      }
      <div class="min-w-0">
        <header
          class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-white/92 px-4 shadow-[0_1px_0_rgb(15_23_42/.02)] backdrop-blur-xl sm:px-6 lg:px-8"
        >
          <button
            class="grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-ink shadow-sm hover:bg-slate-50 lg:hidden"
            (click)="menuOpen.set(true)"
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" class="h-5 w-5" aria-hidden="true">
              <path
                d="M5 7h14M5 12h14M5 17h14"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>
          <div class="hidden items-center gap-2 text-sm text-muted lg:flex">
            <span
              class="h-2 w-2 rounded-full bg-brand-bright shadow-[0_0_0_4px_rgb(38_180_135/.12)]"
            ></span>
            Secure workspace
          </div>
          <div class="ml-auto flex items-center gap-3">
            @if (contextOptions().length) {
              <label class="hidden items-center gap-2 sm:flex">
                <span
                  class="text-xs font-bold tracking-wide text-muted uppercase"
                  >Branch</span
                >
                <select
                  class="min-h-9 max-w-56 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink"
                  [value]="selectedContext()"
                  (change)="selectContext($event)"
                  aria-label="Active branch context"
                >
                  @if (allowAllContexts()) {
                    <option value="">All permitted branches</option>
                  }
                  @for (option of contextOptions(); track option.id) {
                    <option [value]="option.id">{{ option.label }}</option>
                  }
                </select>
              </label>
            } @else {
              <span class="hidden text-sm text-muted sm:inline">{{
                contextLabel()
              }}</span>
            }
            <span
              class="grid h-9 w-9 place-items-center rounded-full bg-ink text-sm font-bold text-white"
              >{{ initials() }}</span
            >
          </div>
        </header>
        <main class="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <ng-content />
        </main>
      </div>
    </div>
  `,
})
export class AppShellComponent {
  readonly productName = input.required<string>();
  readonly eyebrow = input("Workspace");
  readonly userLabel = input("Signed in");
  readonly contextLabel = input("");
  readonly contextOptions = input<Array<{ id: string; label: string }>>([]);
  readonly selectedContext = input("");
  readonly allowAllContexts = input(false);
  readonly navItems = input.required<NavItem[]>();
  readonly permissions = input<string[]>([]);
  readonly owner = input(false);
  readonly signOut = output<void>();
  readonly contextChange = output<string>();
  readonly menuOpen = signal(false);
  readonly visibleItems = computed(() =>
    this.navItems().filter(
      (item) =>
        !item.permission ||
        this.owner() ||
        this.permissions().includes(item.permission),
    ),
  );
  readonly navGroups = computed(() => {
    const groups = new Map<string, NavItem[]>();
    for (const item of this.visibleItems()) {
      const label = item.section ?? "Navigation";
      groups.set(label, [...(groups.get(label) ?? []), item]);
    }
    return [...groups.entries()].map(([label, items]) => ({ label, items }));
  });
  readonly initials = computed(
    () =>
      this.userLabel()
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "AN",
  );

  closeOnMobile(): void {
    if (typeof window !== "undefined" && window.innerWidth < 1024)
      this.menuOpen.set(false);
  }

  selectContext(event: Event): void {
    this.contextChange.emit((event.target as HTMLSelectElement).value);
  }
}
