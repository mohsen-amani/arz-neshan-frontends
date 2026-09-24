import { Routes } from "@angular/router";
import { workspaceGuard } from "@shared/core/auth.guards";
import { WorkspaceLayoutComponent } from "./workspace-layout.component";
import { ActivateComponent, WorkspaceLoginComponent } from "./auth-pages";
import { DashboardComponent } from "./dashboard.component";
import { ResourceListComponent } from "./resource-list.component";
import { OperationFormComponent } from "./operation-form.component";
import { ReportsComponent } from "./reports.component";
import { AccessManagementComponent } from "./access-management.component";
import { BillingComponent } from "./billing.component";
import { EntityCreateComponent } from "./entity-create.component";
import { ClientDetailComponent } from "./client-detail.component";
import { AccountDetailComponent } from "./account-detail.component";
import { TransactionDetailComponent } from "./transaction-detail.component";
import { MoneyOrderDetailComponent } from "./money-order-detail.component";
import { ClientEditComponent } from "./client-edit.component";
import { SettingsComponent } from "./settings.component";
import { TransactionReportComponent } from "./transaction-report.component";

export const routes: Routes = [
  {
    path: "auth/login",
    component: WorkspaceLoginComponent,
    title: "Sign in — Arz Neshan",
  },
  {
    path: "auth/activate",
    component: ActivateComponent,
    title: "Activating workspace — Arz Neshan",
  },
  {
    path: "",
    component: WorkspaceLayoutComponent,
    canActivate: [workspaceGuard],
    canActivateChild: [workspaceGuard],
    children: [
      {
        path: "",
        component: DashboardComponent,
        title: "Overview — Arz Neshan",
      },
      {
        path: "clients",
        component: ResourceListComponent,
        data: {
          title: "Customers",
          eyebrow: "Relationships",
          description:
            "Customer identity, contact details, and account access.",
          endpoint: "clients",
          searchKey: "first_name",
          actionLabel: "Add customer",
          actionRoute: "/clients/new",
          permission: "clients.write",
          detailRoute: "/clients",
        },
        title: "Customers — Arz Neshan",
      },
      {
        path: "clients/new",
        component: EntityCreateComponent,
        data: { kind: "client" },
        title: "Add customer — Arz Neshan",
      },
      {
        path: "clients/:id/edit",
        component: ClientEditComponent,
        title: "Edit customer — Arz Neshan",
      },
      {
        path: "clients/:id",
        component: ClientDetailComponent,
        title: "Customer detail — Arz Neshan",
      },
      {
        path: "accounts",
        component: ResourceListComponent,
        data: {
          title: "Accounts",
          eyebrow: "Ledger",
          description:
            "Customer and operational accounts across every supported currency.",
          endpoint: "accounts",
          actionLabel: "Add account",
          actionRoute: "/accounts/new",
          permission: "accounts.write",
          detailRoute: "/accounts",
        },
        title: "Accounts — Arz Neshan",
      },
      {
        path: "accounts/new",
        component: EntityCreateComponent,
        data: { kind: "account" },
        title: "Add account — Arz Neshan",
      },
      {
        path: "accounts/:id",
        component: AccountDetailComponent,
        title: "Account detail — Arz Neshan",
      },
      {
        path: "transactions",
        component: ResourceListComponent,
        data: {
          title: "Transactions",
          eyebrow: "Posted record",
          description:
            "An immutable view of every posted financial transaction.",
          endpoint: "transactions",
          searchKey: "tr_no",
          detailRoute: "/transactions",
        },
        title: "Transactions — Arz Neshan",
      },
      {
        path: "transactions/:id",
        component: TransactionDetailComponent,
        title: "Transaction receipt — Arz Neshan",
      },
      {
        path: "operations/deposit",
        component: OperationFormComponent,
        data: { kind: "deposit" },
        title: "Record deposit — Arz Neshan",
      },
      {
        path: "operations/withdrawal",
        component: OperationFormComponent,
        data: { kind: "withdrawal" },
        title: "Record withdrawal — Arz Neshan",
      },
      {
        path: "operations/transfer",
        component: OperationFormComponent,
        data: { kind: "transfer" },
        title: "Create transfer — Arz Neshan",
      },
      {
        path: "operations/exchange",
        component: OperationFormComponent,
        data: { kind: "exchange" },
        title: "Create exchange — Arz Neshan",
      },
      {
        path: "money-orders",
        component: ResourceListComponent,
        data: {
          title: "Money orders",
          eyebrow: "Settlement",
          description:
            "Track incoming and outgoing orders from creation through payout.",
          endpoint: "money-orders",
          searchKey: "order_no",
          actionLabel: "New money order",
          actionRoute: "/money-orders/new",
          permission: "money_orders.create",
          detailRoute: "/money-orders",
        },
        title: "Money orders — Arz Neshan",
      },
      {
        path: "money-orders/new",
        component: OperationFormComponent,
        data: { kind: "money_order" },
        title: "New money order — Arz Neshan",
      },
      {
        path: "money-orders/:id",
        component: MoneyOrderDetailComponent,
        title: "Money order detail — Arz Neshan",
      },
      {
        path: "tracking-rounds",
        component: ResourceListComponent,
        data: {
          title: "Tracking rounds",
          eyebrow: "Number control",
          description: "Manage sequential money-order tracking number ranges.",
          endpoint: "money-order-tracking-rounds",
          actionLabel: "Start tracking round",
          actionRoute: "/tracking-rounds/new",
          permission: "money_orders.manage",
        },
        title: "Tracking rounds — Arz Neshan",
      },
      {
        path: "tracking-rounds/new",
        component: EntityCreateComponent,
        data: { kind: "tracking_round" },
        title: "New tracking round — Arz Neshan",
      },
      {
        path: "reports/transactions",
        component: TransactionReportComponent,
        title: "Transaction activity — Arz Neshan",
      },
      {
        path: "reports",
        component: ReportsComponent,
        title: "Reports — Arz Neshan",
      },
      {
        path: "branches",
        component: ResourceListComponent,
        data: {
          title: "Branches",
          eyebrow: "Organization",
          description:
            "Operational locations available for scoped access and posting.",
          endpoint: "branches",
          actionLabel: "Add branch",
          actionRoute: "/branches/new",
          permission: "branches.manage",
        },
        title: "Branches — Arz Neshan",
      },
      {
        path: "branches/new",
        component: EntityCreateComponent,
        data: { kind: "branch" },
        title: "Add branch — Arz Neshan",
      },
      {
        path: "cash-desks",
        component: ResourceListComponent,
        data: {
          title: "Cash desks",
          eyebrow: "Organization",
          description: "Cash handling points connected to branches.",
          endpoint: "cash-desks",
          actionLabel: "Add cash desk",
          actionRoute: "/cash-desks/new",
          permission: "cash_desks.manage",
        },
        title: "Cash desks — Arz Neshan",
      },
      {
        path: "cash-desks/new",
        component: EntityCreateComponent,
        data: { kind: "cash_desk" },
        title: "Add cash desk — Arz Neshan",
      },
      {
        path: "partners",
        component: ResourceListComponent,
        data: {
          title: "Partners",
          eyebrow: "Network",
          description: "Settlement and money-order partners.",
          endpoint: "partners",
          actionLabel: "Add partner",
          actionRoute: "/partners/new",
          permission: "partners.manage",
        },
        title: "Partners — Arz Neshan",
      },
      {
        path: "partners/new",
        component: EntityCreateComponent,
        data: { kind: "partner" },
        title: "Add partner — Arz Neshan",
      },
      {
        path: "currencies",
        component: ResourceListComponent,
        data: {
          title: "Currencies",
          eyebrow: "Configuration",
          description:
            "Currencies enabled for accounts and financial activity.",
          endpoint: "currencies",
          actionLabel: "Add currency",
          actionRoute: "/currencies/new",
          permission: "currencies.manage",
        },
        title: "Currencies — Arz Neshan",
      },
      {
        path: "currencies/new",
        component: EntityCreateComponent,
        data: { kind: "currency" },
        title: "Add currency — Arz Neshan",
      },
      {
        path: "team",
        component: ResourceListComponent,
        data: {
          title: "Team",
          eyebrow: "Administration",
          description: "Administrator accounts with workspace access.",
          endpoint: "admins",
          searchKey: "first_name",
          actionLabel: "Invite administrator",
          actionRoute: "/team/new",
          permission: "admins.manage",
        },
        title: "Team — Arz Neshan",
      },
      {
        path: "team/new",
        component: EntityCreateComponent,
        data: { kind: "admin" },
        title: "Add administrator — Arz Neshan",
      },
      {
        path: "access",
        component: AccessManagementComponent,
        title: "Roles and access — Arz Neshan",
      },
      {
        path: "billing",
        component: BillingComponent,
        title: "Billing — Arz Neshan",
      },
      {
        path: "audit",
        component: ResourceListComponent,
        data: {
          title: "Audit log",
          eyebrow: "Accountability",
          description:
            "Immutable records of successful organization changes and sensitive commands.",
          endpoint: "organization/audit",
          searchKey: "action",
        },
        title: "Organization audit — Arz Neshan",
      },
      {
        path: "settings",
        component: SettingsComponent,
        title: "Workspace settings — Arz Neshan",
      },
    ],
  },
  { path: "**", redirectTo: "" },
];
