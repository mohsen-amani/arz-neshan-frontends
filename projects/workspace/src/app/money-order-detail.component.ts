import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { ApiService } from "@shared/core/api.service";
import { displayValue, formatMoney } from "@shared/core/format";
import { ApiRecord, Paginated } from "@shared/core/models";
import { SessionState } from "@shared/core/session.state";
import { PageHeaderComponent } from "@shared/ui/page-header.component";
import { StateComponent } from "@shared/ui/state.component";
import { WorkspaceReferenceLabelService } from "./workspace-reference-label.service";

@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
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
        title="Loading money order"
        message="Retrieving funding and payout status."
      />
    } @else if (error() && !order()) {
      <an-state icon="!" title="Money order unavailable" [message]="error()">
        <button class="btn btn-secondary" (click)="load()">Try again</button>
      </an-state>
    } @else if (order(); as record) {
      <an-page-header
        eyebrow="Money order"
        [title]="display(record['order_no'])"
        [description]="display(record['beneficiary_name'])"
      >
        <a routerLink="/money-orders" class="btn btn-secondary"
          >All money orders</a
        >
      </an-page-header>

      @if (error()) {
        <p
          class="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          {{ error() }}
        </p>
      }
      @if (success()) {
        <p
          class="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-brand"
          role="status"
        >
          {{ success() }}
        </p>
      }

      <section class="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <article class="card overflow-hidden">
          <div
            class="flex items-center justify-between border-b border-line bg-slate-50 px-6 py-4"
          >
            <div>
              <p class="eyebrow mb-1">Settlement instruction</p>
              <h2 class="mb-0 text-lg font-bold">Order details</h2>
            </div>
            <span class="pill border-emerald-200 bg-emerald-50 text-brand">{{
              display(record["status"])
            }}</span>
          </div>
          <dl class="grid gap-x-8 p-6 sm:grid-cols-2">
            @for (field of detailFields; track field.key) {
              <div class="border-b border-line py-3">
                <dt
                  class="text-xs font-bold tracking-wide text-muted uppercase"
                >
                  {{ field.label }}
                </dt>
                <dd
                  class="mt-1 mb-0 break-words text-sm font-semibold text-ink"
                  [title]="detailTitle(record, field.key)"
                >
                  @if (field.key === "amount" || field.key === "fee_amount") {
                    {{ money(record[field.key], currencyCode()) }}
                  } @else {
                    {{ detailValue(record, field.key) }}
                  }
                </dd>
              </div>
            }
          </dl>
        </article>

        <aside class="card p-6">
          <p class="eyebrow mb-1">Audit trail</p>
          <h2 class="mb-5 text-lg font-bold">Posting records</h2>
          <div class="space-y-4">
            <div>
              <p class="mb-1 text-xs font-bold text-muted uppercase">
                Funding transaction
              </p>
              @if (record["funding_transaction_id"]) {
                <a
                  [routerLink]="[
                    '/transactions',
                    record['funding_transaction_id'],
                  ]"
                  class="break-all text-sm font-semibold text-brand"
                  >View funding receipt</a
                >
              } @else {
                <p class="mb-0 text-sm text-muted">Not posted</p>
              }
            </div>
            <div>
              <p class="mb-1 text-xs font-bold text-muted uppercase">
                Payout transaction
              </p>
              @if (record["payout_transaction_id"]) {
                <a
                  [routerLink]="[
                    '/transactions',
                    record['payout_transaction_id'],
                  ]"
                  class="break-all text-sm font-semibold text-brand"
                  >View payout receipt</a
                >
              } @else {
                <p class="mb-0 text-sm text-muted">Awaiting payout</p>
              }
            </div>
            <div>
              <p class="mb-1 text-xs font-bold text-muted uppercase">Created</p>
              <p class="mb-0 text-sm text-ink">
                {{ display(record["created_at"]) }}
              </p>
            </div>
          </div>
        </aside>
      </section>

      @if (
        record["status"] === "funded" && session.can("money_orders.payout")
      ) {
        <section class="card mt-6 overflow-hidden">
          <div class="border-b border-line bg-amber-50 px-6 py-4">
            <p class="mb-1 text-sm font-bold text-amber-900">
              Authorize payout
            </p>
            <p class="mb-0 text-xs text-amber-800">
              Payout posts a second immutable transaction and cannot be
              repeated.
            </p>
          </div>
          @if (!reviewing()) {
            <form
              class="grid gap-5 p-6 sm:grid-cols-2"
              [formGroup]="form"
              (ngSubmit)="reviewPayout()"
            >
              @if (record["payout_type"] === "cash") {
                <div>
                  <label class="label" for="payout-branch">Payout branch</label>
                  <select
                    class="input"
                    id="payout-branch"
                    formControlName="branchId"
                  >
                    <option value="">Use original branch</option>
                    @for (option of branches(); track option.id) {
                      <option [value]="option.id">{{ option.label }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="label" for="payout-desk"
                    >Payout cash desk</label
                  >
                  <select
                    class="input"
                    id="payout-desk"
                    formControlName="cashDeskId"
                  >
                    <option value="">Use original cash desk</option>
                    @for (option of cashDesks(); track option.id) {
                      <option [value]="option.id">{{ option.label }}</option>
                    }
                  </select>
                </div>
              }
              @if (record["payout_type"] === "account") {
                <div class="sm:col-span-2">
                  <label class="label" for="payout-client"
                    >Beneficiary customer</label
                  >
                  <select
                    class="input"
                    id="payout-client"
                    formControlName="beneficiaryClientId"
                  >
                    <option value="">Use order beneficiary</option>
                    @for (option of clients(); track option.id) {
                      <option [value]="option.id">{{ option.label }}</option>
                    }
                  </select>
                </div>
              }
              <div class="sm:col-span-2">
                <label class="label" for="payout-reason"
                  >Payout note
                  <span class="font-normal text-muted">(optional)</span></label
                >
                <textarea
                  class="input min-h-20"
                  id="payout-reason"
                  formControlName="reason"
                ></textarea>
              </div>
              <div class="flex justify-end sm:col-span-2">
                <button class="btn btn-primary min-w-40">Review payout</button>
              </div>
            </form>
          } @else {
            <div class="p-6">
              <h3 class="mb-2 text-base font-bold">Final confirmation</h3>
              <p class="muted max-w-2xl">
                Confirm payout of
                <strong class="text-ink">{{
                  money(record["amount"], currencyCode())
                }}</strong>
                to
                <strong class="text-ink">{{
                  display(record["beneficiary_name"])
                }}</strong
                >. The order will move from funded to paid.
              </p>
              <dl class="mt-5 grid gap-x-8 sm:grid-cols-2">
                @for (entry of payoutEntries(); track entry[0]) {
                  <div class="border-b border-line py-3">
                    <dt class="text-xs font-bold text-muted uppercase">
                      {{ entry[0] }}
                    </dt>
                    <dd class="mt-1 mb-0 break-all text-sm text-ink">
                      {{ display(entry[1]) }}
                    </dd>
                  </div>
                }
              </dl>
              <div
                class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"
              >
                <button
                  class="btn btn-secondary"
                  (click)="reviewing.set(false)"
                  [disabled]="busy()"
                >
                  Edit
                </button>
                <button
                  class="btn btn-primary min-w-40"
                  (click)="confirmPayout()"
                  [disabled]="busy()"
                >
                  {{ busy() ? "Posting…" : "Confirm payout" }}
                </button>
              </div>
            </div>
          }
        </section>
      }
    }
  `,
})
export class MoneyOrderDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly references = inject(WorkspaceReferenceLabelService);
  readonly session = inject(SessionState);
  readonly order = signal<ApiRecord | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly reviewing = signal(false);
  readonly error = signal("");
  readonly success = signal("");
  readonly branches = signal<Array<{ id: string; label: string }>>([]);
  readonly cashDesks = signal<Array<{ id: string; label: string }>>([]);
  readonly clients = signal<Array<{ id: string; label: string }>>([]);
  readonly form = this.fb.nonNullable.group({
    branchId: [""],
    cashDeskId: [""],
    beneficiaryClientId: [""],
    reason: [""],
  });
  readonly detailFields = [
    { key: "direction", label: "Direction" },
    { key: "beneficiary_name", label: "Beneficiary" },
    { key: "beneficiary_phone", label: "Beneficiary phone" },
    { key: "sender_client_id", label: "Sender customer" },
    { key: "beneficiary_client_id", label: "Beneficiary customer" },
    { key: "partner_id", label: "Settlement partner" },
    { key: "amount", label: "Amount" },
    { key: "fee_amount", label: "Fee" },
    { key: "funding_type", label: "Funding" },
    { key: "payout_type", label: "Payout" },
    { key: "tracking_number", label: "Tracking number" },
    { key: "tracking_round_id", label: "Tracking round" },
    { key: "reference", label: "Reference" },
    { key: "reason", label: "Reason" },
    { key: "branch_id", label: "Branch" },
    { key: "cash_desk_id", label: "Cash desk" },
  ];
  readonly display = displayValue;
  readonly money = formatMoney;

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set("");
    const id = this.route.snapshot.paramMap.get("id");
    if (!id) {
      this.error.set("Money-order identifier is missing.");
      this.loading.set(false);
      return;
    }
    try {
      const order = await firstValueFrom(
        this.api.get<ApiRecord>(`money-orders/${id}`),
      );
      this.order.set(order);
      await this.references.prepare(
        this.detailFields.map((field) => field.key),
        [order],
      );
      if (
        order["status"] === "funded" &&
        this.session.can("money_orders.payout")
      )
        await this.loadOptions();
    } catch (error) {
      this.error.set(ApiService.errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  reviewPayout(): void {
    const order = this.order();
    if (
      order?.["payout_type"] === "account" &&
      !this.form.controls.beneficiaryClientId.value &&
      !order["beneficiary_client_id"]
    ) {
      this.error.set("Select the beneficiary customer for account payout.");
      return;
    }
    this.error.set("");
    this.reviewing.set(true);
  }

  payoutEntries(): Array<[string, string]> {
    const value = this.form.getRawValue();
    return [
      ["Payout method", String(this.order()?.["payout_type"] ?? "")],
      [
        "Branch",
        value.branchId || String(this.order()?.["branch_id"] ?? "Original"),
      ],
      [
        "Cash desk",
        value.cashDeskId ||
          String(this.order()?.["cash_desk_id"] ?? "Original"),
      ],
      [
        "Beneficiary customer",
        value.beneficiaryClientId ||
          String(this.order()?.["beneficiary_client_id"] ?? "—"),
      ],
      ["Reason", value.reason || "—"],
    ];
  }

  async confirmPayout(): Promise<void> {
    const id = this.route.snapshot.paramMap.get("id");
    if (!id || this.busy()) return;
    this.busy.set(true);
    this.error.set("");
    try {
      const value = this.form.getRawValue();
      const optional = (item: string) => item || undefined;
      await firstValueFrom(
        this.api.post(
          `money-orders/${id}/payout`,
          {
            branch_id: optional(value.branchId),
            cash_desk_id: optional(value.cashDeskId),
            beneficiary_client_id: optional(value.beneficiaryClientId),
            reason: optional(value.reason),
          },
          crypto.randomUUID(),
        ),
      );
      this.success.set(
        "Payout posted successfully. The linked receipt is now available.",
      );
      this.reviewing.set(false);
      await this.load();
    } catch (error) {
      this.error.set(ApiService.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  currencyCode(): string {
    const currency = this.order()?.["currency"] as ApiRecord | undefined;
    return String(currency?.["code"] ?? this.order()?.["currency_id"] ?? "");
  }

  detailValue(record: ApiRecord, key: string): string {
    return this.references.display(key, record[key], record);
  }

  detailTitle(record: ApiRecord, key: string): string {
    return this.references.tooltip(key, record[key], record);
  }

  private async loadOptions(): Promise<void> {
    const [branches, desks, clients] = await Promise.all([
      firstValueFrom(this.api.get<ApiRecord[]>("branches")),
      firstValueFrom(this.api.get<ApiRecord[]>("cash-desks")),
      firstValueFrom(
        this.api.get<Paginated<ApiRecord>>("clients", { perPage: 100 }),
      ),
    ]);
    const options = (rows: ApiRecord[], label: (row: ApiRecord) => string) =>
      rows.map((row) => ({ id: String(row["id"]), label: label(row) }));
    this.branches.set(
      options(ApiService.rows(branches), (row) =>
        String(row["name"] ?? row["code"]),
      ),
    );
    this.cashDesks.set(
      options(ApiService.rows(desks), (row) =>
        String(row["name"] ?? row["code"]),
      ),
    );
    this.clients.set(
      options(ApiService.rows(clients), (row) =>
        `${row["first_name"] ?? ""} ${row["last_name"] ?? ""} · ${row["client_id"] ?? ""}`.trim(),
      ),
    );
  }
}
