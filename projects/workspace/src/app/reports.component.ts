import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { ApiService } from "@shared/core/api.service";
import { displayValue, escapeCsvCell, formatMoney } from "@shared/core/format";
import { ApiRecord } from "@shared/core/models";
import { PageHeaderComponent } from "@shared/ui/page-header.component";
import { StateComponent } from "@shared/ui/state.component";
import { WorkspaceReferenceLabelService } from "./workspace-reference-label.service";

@Component({
  imports: [FormsModule, RouterLink, PageHeaderComponent, StateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "workspace-page workspace-report-page" },
  template: `
    <an-page-header
      eyebrow="Financial reporting"
      title="Balances and account position"
      description="Live balance totals derived from posted transaction entries and limited to your assigned data scope."
    >
      <a routerLink="/reports/transactions" class="btn btn-secondary">
        Transaction activity
      </a>
      <button
        class="btn btn-secondary"
        (click)="exportCsv()"
        [disabled]="!filteredRows().length"
      >
        Export CSV
      </button>
    </an-page-header>
    @if (error()) {
      <an-state icon="!" title="Report unavailable" [message]="error()">
        <button class="btn btn-secondary" (click)="load()">Try again</button>
      </an-state>
    } @else if (loading()) {
      <an-state
        icon="…"
        title="Building report"
        message="Aggregating posted ledger entries."
      />
    } @else {
      <section
        class="mb-5 grid gap-4 sm:grid-cols-3"
        aria-label="Report summary"
      >
        <article class="card p-5">
          <p class="mb-1 text-xs font-bold tracking-wide text-muted uppercase">
            Visible accounts
          </p>
          <p class="mb-0 text-3xl font-bold text-ink">
            {{ filteredRows().length }}
          </p>
        </article>
        <article class="card p-5">
          <p class="mb-1 text-xs font-bold tracking-wide text-muted uppercase">
            Currencies
          </p>
          <p class="mb-0 text-3xl font-bold text-ink">
            {{ currencies().length }}
          </p>
        </article>
        <article class="card p-5">
          <p class="mb-1 text-xs font-bold tracking-wide text-muted uppercase">
            Negative positions
          </p>
          <p
            class="mb-0 text-3xl font-bold"
            [class.text-red-700]="negativeCount()"
          >
            {{ negativeCount() }}
          </p>
        </article>
      </section>

      <section
        class="card mb-5 grid gap-4 p-4 md:grid-cols-[1fr_14rem_auto] md:items-end"
        aria-label="Report filters"
      >
        <div>
          <label class="label" for="report-search">Search accounts</label>
          <input
            class="input"
            id="report-search"
            [ngModel]="query()"
            (ngModelChange)="query.set($event)"
            placeholder="Account name or number"
          />
        </div>
        <div>
          <label class="label" for="report-currency">Currency</label>
          <select
            class="input"
            id="report-currency"
            [ngModel]="currency()"
            (ngModelChange)="currency.set($event)"
          >
            <option value="">All currencies</option>
            @for (code of currencies(); track code) {
              <option [value]="code">{{ code }}</option>
            }
          </select>
        </div>
        <label
          class="flex min-h-11 items-center gap-3 rounded-lg border border-line px-4 py-2 text-sm font-semibold"
        >
          <input
            type="checkbox"
            [ngModel]="hideZero()"
            (ngModelChange)="hideZero.set($event)"
            class="accent-emerald-700"
          />
          Hide zero balances
        </label>
      </section>

      @if (!filteredRows().length) {
        <an-state
          title="No balances found"
          [message]="
            rows().length
              ? 'Change the report filters to see more accounts.'
              : 'Balances appear after the first financial operation is posted.'
          "
        />
      } @else {
        <div class="table-shell overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Account number</th>
                <th>Account name</th>
                <th>Owner</th>
                <th>Type</th>
                <th>Currency</th>
                <th class="text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              @for (
                row of filteredRows();
                track row["account_id"] + ":" + row["currency_id"]
              ) {
                <tr>
                  <td>
                    <a
                      [routerLink]="['/accounts', row['account_id']]"
                      class="font-semibold text-brand"
                      >{{ display(row["account_no"]) }}</a
                    >
                  </td>
                  <td>{{ display(row["account_name"]) }}</td>
                  <td>{{ display(row["owner_type"]) }}</td>
                  <td>{{ display(row["account_type"]) }}</td>
                  <td class="font-mono text-xs">
                    {{ currencyLabel(row) }}
                  </td>
                  <td
                    class="text-right font-mono font-bold"
                    [class.text-red-700]="negative(row['balance'])"
                  >
                    {{ money(row["balance"], row["currency_code"]) }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
      <p class="mt-4 text-xs leading-5 text-muted">
        Balances are operational figures from the workspace ledger. Confirm
        settlement and cash counts using your organization’s control procedures.
      </p>
    }
  `,
})
export class ReportsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly references = inject(WorkspaceReferenceLabelService);
  readonly rows = signal<ApiRecord[]>([]);
  readonly loading = signal(true);
  readonly error = signal("");
  readonly query = signal("");
  readonly currency = signal("");
  readonly hideZero = signal(false);
  readonly currencies = computed(() =>
    [...new Set(this.rows().map((row) => this.currencyLabel(row)))]
      .filter(Boolean)
      .sort(),
  );
  readonly filteredRows = computed(() => {
    const needle = this.query().trim().toLowerCase();
    return this.rows().filter((row) => {
      const code = this.currencyLabel(row);
      if (this.currency() && code !== this.currency()) return false;
      if (this.hideZero() && this.isZero(row["balance"])) return false;
      return (
        !needle ||
        [
          row["account_no"],
          row["account_name"],
          row["owner_type"],
          row["account_type"],
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(needle),
        )
      );
    });
  });
  readonly negativeCount = computed(
    () =>
      this.filteredRows().filter((row) => this.negative(row["balance"])).length,
  );
  readonly display = displayValue;
  readonly money = formatMoney;

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set("");
    try {
      const rows = await firstValueFrom(
        this.api.get<ApiRecord[]>("reports/account-balances"),
      );
      this.rows.set(rows);
      await this.references.prepare(["currency_id"], rows);
    } catch (error) {
      this.error.set(ApiService.errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  negative(value: unknown): boolean {
    return /^-/.test(String(value ?? "").trim()) && !this.isZero(value);
  }

  currencyLabel(row: ApiRecord): string {
    return row["currency_code"]
      ? String(row["currency_code"])
      : this.references.display("currency_id", row["currency_id"], row);
  }

  exportCsv(): void {
    const headers = [
      "Account number",
      "Account name",
      "Owner type",
      "Account type",
      "Currency",
      "Balance",
    ];
    const body = this.filteredRows().map((row) => [
      row["account_no"],
      row["account_name"],
      row["owner_type"],
      row["account_type"],
      this.currencyLabel(row),
      row["balance"],
    ]);
    const csv = [headers, ...body]
      .map((line) => line.map((value) => escapeCsvCell(value)).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `account-balances-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private isZero(value: unknown): boolean {
    return /^-?0+(?:\.0+)?$/.test(String(value ?? "").trim());
  }
}
