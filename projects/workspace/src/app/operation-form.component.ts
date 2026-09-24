import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { ApiService } from "@shared/core/api.service";
import { ApiRecord, Paginated } from "@shared/core/models";
import { PageHeaderComponent } from "@shared/ui/page-header.component";
import { displayValue, humanize } from "@shared/core/format";
import { SessionState } from "@shared/core/session.state";

type OperationKind =
  "deposit" | "withdrawal" | "transfer" | "exchange" | "money_order";
@Component({
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "workspace-page workspace-form-page workspace-operation-page",
  },
  template: `
    <an-page-header
      eyebrow="Financial operation"
      [title]="title()"
      [description]="description()"
      ><a
        [routerLink]="
          kind === 'money_order' ? '/money-orders' : '/transactions'
        "
        class="btn btn-secondary"
        >Cancel</a
      ></an-page-header
    >
    <div class="mx-auto max-w-4xl">
      @if (error()) {
        <p
          class="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {{ error() }}
        </p>
      }
      @if (stage() === "edit") {
        <form
          class="card grid gap-5 p-6 sm:grid-cols-2 sm:p-8"
          [formGroup]="form"
          (ngSubmit)="review()"
        >
          @if (kind === "deposit" || kind === "withdrawal") {
            <div class="sm:col-span-2">
              <label class="label" for="client">Customer</label
              ><select class="input" id="client" formControlName="clientId">
                <option value="">Select customer</option>
                @for (option of clients(); track option.id) {
                  <option [value]="option.id">{{ option.label }}</option>
                }
              </select>
            </div>
          }
          @if (kind === "transfer") {
            <div>
              <label class="label" for="from-client">From customer</label
              ><select
                class="input"
                id="from-client"
                formControlName="fromClientId"
              >
                <option value="">Select sender</option>
                @for (option of clients(); track option.id) {
                  <option [value]="option.id">{{ option.label }}</option>
                }
              </select>
            </div>
            <div>
              <label class="label" for="to-client">To customer</label
              ><select
                class="input"
                id="to-client"
                formControlName="toClientId"
              >
                <option value="">Select recipient</option>
                @for (option of clients(); track option.id) {
                  <option [value]="option.id">{{ option.label }}</option>
                }
              </select>
            </div>
          }
          @if (kind === "exchange") {
            <div>
              <label class="label" for="from-currency">From currency</label
              ><select
                class="input"
                id="from-currency"
                formControlName="fromCurrencyId"
              >
                <option value="">Select currency</option>
                @for (option of currencies(); track option.id) {
                  <option [value]="option.id">{{ option.label }}</option>
                }
              </select>
            </div>
            <div>
              <label class="label" for="to-currency">To currency</label
              ><select
                class="input"
                id="to-currency"
                formControlName="toCurrencyId"
              >
                <option value="">Select currency</option>
                @for (option of currencies(); track option.id) {
                  <option [value]="option.id">{{ option.label }}</option>
                }
              </select>
            </div>
          }
          @if (kind !== "exchange") {
            <div>
              <label class="label" for="currency">Currency</label
              ><select class="input" id="currency" formControlName="currencyId">
                <option value="">Select currency</option>
                @for (option of currencies(); track option.id) {
                  <option [value]="option.id">{{ option.label }}</option>
                }
              </select>
            </div>
          }
          <div>
            <label class="label" for="amount">{{
              kind === "exchange" ? "From amount" : "Amount"
            }}</label
            ><input
              class="input"
              id="amount"
              formControlName="amount"
              inputmode="decimal"
              placeholder="0.00"
            />
          </div>
          @if (kind === "exchange") {
            <div>
              <label class="label" for="to-amount">To amount</label
              ><input
                class="input"
                id="to-amount"
                formControlName="toAmount"
                inputmode="decimal"
                placeholder="0.00"
              />
            </div>
            <div>
              <label class="label" for="rate"
                >Applied rate
                <span class="font-normal text-muted">(optional)</span></label
              ><input
                class="input"
                id="rate"
                formControlName="appliedRate"
                inputmode="decimal"
              />
            </div>
          }
          @if (
            kind === "transfer" || kind === "exchange" || kind === "money_order"
          ) {
            <div>
              <label class="label" for="fee"
                >Fee amount
                <span class="font-normal text-muted">(optional)</span></label
              ><input
                class="input"
                id="fee"
                formControlName="feeAmount"
                inputmode="decimal"
              />
            </div>
          }
          @if (kind === "money_order") {
            <div>
              <label class="label" for="direction">Direction</label
              ><select
                class="input"
                id="direction"
                formControlName="direction"
                (change)="directionChanged()"
              >
                <option value="outgoing">Outgoing</option>
                <option value="incoming">Incoming</option>
              </select>
            </div>
            <div>
              <label class="label" for="sender"
                >Sender customer
                <span class="font-normal text-muted">(optional)</span></label
              ><select class="input" id="sender" formControlName="clientId">
                <option value="">Walk-in sender</option>
                @for (option of clients(); track option.id) {
                  <option [value]="option.id">{{ option.label }}</option>
                }
              </select>
            </div>
            <div>
              <label class="label" for="beneficiary-client"
                >Beneficiary customer
                <span class="font-normal text-muted">(optional)</span></label
              ><select
                class="input"
                id="beneficiary-client"
                formControlName="beneficiaryClientId"
              >
                <option value="">External beneficiary</option>
                @for (option of clients(); track option.id) {
                  <option [value]="option.id">{{ option.label }}</option>
                }
              </select>
            </div>
            <div>
              <label class="label" for="beneficiary-name"
                >Beneficiary name</label
              ><input
                class="input"
                id="beneficiary-name"
                formControlName="beneficiaryName"
              />
            </div>
            <div>
              <label class="label" for="beneficiary-phone"
                >Beneficiary phone</label
              ><input
                class="input"
                id="beneficiary-phone"
                formControlName="beneficiaryPhone"
              />
            </div>
            <div>
              <label class="label" for="partner"
                >Partner
                <span class="font-normal text-muted">(optional)</span></label
              ><select class="input" id="partner" formControlName="partnerId">
                <option value="">No partner</option>
                @for (option of partners(); track option.id) {
                  <option [value]="option.id">{{ option.label }}</option>
                }
              </select>
            </div>
            <div>
              <label class="label" for="funding">Funding</label
              ><select class="input" id="funding" formControlName="fundingType">
                <option value="cash">Cash</option>
                <option value="account">Customer account</option>
                <option value="partner">Partner settlement</option>
              </select>
            </div>
            <div>
              <label class="label" for="payout">Payout</label
              ><select class="input" id="payout" formControlName="payoutType">
                <option value="cash">Cash</option>
                <option value="account">Customer account</option>
                <option value="partner">Partner settlement</option>
              </select>
            </div>
          }
          <div>
            <label class="label" for="branch">Branch</label
            ><select class="input" id="branch" formControlName="branchId">
              <option value="">Select branch</option>
              @for (option of branches(); track option.id) {
                <option [value]="option.id">{{ option.label }}</option>
              }
            </select>
          </div>
          <div>
            <label class="label" for="desk">Cash desk</label
            ><select class="input" id="desk" formControlName="cashDeskId">
              <option value="">Select cash desk</option>
              @for (option of cashDeskOptions(); track option.id) {
                <option [value]="option.id">{{ option.label }}</option>
              }
            </select>
          </div>
          <div>
            <label class="label" for="reference"
              >Reference
              <span class="font-normal text-muted">(optional)</span></label
            ><input class="input" id="reference" formControlName="reference" />
          </div>
          <div>
            <label class="label" for="reason"
              >Reason
              <span class="font-normal text-muted">(optional)</span></label
            ><input class="input" id="reason" formControlName="reason" />
          </div>
          <div class="sm:col-span-2">
            <label class="label" for="description"
              >Description
              <span class="font-normal text-muted">(optional)</span></label
            ><textarea
              class="input min-h-24"
              id="description"
              formControlName="description"
            ></textarea>
          </div>
          <div class="sm:col-span-2 flex justify-end">
            <button class="btn btn-primary min-w-40">Review operation</button>
          </div>
        </form>
      }
      @if (stage() === "review") {
        <section class="card overflow-hidden">
          <div class="border-b border-line bg-amber-50 px-6 py-4">
            <p class="mb-1 text-sm font-bold text-amber-900">
              Review before posting
            </p>
            <p class="mb-0 text-xs text-amber-800">
              Posted financial records are not editable. Confirm every value
              carefully.
            </p>
          </div>
          <dl class="grid gap-x-8 gap-y-0 p-6 sm:grid-cols-2">
            @for (entry of payloadEntries(); track entry[0]) {
              <div class="border-b border-line py-3">
                <dt
                  class="text-xs font-bold tracking-wide text-muted uppercase"
                >
                  {{ humanize(entry[0]) }}
                </dt>
                <dd class="mt-1 mb-0 break-all text-sm font-semibold text-ink">
                  {{ display(entry[1]) }}
                </dd>
              </div>
            }
          </dl>
          <div
            class="flex flex-col-reverse gap-3 border-t border-line bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end"
          >
            <button
              class="btn btn-secondary"
              (click)="stage.set('edit')"
              [disabled]="busy()"
            >
              Edit</button
            ><button
              class="btn btn-primary min-w-40"
              (click)="confirm()"
              [disabled]="busy()"
            >
              {{ busy() ? "Posting…" : "Confirm and post" }}
            </button>
          </div>
        </section>
      }
      @if (stage() === "success") {
        <section class="card p-8 text-center">
          <span
            class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-2xl text-brand"
            >✓</span
          >
          <h2 class="mt-5 text-2xl font-bold">Operation posted</h2>
          <p class="muted mx-auto mt-2 max-w-md">
            The API accepted this operation and returned a permanent record.
          </p>
          <p
            class="mx-auto mt-5 max-w-lg rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-600"
          >
            {{ display(result()) }}
          </p>
          <div class="mt-6 flex justify-center gap-3">
            <a [routerLink]="resultRoute()" class="btn btn-primary"
              >View receipt</a
            ><button class="btn btn-secondary" (click)="reset()">
              Post another
            </button>
          </div>
        </section>
      }
    </div>
  `,
})
export class OperationFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(SessionState);
  readonly kind = this.route.snapshot.data["kind"] as OperationKind;
  readonly stage = signal<"edit" | "review" | "success">("edit");
  readonly busy = signal(false);
  readonly error = signal("");
  readonly result = signal<unknown>(null);
  readonly payload = signal<Record<string, unknown>>({});
  readonly clients = signal<Array<{ id: string; label: string }>>([]);
  readonly currencies = signal<Array<{ id: string; label: string }>>([]);
  readonly branches = signal<Array<{ id: string; label: string }>>([]);
  readonly cashDesks = signal<
    Array<{ id: string; label: string; branchId?: string }>
  >([]);
  readonly partners = signal<Array<{ id: string; label: string }>>([]);
  readonly title = computed(
    () =>
      ({
        deposit: "Record a customer deposit",
        withdrawal: "Record a customer withdrawal",
        transfer: "Transfer between customers",
        exchange: "Post a currency exchange",
        money_order: "Create a money order",
      })[this.kind],
  );
  readonly description = computed(
    () =>
      ({
        deposit: "Receive funds at a branch cash desk and credit the customer.",
        withdrawal: "Pay funds from a customer account through a cash desk.",
        transfer: "Move value in one currency from one customer to another.",
        exchange: "Post both sides of an agreed currency conversion.",
        money_order:
          "Capture settlement, beneficiary, partner, and payout instructions.",
      })[this.kind],
  );
  readonly form = this.fb.nonNullable.group({
    clientId: [""],
    fromClientId: [""],
    toClientId: [""],
    beneficiaryClientId: [""],
    partnerId: [""],
    currencyId: [""],
    fromCurrencyId: [""],
    toCurrencyId: [""],
    amount: [
      "",
      [Validators.required, Validators.pattern(/^\d+(\.\d{1,12})?$/)],
    ],
    toAmount: [""],
    feeAmount: [""],
    appliedRate: [""],
    branchId: [""],
    cashDeskId: [""],
    reference: [""],
    reason: [""],
    description: [""],
    direction: ["outgoing"],
    beneficiaryName: [""],
    beneficiaryPhone: [""],
    fundingType: ["cash"],
    payoutType: ["cash"],
  });
  readonly payloadEntries = computed(() =>
    Object.entries(this.payload()).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  );
  readonly humanize = humanize;
  readonly display = displayValue;
  readonly resultRoute = computed(() => {
    const response = this.result() as Record<string, unknown> | null;
    const id = response?.["id"];
    if (!id)
      return this.kind === "money_order" ? "/money-orders" : "/transactions";
    return this.kind === "money_order"
      ? `/money-orders/${String(id)}`
      : `/transactions/${String(id)}`;
  });
  ngOnInit(): void {
    void this.loadOptions();
  }
  review(): void {
    const body = this.buildPayload();
    if (!body || this.form.controls.amount.invalid) {
      this.form.markAllAsTouched();
      this.error.set(
        "Complete the required operation details before reviewing.",
      );
      return;
    }
    this.error.set("");
    this.payload.set(body);
    this.stage.set("review");
  }
  async confirm(): Promise<void> {
    this.busy.set(true);
    this.error.set("");
    try {
      const endpoint =
        this.kind === "deposit" || this.kind === "withdrawal"
          ? "fund-flows"
          : this.kind === "transfer"
            ? "transfers"
            : this.kind === "exchange"
              ? "exchanges"
              : "money-orders";
      const response = await firstValueFrom(
        this.api.post<unknown>(endpoint, this.payload(), crypto.randomUUID()),
      );
      this.result.set(response);
      this.stage.set("success");
    } catch (error) {
      this.error.set(ApiService.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
  reset(): void {
    this.form.reset({
      direction: "outgoing",
      fundingType: "cash",
      payoutType: "cash",
    });
    this.result.set(null);
    this.payload.set({});
    this.stage.set("edit");
  }
  directionChanged(): void {
    if (this.form.controls.direction.value === "incoming") {
      this.form.patchValue({ fundingType: "partner", payoutType: "cash" });
    } else if (this.form.controls.fundingType.value === "partner") {
      this.form.patchValue({ fundingType: "cash" });
    }
  }
  cashDeskOptions(): Array<{ id: string; label: string; branchId?: string }> {
    const branchId = this.form.controls.branchId.value;
    return branchId
      ? this.cashDesks().filter(
          (desk) => !desk.branchId || desk.branchId === branchId,
        )
      : this.cashDesks();
  }
  private async loadOptions(): Promise<void> {
    const failures: string[] = [];
    const load = async (
      path: string,
      permission: string,
    ): Promise<ApiRecord[]> => {
      if (!this.session.can(permission)) return [];
      try {
        const response = await firstValueFrom(
          this.api.get<ApiRecord[] | Paginated<ApiRecord>>(path, {
            perPage: 100,
          }),
        );
        return ApiService.rows(response);
      } catch {
        failures.push(path);
        return [];
      }
    };
    const needsClients = this.kind !== "exchange";
    const needsPartners = this.kind === "money_order";
    const [clients, currencies, branches, desks, partners] = await Promise.all([
      needsClients ? load("clients", "clients.read") : Promise.resolve([]),
      load("currencies", "currencies.read"),
      load("branches", "branches.read"),
      load("cash-desks", "cash_desks.read"),
      needsPartners ? load("partners", "partners.read") : Promise.resolve([]),
    ]);
    this.clients.set(
      clients.map((row) => ({
        id: String(row["id"]),
        label:
          `${row["first_name"] ?? ""} ${row["last_name"] ?? ""} · ${row["client_id"] ?? ""}`.trim(),
      })),
    );
    this.currencies.set(
      currencies.map((row) => ({
        id: String(row["id"]),
        label: String(row["code"] ?? row["name"] ?? row["id"]),
      })),
    );
    this.branches.set(
      branches.map((row) => ({
        id: String(row["id"]),
        label: String(row["name"] ?? row["code"]),
      })),
    );
    this.cashDesks.set(
      desks.map((row) => ({
        id: String(row["id"]),
        label: String(row["name"] ?? row["code"]),
        branchId: row["branch_id"] ? String(row["branch_id"]) : undefined,
      })),
    );
    this.partners.set(
      partners.map((row) => ({
        id: String(row["id"]),
        label: String(row["name"] ?? row["code"]),
      })),
    );
    if (failures.length) {
      this.error.set(
        "Some form options could not be loaded. Check your connection and assigned read permissions.",
      );
    }
  }
  private buildPayload(): Record<string, unknown> | null {
    const v = this.form.getRawValue();
    const optional = (value: string) => value || undefined;
    if (this.kind === "deposit" || this.kind === "withdrawal") {
      if (!v.clientId || !v.currencyId || !v.branchId || !v.cashDeskId)
        return null;
      return {
        client_id: v.clientId,
        amount: v.amount,
        currency_id: v.currencyId,
        type: this.kind,
        branch_id: v.branchId,
        cash_desk_id: v.cashDeskId,
        description: optional(v.description),
        reference: optional(v.reference),
        reason: optional(v.reason),
      };
    }
    if (this.kind === "transfer") {
      if (!v.fromClientId || !v.toClientId || !v.currencyId) return null;
      return {
        from_client_id: v.fromClientId,
        to_client_id: v.toClientId,
        currency_id: v.currencyId,
        amount: v.amount,
        fee_amount: optional(v.feeAmount),
        branch_id: optional(v.branchId),
        cash_desk_id: optional(v.cashDeskId),
        description: optional(v.description),
        reference: optional(v.reference),
        reason: optional(v.reason),
      };
    }
    if (this.kind === "exchange") {
      if (!v.fromCurrencyId || !v.toCurrencyId || !v.toAmount) return null;
      return {
        from_currency_id: v.fromCurrencyId,
        to_currency_id: v.toCurrencyId,
        from_amount: v.amount,
        to_amount: v.toAmount,
        fee_amount: optional(v.feeAmount),
        applied_rate: optional(v.appliedRate),
        branch_id: optional(v.branchId),
        cash_desk_id: optional(v.cashDeskId),
        description: optional(v.description),
        reference: optional(v.reference),
        reason: optional(v.reason),
      };
    }
    if (!v.currencyId || !v.beneficiaryName) return null;
    if (
      (v.direction === "incoming" &&
        (!v.partnerId ||
          v.fundingType !== "partner" ||
          v.payoutType === "partner")) ||
      (v.direction === "outgoing" && v.fundingType === "partner") ||
      (v.fundingType === "account" && !v.clientId) ||
      (v.payoutType === "account" && !v.beneficiaryClientId) ||
      (v.payoutType === "partner" && !v.partnerId)
    )
      return null;
    return {
      direction: v.direction,
      sender_client_id: optional(v.clientId),
      beneficiary_client_id: optional(v.beneficiaryClientId),
      partner_id: optional(v.partnerId),
      beneficiary_name: optional(v.beneficiaryName),
      beneficiary_phone: optional(v.beneficiaryPhone),
      currency_id: v.currencyId,
      amount: v.amount,
      fee_amount: optional(v.feeAmount),
      funding_type: v.fundingType,
      payout_type: v.payoutType,
      branch_id: optional(v.branchId),
      cash_desk_id: optional(v.cashDeskId),
      reference: optional(v.reference),
      reason: optional(v.reason),
    };
  }
}
