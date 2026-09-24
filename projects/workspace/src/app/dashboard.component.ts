import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { ApiService } from "@shared/core/api.service";
import { ApiRecord, Paginated } from "@shared/core/models";
import { PageHeaderComponent } from "@shared/ui/page-header.component";
import { StateComponent } from "@shared/ui/state.component";
import { displayValue } from "@shared/core/format";
import { SessionState } from "@shared/core/session.state";

@Component({
  imports: [RouterLink, PageHeaderComponent, StateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "workspace-page workspace-dashboard-page" },
  template: `
    <an-page-header
      eyebrow="Daily operations"
      title="Workspace overview"
      description="Post common operations and review the latest activity within your permitted scope."
    />
    @if (error()) {
      <an-state icon="!" title="Overview unavailable" [message]="error()"
        ><button class="btn btn-secondary" (click)="load()">
          Try again
        </button></an-state
      >
    } @else {
      <section class="workspace-action-grid" aria-label="Quick operations">
        @for (action of actions; track action.route) {
          @if (session.can(action.permission)) {
            <a [routerLink]="action.route" class="workspace-action-card">
              <span class="workspace-action-card__icon">{{ action.icon }}</span>
              <span>
                <strong>{{ action.label }}</strong>
                <small>{{ action.copy }}</small>
              </span>
              <span class="workspace-action-card__arrow" aria-hidden="true"
                >→</span
              >
            </a>
          }
        }
      </section>
      <section
        class="workspace-metric-grid mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
        aria-label="Workspace totals"
      >
        @for (metric of metrics; track metric.key) {
          <article class="card workspace-metric-card p-5">
            <p class="text-xs font-bold tracking-wider text-muted uppercase">
              {{ metric.label }}
            </p>
            <p class="mt-3 mb-0 text-3xl font-bold tracking-tight text-ink">
              {{ dashboard()[metric.key] ?? "—" }}
            </p>
          </article>
        }
      </section>
      <section class="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        @if (session.can("transactions.read")) {
          <article class="card overflow-hidden">
            <div
              class="flex items-center justify-between border-b border-line px-5 py-4"
            >
              <div>
                <h2 class="mb-0 text-lg font-bold">Recent transactions</h2>
                <p class="muted mb-0">Latest posted activity</p>
              </div>
              <a routerLink="/transactions" class="btn btn-ghost">View all</a>
            </div>
            @if (transactions().length) {
              <div class="overflow-x-auto">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Transaction</th>
                      <th>Description</th>
                      <th>Reference</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of transactions(); track row["id"]) {
                      <tr>
                        <td>
                          <a
                            [routerLink]="['/transactions', row['id']]"
                            class="font-semibold text-brand"
                          >
                            {{ display(row["tr_no"]) }}
                          </a>
                        </td>
                        <td>{{ display(row["description"]) }}</td>
                        <td>{{ display(row["reference"]) }}</td>
                        <td>{{ display(row["created_at"]) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <div class="p-8 text-center text-sm text-muted">
                No transactions have been posted yet.
              </div>
            }
          </article>
        }
        @if (session.can("money_orders.read")) {
          <article class="card overflow-hidden">
            <div
              class="flex items-center justify-between border-b border-line px-5 py-4"
            >
              <div>
                <h2 class="mb-0 text-lg font-bold">Money orders</h2>
                <p class="muted mb-0">Recent settlement activity</p>
              </div>
              <a routerLink="/money-orders" class="btn btn-ghost">View all</a>
            </div>
            @if (orders().length) {
              <div class="divide-y divide-line">
                @for (row of orders(); track row["id"]) {
                  <a
                    [routerLink]="['/money-orders', row['id']]"
                    class="flex items-center justify-between gap-4 px-5 py-4 no-underline hover:bg-slate-50"
                  >
                    <div>
                      <p class="mb-1 text-sm font-bold">
                        {{ display(row["orderNo"] ?? row["order_no"]) }}
                      </p>
                      <p class="mb-0 text-xs text-muted">
                        {{
                          display(
                            row["beneficiaryName"] ?? row["beneficiary_name"]
                          )
                        }}
                      </p>
                    </div>
                    <span
                      class="pill border-emerald-200 bg-emerald-50 text-brand"
                      >{{ display(row["status"]) }}</span
                    >
                  </a>
                }
              </div>
            } @else {
              <div class="p-8 text-center text-sm text-muted">
                No money orders to show.
              </div>
            }
          </article>
        }
      </section>
    }
  `,
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly session = inject(SessionState);
  readonly dashboard = signal<ApiRecord>({});
  readonly transactions = signal<ApiRecord[]>([]);
  readonly orders = signal<ApiRecord[]>([]);
  readonly error = signal("");
  readonly metrics = [
    { key: "clients", label: "Customers" },
    { key: "accounts", label: "Accounts" },
    { key: "transactions", label: "Transactions" },
    { key: "moneyOrders", label: "Money orders" },
    { key: "balances", label: "Active balances" },
  ];
  readonly actions = [
    {
      route: "/operations/deposit",
      icon: "+",
      label: "Deposit",
      copy: "Post funds to a customer account.",
      permission: "fund_flows.create",
    },
    {
      route: "/operations/withdrawal",
      icon: "−",
      label: "Withdrawal",
      copy: "Record a customer cash withdrawal.",
      permission: "fund_flows.create",
    },
    {
      route: "/operations/transfer",
      icon: "↔",
      label: "Transfer",
      copy: "Move value between customers.",
      permission: "transfers.create",
    },
    {
      route: "/operations/exchange",
      icon: "◇",
      label: "Exchange",
      copy: "Convert between two currencies.",
      permission: "fx.create",
    },
  ];
  readonly display = displayValue;
  ngOnInit(): void {
    void this.load();
  }
  async load(): Promise<void> {
    this.error.set("");
    try {
      const [dashboard, transactions, orders] = await Promise.all([
        firstValueFrom(this.api.get<ApiRecord>("reports/admin-dashboard")),
        this.session.can("transactions.read")
          ? firstValueFrom(
              this.api.get<Paginated<ApiRecord>>("transactions", {
                page: 1,
                perPage: 5,
              }),
            )
          : Promise.resolve({ data: [] }),
        this.session.can("money_orders.read")
          ? firstValueFrom(
              this.api.get<Paginated<ApiRecord>>("money-orders", {
                page: 1,
                perPage: 5,
              }),
            )
          : Promise.resolve({ data: [] }),
      ]);
      this.dashboard.set(dashboard);
      this.transactions.set(ApiService.rows(transactions));
      this.orders.set(ApiService.rows(orders));
    } catch (error) {
      this.error.set(ApiService.errorMessage(error));
    }
  }
}
