import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { ApiService } from "@shared/core/api.service";
import { displayValue, formatMoney } from "@shared/core/format";
import { ApiRecord } from "@shared/core/models";
import { SessionState } from "@shared/core/session.state";
import { PageHeaderComponent } from "@shared/ui/page-header.component";
import { StateComponent } from "@shared/ui/state.component";
import { WorkspaceReferenceLabelService } from "./workspace-reference-label.service";

@Component({
  imports: [RouterLink, PageHeaderComponent, StateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "workspace-page workspace-detail-page workspace-receipt-page",
  },
  template: `
    @if (loading()) {
      <an-state
        icon="…"
        title="Loading account"
        message="Retrieving account and ledger details."
      />
    } @else if (error()) {
      <an-state icon="!" title="Account unavailable" [message]="error()">
        <button class="btn btn-secondary" (click)="load()">Try again</button>
      </an-state>
    } @else if (account(); as record) {
      <an-page-header
        eyebrow="Ledger account"
        [title]="display(record['name'])"
        [description]="'Account ' + display(record['acc_no'])"
      >
        <a routerLink="/accounts" class="btn btn-secondary">All accounts</a>
        @if (record["client_id"]) {
          <a
            [routerLink]="['/clients', record['client_id']]"
            class="btn btn-primary"
            >Customer record</a
          >
        }
      </an-page-header>

      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        @for (field of fields; track field.key) {
          <article class="card p-5">
            <p
              class="mb-1 text-xs font-bold tracking-wide text-muted uppercase"
            >
              {{ field.label }}
            </p>
            <p
              class="mb-0 break-words text-sm font-semibold text-ink"
              [title]="fieldTitle(record, field.key)"
            >
              {{ fieldValue(record, field.key) }}
            </p>
          </article>
        }
      </section>

      <section class="mt-6">
        <div class="mb-3 flex items-end justify-between gap-4">
          <div>
            <p class="eyebrow mb-1">Posted activity</p>
            <h2 class="mb-0 text-xl font-bold">Account ledger</h2>
          </div>
          <span class="text-sm text-muted">{{ ledger().length }} entries</span>
        </div>
        @if (!session.can("reports.read")) {
          <an-state
            title="Ledger access is restricted"
            message="Your role can view account metadata but does not include report access."
          />
        } @else if (ledgerError()) {
          <an-state
            icon="!"
            title="Ledger unavailable"
            [message]="ledgerError()"
          />
        } @else if (ledger().length) {
          <div class="table-shell overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Entry</th>
                  <th>Currency</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                @for (
                  entry of ledger();
                  track entry["transaction_id"] + ":" + entry["type"]
                ) {
                  <tr>
                    <td>
                      <a
                        [routerLink]="[
                          '/transactions',
                          entry['transaction_id'],
                        ]"
                        class="font-semibold text-brand"
                      >
                        {{ display(entry["transaction_no"]) }}
                      </a>
                    </td>
                    <td>{{ display(entry["type"]) }}</td>
                    <td class="font-mono text-xs">{{ currencyCode() }}</td>
                    <td class="text-right font-mono font-bold">
                      {{ money(entry["amount"], currencyCode()) }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <an-state
            title="No ledger activity"
            message="Posted entries for this account will appear here."
          />
        }
      </section>
    }
  `,
})
export class AccountDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly references = inject(WorkspaceReferenceLabelService);
  readonly session = inject(SessionState);
  readonly account = signal<ApiRecord | null>(null);
  readonly ledger = signal<ApiRecord[]>([]);
  readonly loading = signal(true);
  readonly error = signal("");
  readonly ledgerError = signal("");
  readonly fields = [
    { key: "status", label: "Status" },
    { key: "type", label: "Account type" },
    { key: "owner_type", label: "Owner type" },
    { key: "currency_id", label: "Currency" },
    { key: "branch_id", label: "Branch" },
    { key: "operational_branch_id", label: "Operational branch" },
    { key: "cash_desk_id", label: "Cash desk" },
    { key: "partner_id", label: "Partner" },
    { key: "created_at", label: "Created" },
  ];
  readonly display = displayValue;
  readonly money = formatMoney;

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set("");
    this.ledgerError.set("");
    const id = this.route.snapshot.paramMap.get("id");
    if (!id) {
      this.error.set("Account identifier is missing.");
      this.loading.set(false);
      return;
    }
    try {
      const account = await firstValueFrom(
        this.api.get<ApiRecord>(`accounts/${id}`),
      );
      this.account.set(account);
      await this.references.prepare(
        this.fields.map((field) => field.key),
        [account],
      );
      if (this.session.can("reports.read")) {
        try {
          this.ledger.set(
            await firstValueFrom(
              this.api.get<ApiRecord[]>(`reports/accounts/${id}/ledger`),
            ),
          );
        } catch (error) {
          this.ledgerError.set(ApiService.errorMessage(error));
        }
      }
    } catch (error) {
      this.error.set(ApiService.errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  currencyCode(): string {
    const currency = this.account()?.["currency"] as ApiRecord | undefined;
    return String(currency?.["code"] ?? this.account()?.["currency_id"] ?? "");
  }

  fieldValue(record: ApiRecord, key: string): string {
    return this.references.display(key, record[key], record);
  }

  fieldTitle(record: ApiRecord, key: string): string {
    return this.references.tooltip(key, record[key], record);
  }
}
