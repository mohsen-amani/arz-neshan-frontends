import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { A11yModule } from "@angular/cdk/a11y";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { TablerIconComponent, provideTablerIcons } from "angular-tabler-icons";
import {
  IconAdjustmentsHorizontal,
  IconArrowsExchange,
  IconBuildingBank,
  IconBuildingStore,
  IconCashBanknote,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconClipboardText,
  IconCoin,
  IconFileAnalytics,
  IconHome,
  IconLogout,
  IconMenu2,
  IconPlus,
  IconReceipt,
  IconReportAnalytics,
  IconSettings,
  IconShieldLock,
  IconUsers,
  IconWallet,
  IconX,
} from "angular-tabler-icons/icons";
import { BrandComponent } from "@shared/ui/brand.component";
import {
  WorkspaceCreateAction,
  WorkspaceNavGroup,
} from "./workspace-ui.models";
import { WorkspaceUiPreferencesService } from "./workspace-ui-preferences.service";

@Component({
  selector: "an-workspace-shell",
  imports: [
    A11yModule,
    RouterLink,
    RouterLinkActive,
    TablerIconComponent,
    BrandComponent,
  ],
  providers: [
    provideTablerIcons({
      IconAdjustmentsHorizontal,
      IconArrowsExchange,
      IconBuildingBank,
      IconBuildingStore,
      IconCashBanknote,
      IconCheck,
      IconChevronDown,
      IconChevronLeft,
      IconChevronRight,
      IconClipboardText,
      IconCoin,
      IconFileAnalytics,
      IconHome,
      IconLogout,
      IconMenu2,
      IconPlus,
      IconReceipt,
      IconReportAnalytics,
      IconSettings,
      IconShieldLock,
      IconUsers,
      IconWallet,
      IconX,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "(document:keydown.escape)": "closeAll()" },
  template: `
    <div
      class="workspace-theme workspace-shell"
      [class.workspace-shell--collapsed]="!preferences.sidebarExpanded()"
      [class.workspace-compact]="preferences.density() === 'compact'"
    >
      <a class="workspace-skip-link" href="#workspace-main">Skip to content</a>

      <aside
        class="workspace-sidebar"
        [class.workspace-sidebar--mobile-open]="mobileOpen()"
        aria-label="Workspace navigation"
        [cdkTrapFocus]="mobileOpen()"
        [cdkTrapFocusAutoCapture]="mobileOpen()"
      >
        <div class="workspace-sidebar__brand">
          <an-brand [showTagline]="showSidebarLabels()" />
          <button
            type="button"
            class="workspace-icon-button workspace-sidebar__close"
            aria-label="Close navigation"
            (click)="mobileOpen.set(false)"
          >
            <i-tabler name="x" />
          </button>
        </div>

        <div class="workspace-identity">
          <span class="workspace-identity__mark">{{ workspaceInitial() }}</span>
          @if (showSidebarLabels()) {
            <span class="workspace-identity__copy">
              <small>Organization workspace</small>
              <strong>{{ productName() }}</strong>
            </span>
          }
        </div>

        @if (visibleActions().length) {
          <div class="workspace-create-wrap">
            <button
              type="button"
              class="workspace-create-button"
              [attr.aria-expanded]="createOpen()"
              aria-haspopup="menu"
              (click)="createOpen.set(!createOpen())"
            >
              <i-tabler name="plus" />
              @if (showSidebarLabels()) {
                <span>New operation</span>
                <i-tabler
                  name="chevron-down"
                  class="workspace-create-chevron"
                />
              }
            </button>
            @if (createOpen()) {
              <div class="workspace-popover workspace-create-menu" role="menu">
                <p class="workspace-popover__label">Create</p>
                @for (action of visibleActions(); track action.route) {
                  <a
                    [routerLink]="action.route"
                    role="menuitem"
                    (click)="closeMenus()"
                  >
                    <span class="workspace-menu-icon"
                      ><i-tabler [name]="action.icon"
                    /></span>
                    <span
                      ><strong>{{ action.label }}</strong
                      ><small>{{ action.description }}</small></span
                    >
                  </a>
                }
              </div>
            }
          </div>
        }

        <nav class="workspace-nav">
          @for (group of visibleGroups(); track group.label) {
            <section class="workspace-nav-group">
              @if (showSidebarLabels()) {
                @if (group.collapsible) {
                  <button
                    type="button"
                    class="workspace-nav-group__toggle"
                    [attr.aria-expanded]="groupExpanded(group.label)"
                    (click)="toggleGroup(group.label)"
                  >
                    <span>{{ group.label }}</span>
                    <i-tabler name="chevron-down" />
                  </button>
                } @else {
                  <p class="workspace-nav-group__label">{{ group.label }}</p>
                }
              } @else {
                <span class="workspace-nav-group__divider"></span>
              }
              @if (
                !group.collapsible ||
                !showSidebarLabels() ||
                groupExpanded(group.label)
              ) {
                @for (item of group.items; track item.route) {
                  <a
                    [routerLink]="item.route"
                    routerLinkActive="workspace-nav-link--active"
                    [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                    class="workspace-nav-link"
                    [attr.title]="item.label"
                    (click)="closeOnMobile()"
                  >
                    <i-tabler [name]="item.icon" />
                    @if (showSidebarLabels()) {
                      <span>{{ item.label }}</span>
                    }
                  </a>
                }
              }
            </section>
          }
        </nav>

        <div class="workspace-sidebar__footer">
          <button
            type="button"
            class="workspace-collapse-button"
            (click)="preferences.toggleSidebar()"
            [attr.aria-label]="
              preferences.sidebarExpanded()
                ? 'Collapse navigation'
                : 'Expand navigation'
            "
          >
            <i-tabler
              [name]="
                preferences.sidebarExpanded() ? 'chevron-left' : 'chevron-right'
              "
            />
            @if (showSidebarLabels()) {
              <span>Collapse sidebar</span>
            }
          </button>
        </div>
      </aside>

      @if (mobileOpen()) {
        <button
          type="button"
          class="workspace-backdrop"
          aria-label="Close navigation"
          (click)="mobileOpen.set(false)"
        ></button>
      }

      <div class="workspace-frame">
        <header class="workspace-topbar">
          <button
            type="button"
            class="workspace-icon-button workspace-menu-button"
            aria-label="Open navigation"
            (click)="mobileOpen.set(true)"
          >
            <i-tabler name="menu-2" />
          </button>
          <div class="workspace-topbar__status">
            <span></span>
            Secure workspace
          </div>
          <div class="workspace-topbar__actions">
            @if (contextOptions().length) {
              <label class="workspace-branch-select">
                <span>Branch</span>
                <select
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
            }
            <div class="workspace-profile-wrap">
              <button
                type="button"
                class="workspace-profile-trigger"
                [attr.aria-expanded]="profileOpen()"
                aria-haspopup="menu"
                (click)="profileOpen.set(!profileOpen())"
              >
                <span class="workspace-avatar">{{ initials() }}</span>
                <span class="workspace-profile-trigger__copy">
                  <strong>{{ userLabel() }}</strong>
                  <small>{{ contextLabel() }}</small>
                </span>
                <i-tabler name="chevron-down" />
              </button>
              @if (profileOpen()) {
                <div
                  class="workspace-popover workspace-profile-menu"
                  role="menu"
                >
                  <p class="workspace-popover__label">Display density</p>
                  <button
                    type="button"
                    role="menuitemradio"
                    [attr.aria-checked]="preferences.density() === 'balanced'"
                    (click)="setDensity('balanced')"
                  >
                    <i-tabler name="adjustments-horizontal" /> Balanced
                    @if (preferences.density() === "balanced") {
                      <i-tabler name="check" />
                    }
                  </button>
                  <button
                    type="button"
                    role="menuitemradio"
                    [attr.aria-checked]="preferences.density() === 'compact'"
                    (click)="setDensity('compact')"
                  >
                    <i-tabler name="adjustments-horizontal" /> Compact
                    @if (preferences.density() === "compact") {
                      <i-tabler name="check" />
                    }
                  </button>
                  <span class="workspace-popover__separator"></span>
                  <button
                    type="button"
                    role="menuitem"
                    (click)="signOut.emit()"
                  >
                    <i-tabler name="logout" /> Sign out
                  </button>
                </div>
              }
            </div>
          </div>
        </header>

        <main id="workspace-main" class="workspace-content" tabindex="-1">
          <ng-content />
        </main>
      </div>
    </div>
  `,
})
export class WorkspaceShellComponent {
  readonly preferences = inject(WorkspaceUiPreferencesService);
  readonly productName = input.required<string>();
  readonly userLabel = input("Signed in");
  readonly contextLabel = input("");
  readonly contextOptions = input<Array<{ id: string; label: string }>>([]);
  readonly selectedContext = input("");
  readonly allowAllContexts = input(false);
  readonly navGroups = input.required<WorkspaceNavGroup[]>();
  readonly createActions = input.required<WorkspaceCreateAction[]>();
  readonly permissions = input<string[]>([]);
  readonly owner = input(false);
  readonly signOut = output<void>();
  readonly contextChange = output<string>();
  readonly mobileOpen = signal(false);
  readonly createOpen = signal(false);
  readonly profileOpen = signal(false);
  readonly expandedGroups = signal(new Set(["Organization", "Administration"]));
  readonly showSidebarLabels = computed(
    () => this.mobileOpen() || this.preferences.sidebarExpanded(),
  );

  readonly visibleGroups = computed(() =>
    this.navGroups()
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => this.can(item.permission)),
      }))
      .filter((group) => group.items.length),
  );
  readonly visibleActions = computed(() =>
    this.createActions().filter((action) => this.can(action.permission)),
  );
  readonly initials = computed(
    () =>
      this.userLabel()
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "AN",
  );
  readonly workspaceInitial = computed(
    () => this.productName().trim().charAt(0).toUpperCase() || "W",
  );

  closeMenus(): void {
    this.createOpen.set(false);
    this.profileOpen.set(false);
    this.closeOnMobile();
  }

  closeAll(): void {
    this.closeMenus();
    this.mobileOpen.set(false);
  }

  groupExpanded(label: string): boolean {
    return this.expandedGroups().has(label);
  }

  toggleGroup(label: string): void {
    const next = new Set(this.expandedGroups());
    if (next.has(label)) next.delete(label);
    else next.add(label);
    this.expandedGroups.set(next);
  }

  closeOnMobile(): void {
    if (typeof window !== "undefined" && window.innerWidth < 768)
      this.mobileOpen.set(false);
  }

  selectContext(event: Event): void {
    this.contextChange.emit((event.target as HTMLSelectElement).value);
  }

  setDensity(density: "balanced" | "compact"): void {
    this.preferences.setDensity(density);
    this.profileOpen.set(false);
  }

  private can(permission?: string): boolean {
    return (
      !permission || this.owner() || this.permissions().includes(permission)
    );
  }
}
