import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { Router, RouterOutlet } from "@angular/router";
import { WorkspaceShellComponent } from "./workspace-shell.component";
import {
  WorkspaceCreateAction,
  WorkspaceNavGroup,
} from "./workspace-ui.models";
import { SessionState } from "@shared/core/session.state";
import { AuthService } from "@shared/core/auth.service";
import { ApiService } from "@shared/core/api.service";
import { ApiRecord } from "@shared/core/models";
import { BranchContextService } from "@shared/core/branch-context.service";
import { firstValueFrom } from "rxjs";

@Component({
  imports: [RouterOutlet, WorkspaceShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<an-workspace-shell
    [productName]="workspaceName()"
    [userLabel]="userName()"
    [contextLabel]="scopeLabel()"
    [contextOptions]="branches()"
    [selectedContext]="branchContext.selected()"
    [allowAllContexts]="allowAllBranches()"
    [navGroups]="navGroups"
    [createActions]="createActions"
    [permissions]="session.context()?.permissions ?? []"
    [owner]="session.context()?.membership_role === 'owner'"
    (signOut)="logout()"
    (contextChange)="changeBranch($event)"
    ><router-outlet
  /></an-workspace-shell>`,
})
export class WorkspaceLayoutComponent implements OnInit {
  readonly session = inject(SessionState);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  readonly branchContext = inject(BranchContextService);
  readonly branches = signal<Array<{ id: string; label: string }>>([]);
  readonly workspaceName = computed(
    () => this.session.context()?.workspace.name ?? "Workspace",
  );
  readonly userName = computed(() => {
    const user = this.session.context()?.user;
    return user
      ? [user.first_name, user.last_name].filter(Boolean).join(" ") ||
          user.username
      : "Signed in";
  });
  readonly scopeLabel = computed(() => {
    const scopes = this.session.context()?.scopes ?? [];
    return scopes.some((scope) => scope.scope_type === "global")
      ? "Global access"
      : `${scopes.length} operational scope${scopes.length === 1 ? "" : "s"}`;
  });
  readonly allowAllBranches = computed(
    () =>
      this.session.context()?.membership_role === "owner" ||
      (this.session.context()?.scopes ?? []).some(
        (scope) => scope.scope_type === "global",
      ),
  );
  readonly navGroups: WorkspaceNavGroup[] = [
    {
      label: "Workspace",
      icon: "home",
      items: [
        { label: "Overview", route: "/", icon: "home", exact: true },
        {
          label: "Customers",
          route: "/clients",
          icon: "users",
          permission: "clients.read",
        },
        {
          label: "Accounts",
          route: "/accounts",
          icon: "wallet",
          permission: "accounts.read",
        },
        {
          label: "Transactions",
          route: "/transactions",
          icon: "receipt",
          permission: "transactions.read",
        },
        {
          label: "Money orders",
          route: "/money-orders",
          icon: "arrows-exchange",
          permission: "money_orders.read",
        },
        {
          label: "Reports",
          route: "/reports",
          icon: "report-analytics",
          permission: "reports.read",
        },
      ],
    },
    {
      label: "Organization",
      icon: "building-store",
      collapsible: true,
      items: [
        {
          label: "Branches",
          route: "/branches",
          icon: "building-bank",
          permission: "branches.read",
        },
        {
          label: "Cash desks",
          route: "/cash-desks",
          icon: "cash-banknote",
          permission: "cash_desks.read",
        },
        {
          label: "Partners",
          route: "/partners",
          icon: "building-store",
          permission: "partners.read",
        },
        {
          label: "Currencies",
          route: "/currencies",
          icon: "coin",
          permission: "currencies.read",
        },
      ],
    },
    {
      label: "Administration",
      icon: "settings",
      collapsible: true,
      items: [
        {
          label: "Team",
          route: "/team",
          icon: "users",
          permission: "admins.manage",
        },
        {
          label: "Roles & access",
          route: "/access",
          icon: "shield-lock",
          permission: "access.manage",
        },
        {
          label: "Audit log",
          route: "/audit",
          icon: "clipboard-text",
          permission: "audit.read",
        },
        {
          label: "Settings",
          route: "/settings",
          icon: "settings",
          permission: "settings.read",
        },
        {
          label: "Billing",
          route: "/billing",
          icon: "file-analytics",
          permission: "billing.manage",
        },
      ],
    },
  ];
  readonly createActions: WorkspaceCreateAction[] = [
    {
      label: "Deposit",
      route: "/operations/deposit",
      icon: "cash-banknote",
      permission: "fund_flows.create",
      description: "Credit a customer account",
    },
    {
      label: "Withdrawal",
      route: "/operations/withdrawal",
      icon: "wallet",
      permission: "fund_flows.create",
      description: "Pay funds through a cash desk",
    },
    {
      label: "Transfer",
      route: "/operations/transfer",
      icon: "arrows-exchange",
      permission: "transfers.create",
      description: "Move value between customers",
    },
    {
      label: "Currency exchange",
      route: "/operations/exchange",
      icon: "coin",
      permission: "fx.create",
      description: "Post both sides of an exchange",
    },
    {
      label: "Money order",
      route: "/money-orders/new",
      icon: "receipt",
      permission: "money_orders.create",
      description: "Create settlement instructions",
    },
  ];
  ngOnInit(): void {
    void this.loadBranches();
  }

  changeBranch(branchId: string): void {
    this.branchContext.select(branchId);
    if (typeof window !== "undefined") window.location.reload();
  }

  private async loadBranches(): Promise<void> {
    if (!this.session.can("branches.read")) return;
    try {
      const rows = await firstValueFrom(this.api.get<ApiRecord[]>("branches"));
      const branches = rows.map((row) => ({
        id: String(row["id"]),
        label: String(row["name"] ?? row["code"] ?? row["id"]),
      }));
      this.branches.set(branches);
      if (
        this.branchContext.selected() &&
        !branches.some((branch) => branch.id === this.branchContext.selected())
      ) {
        this.branchContext.select("");
      }
    } catch {
      this.branches.set([]);
    }
  }
  async logout(): Promise<void> {
    await this.auth.logout("workspace");
    await this.router.navigateByUrl("/auth/login");
  }
}
