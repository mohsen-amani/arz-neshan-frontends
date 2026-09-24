import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { ApiService } from "@shared/core/api.service";
import { ApiRecord, Paginated } from "@shared/core/models";
import { PageHeaderComponent } from "@shared/ui/page-header.component";
import { SessionState } from "@shared/core/session.state";
import { BranchContextService } from "@shared/core/branch-context.service";

type EntityKind =
  | "client"
  | "account"
  | "branch"
  | "cash_desk"
  | "partner"
  | "currency"
  | "admin"
  | "tracking_round";

@Component({
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "workspace-page workspace-form-page" },
  template: `
    <an-page-header
      eyebrow="Workspace setup"
      [title]="title()"
      [description]="description()"
    >
      <a [routerLink]="returnRoute()" class="btn btn-secondary">Cancel</a>
    </an-page-header>
    <form
      class="card mx-auto grid max-w-4xl gap-5 p-6 sm:grid-cols-2 sm:p-8"
      [formGroup]="form"
      (ngSubmit)="submit()"
    >
      @if (error()) {
        <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
          {{ error() }}
        </p>
      }
      @if (kind === "client" || kind === "admin") {
        <div>
          <label class="label" for="first-name">First name</label
          ><input class="input" id="first-name" formControlName="firstName" />
        </div>
        <div>
          <label class="label" for="last-name">Last name</label
          ><input class="input" id="last-name" formControlName="lastName" />
        </div>
        <div>
          <label class="label" for="email"
            >Email <span class="font-normal text-muted">(optional)</span></label
          ><input
            class="input"
            id="email"
            formControlName="email"
            type="email"
          />
        </div>
      }
      @if (kind === "admin") {
        <div>
          <label class="label" for="username">Username</label
          ><input class="input" id="username" formControlName="username" />
        </div>
        <div class="sm:col-span-2">
          <label class="label" for="password">Temporary password</label
          ><input
            class="input"
            id="password"
            type="password"
            formControlName="password"
          />
          <p class="mt-1 text-xs text-muted">
            Use at least 10 characters with upper/lowercase letters, a number,
            and a symbol.
          </p>
        </div>
      }
      @if (kind === "client") {
        @if (branches().length) {
          <div class="sm:col-span-2">
            <label class="label" for="customer-branch">Owning branch</label>
            <select
              class="input"
              id="customer-branch"
              formControlName="branchId"
            >
              <option value="">Organization-wide / unassigned</option>
              @for (option of branches(); track option.id) {
                <option [value]="option.id">{{ option.label }}</option>
              }
            </select>
          </div>
        }
        <div>
          <label class="label" for="phone">Phone</label
          ><input class="input" id="phone" formControlName="phone" />
        </div>
        <div>
          <label class="label" for="identity">Identity number</label
          ><input
            class="input"
            id="identity"
            formControlName="identityNumber"
          />
        </div>
        <div>
          <label class="label" for="passport">Passport number</label
          ><input
            class="input"
            id="passport"
            formControlName="passportNumber"
          />
        </div>
        <div>
          <label class="label" for="province">Province</label
          ><input class="input" id="province" formControlName="province" />
        </div>
        <div class="sm:col-span-2">
          <label class="label" for="address">Address</label
          ><textarea
            class="input min-h-20"
            id="address"
            formControlName="address"
          ></textarea>
        </div>
      }
      @if (
        [
          "account",
          "branch",
          "cash_desk",
          "partner",
          "currency",
          "tracking_round",
        ].includes(kind)
      ) {
        <div [class.sm:col-span-2]="kind === 'account'">
          <label class="label" for="name">Name</label
          ><input class="input" id="name" formControlName="name" />
        </div>
      }
      @if (["branch", "cash_desk", "partner", "currency"].includes(kind)) {
        <div>
          <label class="label" for="code">Code</label
          ><input class="input uppercase" id="code" formControlName="code" />
        </div>
      }
      @if (kind === "branch" || kind === "partner") {
        <div class="sm:col-span-2">
          <label class="label" for="entity-address">Address</label
          ><textarea
            class="input min-h-20"
            id="entity-address"
            formControlName="address"
          ></textarea>
        </div>
      }
      @if (kind === "partner") {
        <div>
          <label class="label" for="partner-phone">Phone</label
          ><input class="input" id="partner-phone" formControlName="phone" />
        </div>
        <div>
          <label class="label" for="partner-province">Province</label
          ><input
            class="input"
            id="partner-province"
            formControlName="province"
          />
        </div>
      }
      @if (kind === "cash_desk") {
        <div class="sm:col-span-2">
          <label class="label" for="branch">Branch</label
          ><select class="input" id="branch" formControlName="branchId">
            <option value="">Select branch</option>
            @for (option of branches(); track option.id) {
              <option [value]="option.id">{{ option.label }}</option>
            }
          </select>
        </div>
      }
      @if (kind === "currency") {
        <div>
          <label class="label" for="symbol">Symbol</label
          ><input class="input" id="symbol" formControlName="symbol" />
        </div>
        <label class="flex items-center gap-3 rounded-lg border border-line p-3"
          ><input
            type="checkbox"
            formControlName="symbolBefore"
            class="accent-emerald-700"
          />
          Show symbol before amount</label
        >
      }
      @if (kind === "account") {
        <div>
          <label class="label" for="currency">Currency</label
          ><select class="input" id="currency" formControlName="currencyId">
            <option value="">Select currency</option>
            @for (option of currencies(); track option.id) {
              <option [value]="option.id">{{ option.label }}</option>
            }
          </select>
        </div>
        <div>
          <label class="label" for="owner-type">Owner type</label
          ><select class="input" id="owner-type" formControlName="ownerType">
            @for (option of ownerTypes(); track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>
        </div>
        @if (form.controls.ownerType.value !== "system") {
          <div class="sm:col-span-2">
            <label class="label" for="owner">Owner</label
            ><select class="input" id="owner" formControlName="ownerId">
              <option value="">Select owner</option>
              @for (option of ownerOptions(); track option.id) {
                <option [value]="option.id">{{ option.label }}</option>
              }
            </select>
          </div>
        }
      }
      @if (kind === "tracking_round") {
        <div>
          <label class="label" for="start-number">Starting number</label
          ><input
            class="input"
            id="start-number"
            type="number"
            min="1"
            formControlName="startNumber"
          />
        </div>
      }
      <div class="flex justify-end sm:col-span-2">
        <button class="btn btn-primary min-w-40" [disabled]="busy()">
          {{ busy() ? "Saving…" : "Create record" }}
        </button>
      </div>
    </form>
  `,
})
export class EntityCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(SessionState);
  private readonly branchContext = inject(BranchContextService);
  readonly kind = this.route.snapshot.data["kind"] as EntityKind;
  readonly busy = signal(false);
  readonly error = signal("");
  readonly branches = signal<Array<{ id: string; label: string }>>([]);
  readonly currencies = signal<Array<{ id: string; label: string }>>([]);
  readonly clients = signal<Array<{ id: string; label: string }>>([]);
  readonly cashDesks = signal<Array<{ id: string; label: string }>>([]);
  readonly partners = signal<Array<{ id: string; label: string }>>([]);
  readonly form = this.fb.nonNullable.group({
    firstName: [""],
    lastName: [""],
    email: ["", Validators.email],
    username: [""],
    password: [""],
    phone: [""],
    identityNumber: [""],
    passportNumber: [""],
    province: [""],
    address: [""],
    name: [""],
    code: [""],
    symbol: [""],
    symbolBefore: [true],
    branchId: [""],
    currencyId: [""],
    ownerType: ["system"],
    ownerId: [""],
    startNumber: [1],
  });
  readonly title = computed(
    () =>
      ({
        client: "Add a customer",
        account: "Create an account",
        branch: "Add a branch",
        cash_desk: "Add a cash desk",
        partner: "Add a partner",
        currency: "Enable a currency",
        admin: "Add an administrator",
        tracking_round: "Start a tracking round",
      })[this.kind],
  );
  readonly description = computed(
    () =>
      ({
        client: "Create the customer profile used by accounts and operations.",
        account: "Create a customer or operational ledger account.",
        branch: "Register an operational location.",
        cash_desk: "Create a cash handling point inside a branch.",
        partner: "Register a money-order or settlement partner.",
        currency: "Add an ISO currency for accounts and transactions.",
        admin:
          "Create a named administrator account; assign roles and scopes afterward.",
        tracking_round:
          "Activate a new sequential number range for money orders.",
      })[this.kind],
  );
  readonly returnRoute = computed(
    () =>
      ({
        client: "/clients",
        account: "/accounts",
        branch: "/branches",
        cash_desk: "/cash-desks",
        partner: "/partners",
        currency: "/currencies",
        admin: "/team",
        tracking_round: "/tracking-rounds",
      })[this.kind],
  );
  ownerOptions(): Array<{ id: string; label: string }> {
    return (
      {
        client: this.clients(),
        branch: this.branches(),
        cash_desk: this.cashDesks(),
        partner: this.partners(),
        system: [],
      }[this.form.controls.ownerType.value] ?? []
    );
  }
  ownerTypes(): Array<{ value: string; label: string }> {
    return [
      { value: "system", label: "System", allowed: true },
      {
        value: "client",
        label: "Customer",
        allowed: this.session.can("clients.read"),
      },
      {
        value: "branch",
        label: "Branch",
        allowed: this.session.can("branches.read"),
      },
      {
        value: "cash_desk",
        label: "Cash desk",
        allowed: this.session.can("cash_desks.read"),
      },
      {
        value: "partner",
        label: "Partner",
        allowed: this.session.can("partners.read"),
      },
    ]
      .filter((option) => option.allowed)
      .map(({ value, label }) => ({ value, label }));
  }

  ngOnInit(): void {
    this.form.controls.branchId.setValue(this.branchContext.selected());
    void this.loadOptions();
  }
  async submit(): Promise<void> {
    const payload = this.payload();
    if (!payload) {
      this.error.set("Complete all required fields.");
      return;
    }
    this.busy.set(true);
    this.error.set("");
    try {
      await firstValueFrom(this.api.post(this.endpoint(), payload));
      await this.router.navigateByUrl(this.returnRoute());
    } catch (error) {
      this.error.set(ApiService.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
  private endpoint(): string {
    return {
      client: "clients",
      account: "accounts",
      branch: "branches",
      cash_desk: "cash-desks",
      partner: "partners",
      currency: "currencies",
      admin: "admins",
      tracking_round: "money-order-tracking-rounds",
    }[this.kind];
  }
  private payload(): Record<string, unknown> | null {
    const v = this.form.getRawValue();
    const optional = (value: string) => value || undefined;
    if (this.kind === "client") {
      if (!v.firstName) return null;
      return {
        first_name: v.firstName,
        last_name: optional(v.lastName),
        email: optional(v.email),
        phone: optional(v.phone),
        can_login: false,
        identity_number: optional(v.identityNumber),
        passport_number: optional(v.passportNumber),
        province: optional(v.province),
        address: optional(v.address),
        branch_id: optional(v.branchId),
      };
    }
    if (this.kind === "admin") {
      if (!v.firstName || !v.lastName || !v.username || !v.password)
        return null;
      return {
        first_name: v.firstName,
        last_name: v.lastName,
        email: optional(v.email),
        username: v.username,
        password: v.password,
        status: "active",
      };
    }
    if (this.kind === "branch") {
      if (!v.name || !v.code) return null;
      return {
        name: v.name,
        code: v.code.toUpperCase(),
        address: optional(v.address),
        status: "active",
      };
    }
    if (this.kind === "cash_desk") {
      if (!v.name || !v.code || !v.branchId) return null;
      return {
        name: v.name,
        code: v.code.toUpperCase(),
        branch_id: v.branchId,
        status: "active",
      };
    }
    if (this.kind === "partner") {
      if (!v.name || !v.code) return null;
      return {
        name: v.name,
        code: v.code.toUpperCase(),
        phone: optional(v.phone),
        province: optional(v.province),
        address: optional(v.address),
        status: "active",
      };
    }
    if (this.kind === "currency") {
      if (!v.name || !v.code || !v.symbol) return null;
      return {
        name: v.name,
        code: v.code.toUpperCase(),
        symbol: v.symbol,
        symbol_before: v.symbolBefore,
      };
    }
    if (this.kind === "tracking_round") {
      if (!v.name || v.startNumber < 1) return null;
      return { name: v.name, start_number: v.startNumber };
    }
    if (!v.name || !v.currencyId || (v.ownerType !== "system" && !v.ownerId))
      return null;
    return {
      name: v.name,
      currency_id: v.currencyId,
      ...(v.ownerType === "client" ? { client_id: v.ownerId } : {}),
      ...(v.ownerType === "branch" ? { branch_id: v.ownerId } : {}),
      ...(v.ownerType === "cash_desk" ? { cash_desk_id: v.ownerId } : {}),
      ...(v.ownerType === "partner" ? { partner_id: v.ownerId } : {}),
    };
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
    const needsAccountOptions = this.kind === "account";
    const [branches, currencies, clients, desks, partners] = await Promise.all([
      this.kind === "cash_desk" || this.kind === "client" || needsAccountOptions
        ? load("branches", "branches.read")
        : Promise.resolve([]),
      needsAccountOptions
        ? load("currencies", "currencies.read")
        : Promise.resolve([]),
      needsAccountOptions
        ? load("clients", "clients.read")
        : Promise.resolve([]),
      needsAccountOptions
        ? load("cash-desks", "cash_desks.read")
        : Promise.resolve([]),
      needsAccountOptions
        ? load("partners", "partners.read")
        : Promise.resolve([]),
    ]);
    const options = (rows: ApiRecord[], label: (row: ApiRecord) => string) =>
      rows.map((row) => ({ id: String(row["id"]), label: label(row) }));
    this.branches.set(
      options(branches, (row) => String(row["name"] ?? row["code"])),
    );
    this.currencies.set(
      options(currencies, (row) => String(row["code"] ?? row["name"])),
    );
    this.clients.set(
      options(
        clients,
        (row) =>
          `${row["first_name"] ?? ""} ${row["last_name"] ?? ""} · ${row["client_id"] ?? ""}`,
      ),
    );
    this.cashDesks.set(
      options(desks, (row) => String(row["name"] ?? row["code"])),
    );
    this.partners.set(
      options(partners, (row) => String(row["name"] ?? row["code"])),
    );
    if (failures.length) {
      this.error.set(
        "Some reference options could not be loaded. Check your connection and assigned read permissions.",
      );
    }
  }
}
