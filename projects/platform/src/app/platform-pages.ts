import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { AuthService } from "@shared/core/auth.service";
import { ApiService } from "@shared/core/api.service";
import { ApiRecord, Paginated } from "@shared/core/models";
import { BrandComponent } from "@shared/ui/brand.component";
import { PageHeaderComponent } from "@shared/ui/page-header.component";
import { StateComponent } from "@shared/ui/state.component";
import { displayValue, humanize } from "@shared/core/format";

@Component({
  imports: [ReactiveFormsModule, BrandComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main
    class="app-grid-bg grid min-h-screen place-items-center bg-ink-deep px-4 py-12"
  >
    <section class="w-full max-w-md">
      <div class="mb-7 flex justify-center rounded-xl bg-white p-3">
        <an-brand />
      </div>
      <div class="card p-8">
        <p class="eyebrow">Private control plane</p>
        <h1 class="mt-2 text-3xl font-bold">Platform sign in</h1>
        <p class="muted mt-2">
          Email, password, and current authenticator code are required.
        </p>
        @if (error()) {
          <p class="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {{ error() }}
          </p>
        }
        <form [formGroup]="form" (ngSubmit)="submit()" class="mt-7 space-y-5">
          <div>
            <label class="label" for="email">Email</label
            ><input
              class="input"
              id="email"
              type="email"
              formControlName="email"
              autocomplete="username"
            />
          </div>
          <div>
            <label class="label" for="password">Password</label
            ><input
              class="input"
              id="password"
              type="password"
              formControlName="password"
              autocomplete="current-password"
            />
          </div>
          <div>
            <label class="label" for="totp">Authenticator code</label
            ><input
              class="input text-center text-lg tracking-[.3em]"
              id="totp"
              formControlName="totp"
              inputmode="numeric"
              maxlength="6"
              autocomplete="one-time-code"
            />
          </div>
          <button class="btn btn-primary w-full" [disabled]="busy()">
            {{ busy() ? "Verifying…" : "Enter platform" }}
          </button>
        </form>
      </div>
    </section>
  </main>`,
})
export class PlatformLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly busy = signal(false);
  readonly error = signal("");
  readonly form = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", Validators.required],
    totp: ["", [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });
  async submit(): Promise<void> {
    if (this.form.invalid || this.busy()) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set("");
    try {
      const value = this.form.getRawValue();
      await this.auth.loginPlatform(value.email, value.password, value.totp);
      await this.router.navigateByUrl("/");
    } catch (error) {
      this.error.set(ApiService.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}

@Component({
  imports: [PageHeaderComponent, RouterLink, StateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<an-page-header
      eyebrow="Control plane"
      title="Platform overview"
      description="A focused view of organizations, billing activity, and administrative changes."
    />
    @if (error()) {
      <an-state
        icon="!"
        title="Platform data unavailable"
        [message]="error()"
      />
    } @else {
      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        @for (metric of metrics(); track metric.label) {
          <article class="card p-5">
            <p class="text-xs font-bold tracking-wider text-muted uppercase">
              {{ metric.label }}
            </p>
            <p class="mt-3 mb-0 text-3xl font-bold">{{ metric.value }}</p>
            <p class="mt-1 mb-0 text-xs text-muted">{{ metric.hint }}</p>
          </article>
        }
      </section>
      <section class="mt-6 grid gap-6 xl:grid-cols-2">
        <article class="card overflow-hidden">
          <div
            class="flex items-center justify-between border-b border-line p-5"
          >
            <h2 class="mb-0 text-lg font-bold">Newest workspaces</h2>
            <a routerLink="/workspaces" class="btn btn-ghost">View all</a>
          </div>
          <div class="divide-y divide-line">
            @for (row of workspaces().slice(0, 6); track row["id"]) {
              <a
                [routerLink]="['/workspaces', row['id']]"
                class="flex items-center justify-between gap-4 px-5 py-4 no-underline hover:bg-slate-50"
                ><div>
                  <p class="mb-1 text-sm font-bold">{{ row["name"] }}</p>
                  <p class="mb-0 text-xs text-muted">{{ row["slug"] }}</p>
                </div>
                <span
                  class="pill border-slate-200 bg-slate-50 text-slate-700"
                  >{{ row["status"] }}</span
                ></a
              >
            }
          </div>
        </article>
        <article class="card overflow-hidden">
          <div
            class="flex items-center justify-between border-b border-line p-5"
          >
            <h2 class="mb-0 text-lg font-bold">Recent platform actions</h2>
            <a routerLink="/audit" class="btn btn-ghost">View audit</a>
          </div>
          <div class="divide-y divide-line">
            @for (row of audit().slice(0, 6); track row["id"]) {
              <div class="px-5 py-4">
                <p class="mb-1 text-sm font-bold">{{ row["action"] }}</p>
                <p class="mb-0 text-xs text-muted">
                  {{ row["resourceType"] }} · {{ display(row["createdAt"]) }}
                </p>
              </div>
            }
          </div>
        </article>
      </section>
    }`,
})
export class PlatformDashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly workspaces = signal<ApiRecord[]>([]);
  readonly payments = signal<ApiRecord[]>([]);
  readonly audit = signal<ApiRecord[]>([]);
  readonly plans = signal<ApiRecord[]>([]);
  readonly error = signal("");
  readonly display = displayValue;
  readonly metrics = computed(() => [
    {
      label: "Workspaces",
      value: this.workspaces().length,
      hint: `${this.workspaces().filter((item) => item["status"] === "active").length} active`,
    },
    {
      label: "Suspended",
      value: this.workspaces().filter((item) => item["status"] === "suspended")
        .length,
      hint: "Require operator review",
    },
    {
      label: "Recent payments",
      value: this.payments().length,
      hint: "Latest 500 records",
    },
    {
      label: "Published plans",
      value: this.plans().filter((item) => item["active"]).length,
      hint: "Active plan definitions",
    },
  ]);
  ngOnInit(): void {
    void this.load();
  }
  async load(): Promise<void> {
    try {
      const [workspaces, payments, audit, plans] = await Promise.all([
        firstValueFrom(this.api.get<ApiRecord[]>("platform/workspaces")),
        firstValueFrom(this.api.get<ApiRecord[]>("platform/payments")),
        firstValueFrom(this.api.get<ApiRecord[]>("platform/audit")),
        firstValueFrom(this.api.get<ApiRecord[]>("platform/plans")),
      ]);
      this.workspaces.set(workspaces);
      this.payments.set(payments);
      this.audit.set(audit);
      this.plans.set(plans);
    } catch (error) {
      this.error.set(ApiService.errorMessage(error));
    }
  }
}

interface PlatformResourceConfig {
  title: string;
  eyebrow: string;
  description: string;
  endpoint: string;
  linkBase?: string;
}
@Component({
  imports: [FormsModule, RouterLink, PageHeaderComponent, StateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<an-page-header
      [eyebrow]="config.eyebrow"
      [title]="config.title"
      [description]="config.description"
    />
    <div class="card mb-5 flex items-center justify-between gap-4 p-4">
      <input
        class="input max-w-md"
        [ngModel]="query()"
        (ngModelChange)="query.set($event)"
        placeholder="Search records"
      /><span class="text-sm text-muted">{{ filtered().length }} records</span>
    </div>
    @if (error()) {
      <an-state icon="!" title="Records unavailable" [message]="error()" />
    } @else if (!filtered().length) {
      <an-state title="No records" message="Nothing matches this view yet." />
    } @else {
      <div class="table-shell overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              @for (column of columns(); track column) {
                <th>{{ humanize(column) }}</th>
              }
              @if (config.linkBase) {
                <th></th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of filtered(); track row["id"] ?? $index) {
              <tr>
                @for (column of columns(); track column) {
                  <td [class.font-semibold]="$first">
                    {{ display(row[column]) }}
                  </td>
                }
                @if (config.linkBase) {
                  <td class="text-right">
                    <a
                      [routerLink]="[config.linkBase, row['id']]"
                      class="btn btn-ghost"
                      >Review</a
                    >
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    }`,
})
export class PlatformResourceComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly config = this.route.snapshot.data as PlatformResourceConfig;
  readonly rows = signal<ApiRecord[]>([]);
  readonly error = signal("");
  readonly query = signal("");
  readonly humanize = humanize;
  readonly display = displayValue;
  readonly filtered = computed(() => {
    const needle = this.query().toLowerCase().trim();
    return needle
      ? this.rows().filter((row) =>
          JSON.stringify(row).toLowerCase().includes(needle),
        )
      : this.rows();
  });
  readonly columns = computed(() => {
    const first = this.rows()[0];
    if (!first) return [];
    const keys = Object.keys(first).filter(
      (key) =>
        typeof first[key] !== "object" && !key.toLowerCase().includes("secret"),
    );
    const preferred = [
      "name",
      "slug",
      "email",
      "action",
      "resourceType",
      "status",
      "amount",
      "currency",
      "createdAt",
    ];
    return [
      ...new Set([...preferred.filter((key) => keys.includes(key)), ...keys]),
    ].slice(0, 7);
  });
  ngOnInit(): void {
    void this.load();
  }
  async load(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.api.get<ApiRecord[] | Paginated<ApiRecord>>(this.config.endpoint, {
          page: 1,
          per_page: 100,
        }),
      );
      this.rows.set(ApiService.rows(response));
    } catch (error) {
      this.error.set(ApiService.errorMessage(error));
    }
  }
}

@Component({
  imports: [ReactiveFormsModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<an-page-header
      eyebrow="Commercial model"
      title="Plans and published versions"
      description="Plan changes create immutable versions so existing subscriptions retain their commercial terms."
    />
    @if (message()) {
      <p
        class="mb-5 rounded-xl border p-4 text-sm"
        [class.border-red-200]="error()"
        [class.bg-red-50]="error()"
        [class.text-red-700]="error()"
        [class.border-emerald-200]="!error()"
        [class.bg-emerald-50]="!error()"
        [class.text-emerald-800]="!error()"
      >
        {{ message() }}
      </p>
    }
    <div class="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
      <section class="card p-6">
        <h2 class="text-lg font-bold">Create plan</h2>
        <form
          [formGroup]="planForm"
          (ngSubmit)="createPlan()"
          class="mt-5 space-y-4"
        >
          <div>
            <label class="label">Code</label
            ><input
              class="input"
              formControlName="code"
              placeholder="application"
            />
          </div>
          <div>
            <label class="label">Name</label
            ><input class="input" formControlName="name" />
          </div>
          <div>
            <label class="label">Description</label
            ><textarea
              class="input min-h-20"
              formControlName="description"
            ></textarea>
          </div>
          <button class="btn btn-primary" [disabled]="busy()">
            Create plan
          </button>
        </form>
      </section>
      <section class="card p-6">
        <h2 class="text-lg font-bold">Publish a version</h2>
        <form
          [formGroup]="versionForm"
          (ngSubmit)="publishVersion()"
          class="mt-5 grid gap-4 sm:grid-cols-2"
        >
          <div class="sm:col-span-2">
            <label class="label">Plan</label
            ><select class="input" formControlName="planId">
              <option value="">Select plan</option>
              @for (plan of plans(); track plan["id"]) {
                <option [value]="plan['id']">
                  {{ plan["name"] }} · {{ plan["code"] }}
                </option>
              }
            </select>
          </div>
          <div>
            <label class="label">Quarterly price</label
            ><input
              class="input"
              formControlName="quarterlyPrice"
              inputmode="decimal"
            />
          </div>
          <div>
            <label class="label">Annual price</label
            ><input
              class="input"
              formControlName="annualPrice"
              inputmode="decimal"
            />
          </div>
          <div>
            <label class="label">Currency</label
            ><input class="input" formControlName="currency" maxlength="3" />
          </div>
          <div>
            <label class="label">Features</label
            ><input
              class="input"
              formControlName="features"
              placeholder="reports,transfers"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="label">Limits JSON</label
            ><textarea
              class="input min-h-24 font-mono text-xs"
              formControlName="limits"
            ></textarea>
          </div>
          <button class="btn btn-primary sm:col-span-2" [disabled]="busy()">
            Publish immutable version
          </button>
        </form>
      </section>
    </div>
    <section class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      @for (plan of plans(); track plan["id"]) {
        <article class="card p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="eyebrow">{{ plan["code"] }}</p>
              <h2 class="mt-2 text-lg font-bold">{{ plan["name"] }}</h2>
            </div>
            <span class="pill border-slate-200 bg-slate-50">{{
              plan["active"] ? "Active" : "Inactive"
            }}</span>
          </div>
          <p class="muted mb-0 mt-3">
            {{ plan["description"] || "No description" }}
          </p>
        </article>
      }
    </section>`,
})
export class PlansComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly plans = signal<ApiRecord[]>([]);
  readonly busy = signal(false);
  readonly error = signal(false);
  readonly message = signal("");
  readonly planForm = this.fb.nonNullable.group({
    code: [
      "",
      [Validators.required, Validators.pattern(/^[a-z][a-z0-9_-]{1,49}$/)],
    ],
    name: ["", Validators.required],
    description: [""],
  });
  readonly versionForm = this.fb.nonNullable.group({
    planId: ["", Validators.required],
    quarterlyPrice: ["", Validators.required],
    annualPrice: ["", Validators.required],
    currency: ["AFN", Validators.required],
    features: ["reports,transfers,money_orders"],
    limits: ['{"admins": null, "branches": null}'],
  });
  ngOnInit(): void {
    void this.load();
  }
  async load(): Promise<void> {
    try {
      this.plans.set(
        await firstValueFrom(this.api.get<ApiRecord[]>("platform/plans")),
      );
    } catch (error) {
      this.notice(ApiService.errorMessage(error), true);
    }
  }
  async createPlan(): Promise<void> {
    if (this.planForm.invalid) return;
    await this.run(async () => {
      await firstValueFrom(
        this.api.post("platform/plans", {
          ...this.planForm.getRawValue(),
          active: true,
          sort_order: this.plans().length,
        }),
      );
      this.planForm.reset();
      await this.load();
    }, "Plan created.");
  }
  async publishVersion(): Promise<void> {
    if (this.versionForm.invalid) return;
    const value = this.versionForm.getRawValue();
    let limits: Record<string, number | null>;
    try {
      limits = JSON.parse(value.limits) as Record<string, number | null>;
    } catch {
      this.notice("Limits must be valid JSON.", true);
      return;
    }
    await this.run(async () => {
      await firstValueFrom(
        this.api.post(`platform/plans/${value.planId}/versions`, {
          quarterly_price: value.quarterlyPrice,
          annual_price: value.annualPrice,
          currency: value.currency,
          features: value.features
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          limits,
        }),
      );
    }, "Plan version published.");
  }
  private async run(task: () => Promise<void>, success: string): Promise<void> {
    this.busy.set(true);
    try {
      await task();
      this.notice(success, false);
    } catch (error) {
      this.notice(ApiService.errorMessage(error), true);
    } finally {
      this.busy.set(false);
    }
  }
  private notice(message: string, error: boolean): void {
    this.message.set(message);
    this.error.set(error);
  }
}

type HealthCheck = {
  status: "checking" | "operational" | "unavailable";
  message: string;
};

@Component({
  imports: [PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <an-page-header
      eyebrow="Operations"
      title="System health"
      description="Live process and dependency readiness reported by the API."
    >
      <button
        class="btn btn-secondary"
        (click)="load()"
        [disabled]="checking()"
      >
        {{ checking() ? "Checking…" : "Refresh checks" }}
      </button>
    </an-page-header>
    <section class="grid gap-5 md:grid-cols-2">
      @for (check of checks(); track check.label) {
        <article class="card p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="eyebrow mb-1">{{ check.eyebrow }}</p>
              <h2 class="mb-2 text-lg font-bold">{{ check.label }}</h2>
            </div>
            <span [class]="statusClass(check.value.status)">{{
              check.value.status
            }}</span>
          </div>
          <p class="muted mb-0">{{ check.value.message }}</p>
        </article>
      }
    </section>
    <p class="mt-4 text-xs text-muted">
      Last checked: {{ display(lastChecked()) }}
    </p>
    <section class="card mt-6 border-amber-200 bg-amber-50 p-5">
      <h2 class="mb-1 text-base font-bold text-amber-900">Operational scope</h2>
      <p class="mb-0 text-sm leading-6 text-amber-800">
        Readiness covers the control database, attachment
        storage/scanning/encryption, and the pooled financial schema when
        configured. It does not replace external uptime, queue-depth,
        certificate, backup, or Android relay monitoring.
      </p>
    </section>
  `,
})
export class SystemHealthComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly liveness = signal<HealthCheck>({
    status: "checking",
    message: "Checking whether the API process can respond.",
  });
  readonly readiness = signal<HealthCheck>({
    status: "checking",
    message: "Checking required databases and attachment dependencies.",
  });
  readonly checking = signal(false);
  readonly lastChecked = signal<string | null>(null);
  readonly checks = computed(() => [
    {
      label: "API liveness",
      eyebrow: "Process",
      value: this.liveness(),
    },
    {
      label: "API readiness",
      eyebrow: "Dependencies",
      value: this.readiness(),
    },
  ]);
  readonly display = displayValue;

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    if (this.checking()) return;
    this.checking.set(true);
    this.liveness.set({ status: "checking", message: "Checking API process." });
    this.readiness.set({
      status: "checking",
      message: "Checking databases and attachment dependencies.",
    });
    const [liveness, readiness] = await Promise.all([
      this.check(
        "health/live",
        "The API process is responding.",
        "The API process did not pass its liveness check.",
      ),
      this.check(
        "health/ready",
        "Required API dependencies are available.",
        "One or more required API dependencies are unavailable.",
      ),
    ]);
    this.liveness.set(liveness);
    this.readiness.set(readiness);
    this.lastChecked.set(new Date().toISOString());
    this.checking.set(false);
  }

  statusClass(status: HealthCheck["status"]): string {
    return status === "operational"
      ? "pill border-emerald-200 bg-emerald-50 text-brand"
      : status === "unavailable"
        ? "pill border-red-200 bg-red-50 text-red-700"
        : "pill border-amber-200 bg-amber-50 text-amber-800";
  }

  private async check(
    path: string,
    success: string,
    failure: string,
  ): Promise<HealthCheck> {
    try {
      await firstValueFrom(this.api.get<{ status: string }>(path));
      return { status: "operational", message: success };
    } catch (error) {
      return {
        status: "unavailable",
        message: `${failure} ${ApiService.errorMessage(error)}`,
      };
    }
  }
}

@Component({
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<an-page-header
      eyebrow="Workspace control"
      [title]="string(workspace()?.['name'] ?? 'Workspace')"
      [description]="string(workspace()?.['slug'] ?? '')"
      ><a routerLink="/workspaces" class="btn btn-secondary"
        >Back</a
      ></an-page-header
    >
    @if (message()) {
      <p
        class="mb-5 rounded-xl border p-4 text-sm"
        [class.border-red-200]="error()"
        [class.bg-red-50]="error()"
        [class.text-red-700]="error()"
        [class.border-emerald-200]="!error()"
        [class.bg-emerald-50]="!error()"
        [class.text-emerald-800]="!error()"
      >
        {{ message() }}
      </p>
    }
    <div class="grid gap-6 lg:grid-cols-2">
      <section class="card p-6">
        <h2 class="text-lg font-bold">Organization status</h2>
        <p class="muted mt-2">
          Suspension blocks tenant access. Always record a concise operational
          reason.
        </p>
        <form
          [formGroup]="statusForm"
          (ngSubmit)="saveStatus()"
          class="mt-5 space-y-4"
        >
          <select class="input" formControlName="status">
            <option value="active">Active</option>
            <option value="suspended">Suspended</option></select
          ><textarea
            class="input min-h-24"
            formControlName="reason"
            placeholder="Reason for suspension"
          ></textarea
          ><button class="btn btn-primary">Update status</button>
        </form>
      </section>
      <section class="card p-6">
        <h2 class="text-lg font-bold">Subscription override</h2>
        <p class="muted mt-2">
          Overrides are audited. Active and trial access require a future end
          date.
        </p>
        <form
          [formGroup]="subscriptionForm"
          (ngSubmit)="saveSubscription()"
          class="mt-5 space-y-4"
        >
          <select class="input" formControlName="planVersionId">
            <option value="">Select plan version</option>
            @for (version of versions(); track version["id"]) {
              <option [value]="version['id']">
                Version {{ version["version"] }} · {{ version["currency"] }}
              </option>
            }</select
          ><select class="input" formControlName="status">
            <option value="trialing">Trialing</option>
            <option value="active">Active</option>
            <option value="pending_payment">Pending payment</option>
            <option value="expired">Expired</option>
            <option value="canceled">Canceled</option></select
          ><select class="input" formControlName="billingInterval">
            <option value="">No interval</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option></select
          ><input
            class="input"
            type="datetime-local"
            formControlName="endsAt"
          /><button class="btn btn-primary">Apply audited override</button>
        </form>
      </section>
    </div>`,
})
export class WorkspaceDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  readonly workspace = signal<ApiRecord | null>(null);
  readonly versions = signal<ApiRecord[]>([]);
  readonly message = signal("");
  readonly error = signal(false);
  readonly string = (value: unknown) => String(value ?? "");
  private readonly id = this.route.snapshot.paramMap.get("id") ?? "";
  readonly statusForm = this.fb.nonNullable.group({
    status: ["active"],
    reason: [""],
  });
  readonly subscriptionForm = this.fb.nonNullable.group({
    planVersionId: ["", Validators.required],
    status: ["active"],
    billingInterval: ["annual"],
    endsAt: ["", Validators.required],
  });
  async ngOnInit(): Promise<void> {
    try {
      const detail = await firstValueFrom(
        this.api.get<{ workspace: ApiRecord; subscription?: ApiRecord }>(
          `platform/workspaces/${this.id}`,
        ),
      );
      const workspace = detail.workspace;
      this.workspace.set(workspace);
      this.statusForm.patchValue({
        status: this.string(workspace["status"] ?? "active"),
        reason: this.string(workspace["suspensionReason"]),
      });
      const plans = await firstValueFrom(
        this.api.get<ApiRecord[]>("platform/plans"),
      );
      const versions = (
        await Promise.all(
          plans.map((plan) =>
            firstValueFrom(
              this.api.get<ApiRecord[]>(
                `platform/plans/${plan["id"]}/versions`,
              ),
            ),
          ),
        )
      ).flat();
      this.versions.set(versions);
      if (detail.subscription) {
        this.subscriptionForm.patchValue({
          planVersionId: this.string(detail.subscription["planVersionId"]),
          status: this.string(detail.subscription["status"]),
          billingInterval: this.string(detail.subscription["billingInterval"]),
        });
      }
    } catch (error) {
      this.notice(ApiService.errorMessage(error), true);
    }
  }
  async saveStatus(): Promise<void> {
    try {
      await firstValueFrom(
        this.api.patch(
          `platform/workspaces/${this.id}/status`,
          this.statusForm.getRawValue(),
        ),
      );
      this.notice("Workspace status updated.", false);
    } catch (error) {
      this.notice(ApiService.errorMessage(error), true);
    }
  }
  async saveSubscription(): Promise<void> {
    if (this.subscriptionForm.invalid) return;
    const value = this.subscriptionForm.getRawValue();
    try {
      await firstValueFrom(
        this.api.patch(`platform/workspaces/${this.id}/subscription`, {
          plan_version_id: value.planVersionId,
          status: value.status,
          billing_interval: value.billingInterval || undefined,
          ends_at: value.endsAt
            ? new Date(value.endsAt).toISOString()
            : undefined,
        }),
      );
      this.notice("Subscription override applied.", false);
    } catch (error) {
      this.notice(ApiService.errorMessage(error), true);
    }
  }
  private notice(message: string, error: boolean): void {
    this.message.set(message);
    this.error.set(error);
  }
}
