import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { ApiService } from "@shared/core/api.service";
import { displayValue, formatMoney } from "@shared/core/format";
import { ApiRecord, Paginated } from "@shared/core/models";
import { SessionState } from "@shared/core/session.state";
import { PageHeaderComponent } from "@shared/ui/page-header.component";
import { StateComponent } from "@shared/ui/state.component";

interface TransactionReportResponse {
  data: ApiRecord[];
  summary: {
    transaction_count: number;
    row_count: number;
    truncated: boolean;
    totals: Array<{ currency_code: string; amount: string }>;
  };
}

interface TransactionFilters {
  [key: string]: string;
  date_from: string;
  date_to: string;
  type: string;
  status: string;
  branch_id: string;
  currency_id: string;
}

@Component({
  imports: [FormsModule, RouterLink, PageHeaderComponent, StateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "workspace-page workspace-report-page" },
  template: `
    <an-page-header
      eyebrow="Financial reporting"
      title="Transaction activity"
      description="Review scoped transaction volume by date, operation, status, branch, and currency."
    >
      <a routerLink="/reports" class="btn btn-secondary">Account balances</a>
      <button
        class="btn btn-secondary"
        (click)="exportCsv()"
        [disabled]="exporting() || !rows().length"
      >
        {{ exporting() ? "Preparing…" : "Export server CSV" }}
      </button>
    </an-page-header>

    <section class="card mb-6 p-5" aria-label="Transaction report filters">
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-6 xl:items-end">
        <div>
          <label class="label" for="from">From</label
          ><input
            class="input"
            id="from"
            type="date"
            [(ngModel)]="filters.date_from"
          />
        </div>
        <div>
          <label class="label" for="to">To</label
          ><input
            class="input"
            id="to"
            type="date"
            [(ngModel)]="filters.date_to"
          />
        </div>
        <div>
          <label class="label" for="operation">Operation</label>
          <select class="input" id="operation" [(ngModel)]="filters.type">
            <option value="">All operations</option>
            @for (type of transactionTypes; track type) {
              <option [value]="type">{{ type }}</option>
            }
          </select>
        </div>
        <div>
          <label class="label" for="status">Status</label>
          <select class="input" id="status" [(ngModel)]="filters.status">
            <option value="">All statuses</option>
            <option value="posted">Posted</option>
            <option value="reversed">Reversed</option>
          </select>
        </div>
        <div>
          <label class="label" for="currency">Currency</label>
          <select class="input" id="currency" [(ngModel)]="filters.currency_id">
            <option value="">All currencies</option>
            @for (currency of currencies(); track currency.id) {
              <option [value]="currency.id">{{ currency.label }}</option>
            }
          </select>
        </div>
        <button class="btn btn-primary" (click)="load()" [disabled]="loading()">
          Apply filters
        </button>
      </div>
      @if (branches().length) {
        <div class="mt-4 max-w-sm">
          <label class="label" for="branch">Branch</label>
          <select class="input" id="branch" [(ngModel)]="filters.branch_id">
            <option value="">All permitted branches</option>
            @for (branch of branches(); track branch.id) {
              <option [value]="branch.id">{{ branch.label }}</option>
            }
          </select>
        </div>
      }
    </section>

    @if (error()) {
      <an-state
        icon="!"
        title="Transaction report unavailable"
        [message]="error()"
      />
    } @else if (loading()) {
      <an-state
        icon="…"
        title="Building report"
        message="Aggregating scoped transaction activity."
      />
    } @else {
      <section class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article class="metric">
          <p class="metric-label">Transactions</p>
          <p class="metric-value">{{ summary()?.transaction_count ?? 0 }}</p>
          <p class="metric-hint">Distinct posted records</p>
        </article>
        @for (total of summary()?.totals ?? []; track total.currency_code) {
          <article class="metric">
            <p class="metric-label">{{ total.currency_code }} volume</p>
            <p class="metric-value text-2xl">
              {{ money(total.amount, total.currency_code) }}
            </p>
            <p class="metric-hint">Debit-side activity</p>
          </article>
        }
      </section>
      @if (summary()?.truncated) {
        <p class="notice mb-5">
          The screen is limited to 1,000 result rows. Use the server CSV export
          for up to 10,000 rows.
        </p>
      }
      @if (!rows().length) {
        <an-state
          title="No transaction activity"
          message="No records match the selected reporting period and filters."
        />
      } @else {
        <div class="table-shell overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Operation</th>
                <th>Status</th>
                <th>Currency</th>
                <th class="text-right">Volume</th>
                <th>Branch</th>
                <th>Posted</th>
              </tr>
            </thead>
            <tbody>
              @for (
                row of rows();
                track row["transaction_id"] + ":" + row["currency_id"]
              ) {
                <tr>
                  <td>
                    <a
                      class="font-semibold text-brand"
                      [routerLink]="['/transactions', row['transaction_id']]"
                      >{{ display(row["transaction_no"]) }}</a
                    >
                  </td>
                  <td>{{ display(row["type"]) }}</td>
                  <td>
                    <span
                      [class]="
                        row['status'] === 'reversed'
                          ? 'status-badge status-danger'
                          : 'status-badge status-success'
                      "
                      >{{ display(row["status"]) }}</span
                    >
                  </td>
                  <td class="font-mono text-xs">
                    {{ display(row["currency_code"]) }}
                  </td>
                  <td class="text-right font-mono font-bold">
                    {{ money(row["volume"], row["currency_code"]) }}
                  </td>
                  <td>
                    {{ branchLabel(row["branch_id"]) }}
                  </td>
                  <td>{{ display(row["created_at"]) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    }
  `,
})
export class TransactionReportComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly session = inject(SessionState);
  readonly rows = signal<ApiRecord[]>([]);
  readonly summary = signal<TransactionReportResponse["summary"] | null>(null);
  readonly branches = signal<Array<{ id: string; label: string }>>([]);
  readonly currencies = signal<Array<{ id: string; label: string }>>([]);
  readonly loading = signal(true);
  readonly exporting = signal(false);
  readonly error = signal("");
  readonly filters: TransactionFilters = {
    date_from: "",
    date_to: "",
    type: "",
    status: "",
    branch_id: "",
    currency_id: "",
  };
  readonly transactionTypes = [
    "deposit",
    "withdrawal",
    "transfer",
    "exchange",
    "money_order",
    "reversal",
  ];
  readonly display = displayValue;
  readonly money = formatMoney;

  ngOnInit(): void {
    void Promise.all([this.loadOptions(), this.load()]);
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set("");
    try {
      const response = await firstValueFrom(
        this.api.get<TransactionReportResponse>(
          "reports/transactions",
          this.filters,
        ),
      );
      this.rows.set(response.data);
      this.summary.set(response.summary);
    } catch (error) {
      this.error.set(ApiService.errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  async exportCsv(): Promise<void> {
    if (this.exporting()) return;
    this.exporting.set(true);
    try {
      const blob = await firstValueFrom(
        this.api.download("reports/transactions/export.csv", this.filters),
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      this.error.set(ApiService.errorMessage(error));
    } finally {
      this.exporting.set(false);
    }
  }

  branchLabel(value: unknown): string {
    if (!value) return "—";
    const id = String(value);
    return (
      this.branches().find((branch) => branch.id === id)?.label ??
      `ID …${id.slice(-8)}`
    );
  }

  private async loadOptions(): Promise<void> {
    const options = async (path: string, permission: string, label: string) => {
      if (!this.session.can(permission)) return [];
      const response = await firstValueFrom(
        this.api.get<ApiRecord[] | Paginated<ApiRecord>>(path, {
          perPage: 100,
        }),
      );
      return ApiService.rows(response).map((row) => ({
        id: String(row["id"]),
        label: String(row[label] ?? row["name"] ?? row["id"]),
      }));
    };
    const results = await Promise.allSettled([
      options("branches", "branches.read", "name"),
      options("currencies", "currencies.read", "code"),
    ]);
    if (results[0].status === "fulfilled") this.branches.set(results[0].value);
    if (results[1].status === "fulfilled")
      this.currencies.set(results[1].value);
  }
}
