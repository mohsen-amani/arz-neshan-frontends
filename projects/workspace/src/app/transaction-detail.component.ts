import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import { ApiService } from "@shared/core/api.service";
import { displayValue, formatMoney, humanize } from "@shared/core/format";
import { ApiRecord } from "@shared/core/models";
import { PageHeaderComponent } from "@shared/ui/page-header.component";
import { StateComponent } from "@shared/ui/state.component";
import { SessionState } from "@shared/core/session.state";
import { WorkspaceReferenceLabelService } from "./workspace-reference-label.service";

@Component({
  imports: [
    RouterLink,
    ReactiveFormsModule,
    PageHeaderComponent,
    StateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "workspace-page workspace-detail-page workspace-receipt-page",
  },
  template: `
    @if (loading()) {
      <an-state
        icon="…"
        title="Loading transaction"
        message="Retrieving the immutable posted record."
      />
    } @else if (error()) {
      <an-state icon="!" title="Transaction unavailable" [message]="error()">
        <button class="btn btn-secondary" (click)="load()">Try again</button>
      </an-state>
    } @else if (transaction(); as record) {
      <an-page-header
        eyebrow="Posted transaction"
        [title]="display(record['tr_no'])"
        [description]="display(record['description'])"
      >
        <a routerLink="/transactions" class="btn btn-secondary"
          >All transactions</a
        >
        <button class="btn btn-primary" (click)="printReceipt()">
          Print receipt
        </button>
        @if (canReverse()) {
          <button class="btn btn-danger" (click)="showReversal.set(true)">
            Reverse transaction
          </button>
        }
      </an-page-header>

      @if (reversalNotice()) {
        <p
          class="notice mb-5"
          [class.notice-danger]="reversalFailed()"
          role="status"
        >
          {{ reversalNotice() }}
          @if (reversalId()) {
            <a
              class="ml-2 font-bold underline"
              [routerLink]="['/transactions', reversalId()]"
              >View reversal</a
            >
          }
        </p>
      }

      @if (showReversal() && canReverse()) {
        <section
          class="mb-6 rounded-xl border border-red-200 bg-red-50 p-5"
          aria-labelledby="reversal-title"
        >
          <div class="max-w-3xl">
            <p
              class="mb-1 text-xs font-bold tracking-wider text-red-700 uppercase"
            >
              Sensitive financial command
            </p>
            <h2 id="reversal-title" class="mb-2 text-lg font-bold text-red-950">
              Create a compensating reversal
            </h2>
            <p class="mb-5 text-sm leading-6 text-red-900">
              The original record remains immutable. Confirming creates an equal
              and opposite transaction and marks this record reversed.
            </p>
            <form
              [formGroup]="reversalForm"
              (ngSubmit)="reverse()"
              class="space-y-4"
            >
              <div>
                <label class="label text-red-950" for="reversal-reason"
                  >Required reason</label
                >
                <textarea
                  class="input min-h-24"
                  id="reversal-reason"
                  formControlName="reason"
                  maxlength="500"
                  placeholder="Explain the operational error and correction"
                ></textarea>
              </div>
              <div class="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  class="btn btn-secondary"
                  (click)="showReversal.set(false)"
                  [disabled]="reversing()"
                >
                  Keep transaction
                </button>
                <button
                  class="btn btn-danger"
                  [disabled]="reversing() || reversalForm.invalid"
                >
                  {{ reversing() ? "Creating reversal…" : "Confirm reversal" }}
                </button>
              </div>
            </form>
          </div>
        </section>
      }

      <section class="card overflow-hidden" aria-label="Transaction receipt">
        <div
          class="grid gap-4 border-b border-line bg-slate-50 p-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          @for (field of headerFields; track field.key) {
            <div>
              <p
                class="mb-1 text-xs font-bold tracking-wide text-muted uppercase"
              >
                {{ field.label }}
              </p>
              @if (field.key === "status") {
                <span
                  class="pill border-emerald-200 bg-emerald-50 text-brand"
                  >{{ display(record[field.key]) }}</span
                >
              } @else {
                <p class="mb-0 break-all text-sm font-semibold text-ink">
                  {{ display(record[field.key]) }}
                </p>
              }
            </div>
          }
        </div>

        <div class="p-6">
          <div class="mb-4 flex items-center justify-between gap-4">
            <div>
              <p class="eyebrow mb-1">Double-entry posting</p>
              <h2 class="mb-0 text-lg font-bold">Ledger entries</h2>
            </div>
            <span class="text-sm text-muted"
              >{{ entries().length }} entries</span
            >
          </div>
          @if (entries().length) {
            <div class="table-shell overflow-x-auto">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Entry</th>
                    <th>Currency</th>
                    <th class="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  @for (entry of entries(); track entry["id"]) {
                    <tr>
                      <td>
                        <a
                          [routerLink]="['/accounts', entry['account_id']]"
                          class="font-semibold text-brand"
                        >
                          {{ accountLabel(entry) }}
                        </a>
                      </td>
                      <td>
                        <span
                          class="pill"
                          [class]="
                            entry['type'] === 'debit'
                              ? 'pill border-blue-200 bg-blue-50 text-blue-800'
                              : 'pill border-violet-200 bg-violet-50 text-violet-800'
                          "
                          >{{ display(entry["type"]) }}</span
                        >
                      </td>
                      <td class="font-mono text-xs">
                        {{ currencyCode(entry) }}
                      </td>
                      <td class="text-right font-mono font-bold">
                        {{ money(entry["amount"], currencyCode(entry)) }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <an-state
              title="No ledger entries"
              message="This record has no visible posting entries."
            />
          }
        </div>

        <dl class="grid gap-x-8 border-t border-line p-6 sm:grid-cols-2">
          @for (field of auditFields; track field) {
            <div class="border-b border-line py-3">
              <dt class="text-xs font-bold tracking-wide text-muted uppercase">
                {{ humanize(field) }}
              </dt>
              <dd
                class="mt-1 mb-0 break-words text-sm text-ink"
                [title]="referenceTitle(record, field)"
              >
                {{ referenceValue(record, field) }}
              </dd>
            </div>
          }
        </dl>
      </section>
      <p class="mt-4 text-xs leading-5 text-muted">
        This receipt reflects an immutable posted transaction. Corrections must
        be made through an authorized reversal workflow.
      </p>
    }
  `,
})
export class TransactionDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly references = inject(WorkspaceReferenceLabelService);
  readonly session = inject(SessionState);
  readonly transaction = signal<ApiRecord | null>(null);
  readonly loading = signal(true);
  readonly error = signal("");
  readonly showReversal = signal(false);
  readonly reversing = signal(false);
  readonly reversalNotice = signal("");
  readonly reversalFailed = signal(false);
  readonly reversalId = signal("");
  readonly reversalForm = this.fb.nonNullable.group({
    reason: [
      "",
      [Validators.required, Validators.minLength(3), Validators.maxLength(500)],
    ],
  });
  readonly canReverse = computed(
    () =>
      this.session.can("transactions.reverse") &&
      this.transaction()?.["status"] === "posted" &&
      this.transaction()?.["type"] !== "reversal",
  );
  readonly entries = computed(() => {
    const value = this.transaction()?.["entries"];
    return Array.isArray(value) ? (value as ApiRecord[]) : [];
  });
  readonly headerFields = [
    { key: "type", label: "Operation" },
    { key: "status", label: "Status" },
    { key: "reference", label: "Reference" },
    { key: "created_at", label: "Posted at" },
  ];
  readonly auditFields = [
    "reason",
    "branch_id",
    "cash_desk_id",
    "created_by_admin_id",
    "reverses_transaction_id",
  ];
  readonly display = displayValue;
  readonly humanize = humanize;
  readonly money = formatMoney;

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set("");
    const id = this.route.snapshot.paramMap.get("id");
    if (!id) {
      this.error.set("Transaction identifier is missing.");
      this.loading.set(false);
      return;
    }
    try {
      const transaction = await firstValueFrom(
        this.api.get<ApiRecord>(`transactions/${id}`),
      );
      this.transaction.set(transaction);
      const entries = Array.isArray(transaction["entries"])
        ? (transaction["entries"] as ApiRecord[])
        : [];
      await Promise.all([
        this.references.prepare(this.auditFields, [transaction]),
        this.references.prepare(["account_id", "currency_id"], entries),
      ]);
    } catch (error) {
      this.error.set(ApiService.errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  accountLabel(entry: ApiRecord): string {
    const account = entry["account"] as ApiRecord | undefined;
    if (!account) {
      return this.references.display("account_id", entry["account_id"], entry);
    }
    return (
      [account?.["acc_no"], account?.["name"]].filter(Boolean).join(" · ") ||
      String(entry["account_id"] ?? "—")
    );
  }

  currencyCode(entry: ApiRecord): string {
    const account = entry["account"] as ApiRecord | undefined;
    const currency = account?.["currency"] as ApiRecord | undefined;
    if (!currency?.["code"]) {
      return this.references.display(
        "currency_id",
        entry["currency_id"],
        entry,
      );
    }
    return String(currency?.["code"] ?? entry["currency_id"] ?? "");
  }

  referenceValue(record: ApiRecord, field: string): string {
    return this.references.display(field, record[field], record);
  }

  referenceTitle(record: ApiRecord, field: string): string {
    return this.references.tooltip(field, record[field], record);
  }

  printReceipt(): void {
    window.print();
  }

  async reverse(): Promise<void> {
    const id = this.transaction()?.["id"];
    if (!id || this.reversalForm.invalid || this.reversing()) return;
    this.reversing.set(true);
    this.reversalNotice.set("");
    try {
      const reversal = await firstValueFrom(
        this.api.post<ApiRecord>(
          `transactions/${String(id)}/reversal`,
          this.reversalForm.getRawValue(),
          crypto.randomUUID(),
        ),
      );
      this.reversalId.set(String(reversal["id"] ?? ""));
      this.reversalNotice.set(
        "The transaction was reversed with a compensating entry.",
      );
      this.reversalFailed.set(false);
      this.showReversal.set(false);
      await this.load();
    } catch (error) {
      this.reversalNotice.set(ApiService.errorMessage(error));
      this.reversalFailed.set(true);
    } finally {
      this.reversing.set(false);
    }
  }
}
