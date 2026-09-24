import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { ApiService } from "@shared/core/api.service";
import { ApiRecord } from "@shared/core/models";
import { TurnstileComponent } from "@shared/ui/turnstile.component";

@Component({
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="app-grid-bg overflow-hidden bg-white">
      <div
        class="mx-auto grid max-w-7xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1.06fr_.94fr] lg:px-8 lg:py-28"
      >
        <div>
          <p class="eyebrow mb-5">
            One operating system for your exchange business
          </p>
          <h1
            class="max-w-4xl text-5xl font-bold tracking-[-.04em] text-ink sm:text-6xl lg:text-7xl"
          >
            Run every transaction with confidence.
          </h1>
          <p class="mt-6 max-w-2xl text-lg leading-8 text-muted">
            Bring customers, cash desks, transfers, currency exchange, money
            orders, and reporting into one secure workspace built for the way
            your team operates.
          </p>
          <div class="mt-8 flex flex-col gap-3 sm:flex-row">
            <a routerLink="/signup" class="btn btn-primary min-h-12 px-6"
              >Start one month free <span aria-hidden="true">→</span></a
            ><a
              routerLink="/find-workspace"
              class="btn btn-secondary min-h-12 px-6"
              >Find my workspace</a
            >
          </div>
          <div
            class="mt-8 flex flex-wrap gap-x-7 gap-y-2 text-sm font-medium text-muted"
          >
            <span>✓ No card for trial</span><span>✓ English workspace</span
            ><span>✓ Customer portal included</span>
          </div>
        </div>
        <div class="relative">
          <div
            class="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-emerald-100 via-transparent to-amber-100 blur-2xl"
          ></div>
          <div class="card relative overflow-hidden p-3 shadow-2xl">
            <div class="rounded-xl bg-ink-deep p-5 text-white">
              <div class="mb-8 flex items-center justify-between">
                <div>
                  <p
                    class="mb-1 text-xs font-bold tracking-wider text-emerald-300 uppercase"
                  >
                    Today
                  </p>
                  <p class="text-lg font-semibold">Operations overview</p>
                </div>
                <span class="rounded-full bg-white/10 px-3 py-1 text-xs"
                  >Live</span
                >
              </div>
              <div class="grid gap-3 sm:grid-cols-3">
                <div class="rounded-xl bg-white/8 p-4">
                  <p class="text-xs text-slate-400">Transactions</p>
                  <p class="mt-2 text-2xl font-bold">184</p>
                  <p class="mt-1 text-xs text-emerald-300">All posted</p>
                </div>
                <div class="rounded-xl bg-white/8 p-4">
                  <p class="text-xs text-slate-400">Money orders</p>
                  <p class="mt-2 text-2xl font-bold">37</p>
                  <p class="mt-1 text-xs text-amber-300">5 in transit</p>
                </div>
                <div class="rounded-xl bg-white/8 p-4">
                  <p class="text-xs text-slate-400">Cash desks</p>
                  <p class="mt-2 text-2xl font-bold">6</p>
                  <p class="mt-1 text-xs text-emerald-300">Open</p>
                </div>
              </div>
            </div>
            <div class="grid gap-3 p-4 sm:grid-cols-[1.25fr_.75fr]">
              <div>
                <p
                  class="text-xs font-bold tracking-wider text-muted uppercase"
                >
                  Recent activity
                </p>
                @for (
                  row of [
                    "Customer deposit · AFN 125,000",
                    "Currency exchange · USD → AFN",
                    "Money order paid · MO-10427",
                  ];
                  track row
                ) {
                  <div
                    class="mt-3 flex items-center gap-3 border-b border-line pb-3 last:border-0"
                  >
                    <span class="h-2 w-2 rounded-full bg-brand-bright"></span
                    ><span class="text-sm font-medium text-slate-700">{{
                      row
                    }}</span>
                  </div>
                }
              </div>
              <div class="rounded-xl bg-emerald-50 p-4">
                <p class="text-xs font-bold text-brand uppercase">
                  Balance health
                </p>
                <p class="mt-8 text-3xl font-bold text-ink">Balanced</p>
                <p class="mt-2 text-xs leading-5 text-muted">
                  Every posted entry is reflected across your accounts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="bg-canvas py-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="max-w-2xl">
          <p class="eyebrow">Built for control</p>
          <h2 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Your operation, clear from counter to ledger.
          </h2>
        </div>
        <div class="mt-10 grid gap-5 md:grid-cols-3">
          @for (feature of features; track feature.title) {
            <article class="card p-6">
              <span
                class="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-xl text-brand"
                >{{ feature.icon }}</span
              >
              <h3 class="mt-5 text-lg font-bold">{{ feature.title }}</h3>
              <p class="muted mb-0">{{ feature.copy }}</p>
            </article>
          }
        </div>
      </div>
    </section>
    <section class="bg-white py-20">
      <div
        class="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8"
      >
        <div>
          <p class="eyebrow">Designed around accountability</p>
          <h2 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            The right access for every person and place.
          </h2>
          <p class="mt-5 text-base leading-7 text-muted">
            Define roles once, then combine branch, cash-desk, partner, and
            own-record scopes. Owners retain complete oversight while operators
            see exactly what they need.
          </p>
          <a routerLink="/security" class="btn btn-secondary mt-6"
            >Explore security</a
          >
        </div>
        <div class="grid gap-3">
          @for (
            scope of [
              "Global oversight for owners",
              "Branch and cash-desk boundaries",
              "Partner-specific operations",
              "Own-record access for operators",
            ];
            track scope;
            let index = $index
          ) {
            <div
              class="flex items-center gap-4 rounded-xl border border-line p-4"
            >
              <span
                class="grid h-9 w-9 place-items-center rounded-lg bg-ink text-sm font-bold text-white"
                >0{{ index + 1 }}</span
              ><span class="font-semibold">{{ scope }}</span>
            </div>
          }
        </div>
      </div>
    </section>
    <section class="bg-ink-deep py-16 text-white">
      <div
        class="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 sm:px-6 md:flex-row md:items-center lg:px-8"
      >
        <div>
          <p
            class="text-sm font-bold tracking-wider text-emerald-300 uppercase"
          >
            Ready to begin?
          </p>
          <h2 class="mt-2 text-3xl font-bold">
            Set up your workspace in minutes.
          </h2>
        </div>
        <a
          routerLink="/signup"
          class="btn border-white bg-white px-6 text-ink hover:bg-slate-100"
          >Start your free month</a
        >
      </div>
    </section>
  `,
})
export class HomePageComponent {
  readonly features = [
    {
      icon: "↔",
      title: "Complete operations",
      copy: "Deposits, withdrawals, transfers, exchanges, and money orders flow through one consistent system.",
    },
    {
      icon: "◎",
      title: "Real-time visibility",
      copy: "See balances, posted transactions, customer accounts, and branch performance without spreadsheet drift.",
    },
    {
      icon: "◇",
      title: "Controlled access",
      copy: "Permission-based roles and operational scopes keep sensitive financial data in the right hands.",
    },
  ];
}

@Component({
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bg-canvas py-20">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <p class="eyebrow">Straightforward pricing</p>
          <h1 class="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Choose the pace that fits your business.
          </h1>
          <p class="mt-5 text-lg text-muted">
            Start with a full month. Continue quarterly or annually when your
            team is ready.
          </p>
        </div>
        @if (error()) {
          <p
            class="mx-auto mt-8 max-w-xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {{ error() }}
          </p>
        }
        <div class="mt-12 grid gap-5 lg:grid-cols-3">
          <article class="card flex flex-col p-7">
            <p class="eyebrow">Trial</p>
            <h2 class="mt-3 text-2xl font-bold">One month free</h2>
            <p class="mt-3 text-sm text-muted">
              Explore the complete workspace with your team before subscribing.
            </p>
            <ul class="my-7 space-y-3 text-sm text-slate-700">
              <li>✓ Core financial operations</li>
              <li>✓ Customer portal</li>
              <li>✓ Roles and operational scopes</li>
            </ul>
            <a
              routerLink="/signup"
              [queryParams]="{ billing: 'trial' }"
              class="btn btn-secondary mt-auto"
              >Start free</a
            >
          </article>
          @for (plan of plans(); track plan["id"] ?? plan["code"]) {
            <article
              class="card relative flex flex-col p-7"
              [class.border-brand]="$index === 0"
            >
              <p class="eyebrow">{{ plan["code"] }}</p>
              <h2 class="mt-3 text-2xl font-bold">{{ plan["name"] }}</h2>
              <p class="mt-3 text-sm text-muted">
                {{
                  plan["description"] ||
                    "Published workspace plan with clear limits and feature access."
                }}
              </p>
              <div class="my-7 rounded-xl bg-slate-50 p-4 text-sm">
                <p class="mb-1 font-bold">Available billing</p>
                <p class="mb-0 text-muted">Quarterly and annual options</p>
              </div>
              <a
                routerLink="/signup"
                [queryParams]="{ billing: 'annual' }"
                class="btn btn-primary mt-auto"
                >Choose plan</a
              >
            </article>
          }
          @if (!loading() && plans().length === 0) {
            <article class="card flex flex-col p-7">
              <p class="eyebrow">Paid plan</p>
              <h2 class="mt-3 text-2xl font-bold">Continue after trial</h2>
              <p class="mt-3 text-sm text-muted">
                Current prices are available when you subscribe from your
                workspace.
              </p>
              <a routerLink="/signup" class="btn btn-primary mt-auto"
                >Create workspace</a
              >
            </article>
          }
        </div>
      </div>
    </section>
  `,
})
export class PricingPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly plans = signal<ApiRecord[]>([]);
  readonly loading = signal(true);
  readonly error = signal("");
  async ngOnInit(): Promise<void> {
    try {
      this.plans.set(
        await firstValueFrom(this.api.get<ApiRecord[]>("billing/plans")),
      );
    } catch (error) {
      this.error.set(ApiService.errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="bg-white py-20">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl">
        <p class="eyebrow">Security by design</p>
        <h1 class="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Controls that follow the work.
        </h1>
        <p class="mt-5 text-lg leading-8 text-muted">
          Arz Neshan combines tenant isolation, permission checks, operational
          scopes, and immutable posted records to protect day-to-day financial
          activity.
        </p>
      </div>
      <div class="mt-12 grid gap-5 md:grid-cols-2">
        @for (item of items; track item.title) {
          <article class="card p-7">
            <h2 class="text-xl font-bold">{{ item.title }}</h2>
            <p class="muted mb-0 mt-3">{{ item.copy }}</p>
          </article>
        }
      </div>
      <div class="mt-12 rounded-2xl bg-ink-deep p-8 text-white sm:p-10">
        <p class="text-sm font-bold tracking-wider text-emerald-300 uppercase">
          Responsible operations
        </p>
        <h2 class="mt-3 text-2xl font-bold">Security is shared.</h2>
        <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Use unique administrator accounts, assign the narrowest suitable
          scope, review access regularly, and protect the devices used to
          operate your workspace.
        </p>
      </div>
    </div>
  </section>`,
})
export class SecurityPageComponent {
  readonly items = [
    {
      title: "Workspace isolation",
      copy: "Every business operates within a distinct workspace boundary, including sessions, records, and assignments.",
    },
    {
      title: "Role-based permissions",
      copy: "Backend-owned permissions determine which capabilities a team member may use.",
    },
    {
      title: "Operational scopes",
      copy: "Global, branch, cash-desk, partner, and own-record scopes can be combined without widening access unexpectedly.",
    },
    {
      title: "Secure sessions",
      copy: "Short-lived access tokens pair with protected, host-bound refresh cookies and explicit session revocation.",
    },
  ];
}

@Component({
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="app-grid-bg min-h-[68vh] bg-canvas py-20">
    <div class="mx-auto max-w-xl px-4 sm:px-6">
      <div class="card p-7 sm:p-9">
        <p class="eyebrow">Welcome back</p>
        <h1 class="mt-2 text-3xl font-bold">Sign in to your workspace</h1>
        <p class="muted mt-3">
          Your secure sign-in page lives at your organization’s workspace
          address.
        </p>
        <a routerLink="/find-workspace" class="btn btn-primary mt-6 w-full"
          >Find my workspace</a
        >
        <div class="my-6 flex items-center gap-3 text-xs text-muted">
          <span class="h-px flex-1 bg-line"></span>or<span
            class="h-px flex-1 bg-line"
          ></span>
        </div>
        <p class="mb-0 text-center text-sm text-muted">
          New to Arz Neshan?
          <a routerLink="/signup" class="font-bold text-brand"
            >Create a workspace</a
          >
        </p>
      </div>
    </div>
  </section>`,
})
export class SignInPageComponent {}

@Component({
  imports: [ReactiveFormsModule, RouterLink, TurnstileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="app-grid-bg min-h-[70vh] bg-canvas py-16">
    <div class="mx-auto max-w-xl px-4 sm:px-6">
      <div class="card p-7 sm:p-9">
        <p class="eyebrow">Workspace lookup</p>
        <h1 class="mt-2 text-3xl font-bold">Find your sign-in page</h1>
        <p class="muted mt-3">
          Verify the email address used to create the workspace.
        </p>
        @if (error()) {
          <p class="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {{ error() }}
          </p>
        }
        @if (stage() === "email") {
          <form [formGroup]="emailForm" (ngSubmit)="requestCode()" class="mt-7">
            <label class="label" for="lookup-email">Email address</label
            ><input
              id="lookup-email"
              class="input"
              formControlName="email"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
            />
            <an-turnstile
              class="mt-4"
              (tokenChange)="turnstileToken.set($event)"
            /><button
              class="btn btn-primary mt-5 w-full"
              [disabled]="busy() || !turnstileToken()"
            >
              {{ busy() ? "Sending…" : "Send verification code" }}
            </button>
          </form>
        }
        @if (stage() === "otp") {
          <form [formGroup]="otpForm" (ngSubmit)="verifyCode()" class="mt-7">
            <label class="label" for="lookup-code">Six-digit code</label
            ><input
              id="lookup-code"
              class="input text-center text-xl tracking-[.35em]"
              formControlName="code"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
            /><button class="btn btn-primary mt-5 w-full" [disabled]="busy()">
              {{ busy() ? "Checking…" : "Open workspace" }}</button
            ><button
              type="button"
              class="btn btn-ghost mt-2 w-full"
              (click)="stage.set('email')"
            >
              Use another email
            </button>
          </form>
        }
        <p class="mt-6 mb-0 text-center text-sm text-muted">
          No workspace yet?
          <a routerLink="/signup" class="font-bold text-brand">Start free</a>
        </p>
      </div>
    </div>
  </section>`,
})
export class WorkspaceLookupPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  readonly stage = signal<"email" | "otp">("email");
  readonly busy = signal(false);
  readonly error = signal("");
  readonly turnstileToken = signal("");
  readonly emailForm = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
  });
  readonly otpForm = this.fb.nonNullable.group({
    code: ["", [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });
  private challengeId = "";

  async requestCode(): Promise<void> {
    if (this.emailForm.invalid || this.busy()) {
      this.emailForm.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set("");
    try {
      const response = await firstValueFrom(
        this.api.post<{ challenge_id: string }>(
          "signup/workspace/otp/request",
          {
            email: this.emailForm.getRawValue().email,
            turnstile_token: this.turnstileToken(),
          },
        ),
      );
      this.challengeId = response.challenge_id;
      this.stage.set("otp");
    } catch (error) {
      this.error.set(ApiService.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
  async verifyCode(): Promise<void> {
    if (this.otpForm.invalid || this.busy()) {
      this.otpForm.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set("");
    try {
      const response = await firstValueFrom(
        this.api.post<{ workspace_url: string }>(
          "signup/workspace/otp/verify",
          {
            challenge_id: this.challengeId,
            code: this.otpForm.getRawValue().code,
          },
        ),
      );
      window.location.assign(response.workspace_url);
    } catch (error) {
      this.error.set(ApiService.errorMessage(error));
      this.busy.set(false);
    }
  }
}

type SignupStage = "email" | "otp" | "details" | "complete";
interface SignupCompleteResponse {
  workspace: { id: string; name: string; slug: string };
  admin_url: string;
  client_url: string;
  handoff_code: string;
  billing_option: "trial" | "quarterly" | "annual";
  trial_ends_at?: string;
}

@Component({
  imports: [ReactiveFormsModule, RouterLink, TurnstileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="app-grid-bg bg-canvas py-14">
    <div class="mx-auto max-w-3xl px-4 sm:px-6">
      <div
        class="mb-7 flex items-center justify-center gap-2"
        aria-label="Signup progress"
      >
        @for (item of steps; track item; let index = $index) {
          <span
            class="h-2 rounded-full transition-all"
            [class.w-12]="stageIndex() >= index"
            [class.w-5]="stageIndex() < index"
            [class.bg-brand]="stageIndex() >= index"
            [class.bg-slate-300]="stageIndex() < index"
          ></span>
        }
      </div>
      <div class="card p-7 sm:p-10">
        @if (error()) {
          <p class="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {{ error() }}
          </p>
        }
        @if (stage() === "email") {
          <p class="eyebrow">Step 1 of 3</p>
          <h1 class="mt-2 text-3xl font-bold">Verify your email address</h1>
          <p class="muted mt-3">
            We’ll use this email to protect your workspace and help you find it
            later.
          </p>
          <form [formGroup]="emailForm" (ngSubmit)="requestCode()" class="mt-7">
            <label class="label" for="signup-email">Email address</label
            ><input
              id="signup-email"
              class="input"
              formControlName="email"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
            /><an-turnstile
              class="mt-4"
              (tokenChange)="turnstileToken.set($event)"
            /><button
              class="btn btn-primary mt-5 w-full"
              [disabled]="busy() || !turnstileToken()"
            >
              {{ busy() ? "Sending…" : "Send verification code" }}
            </button>
          </form>
        }
        @if (stage() === "otp") {
          <p class="eyebrow">Step 2 of 3</p>
          <h1 class="mt-2 text-3xl font-bold">Enter the code</h1>
          <p class="muted mt-3">
            The six-digit verification code expires in five minutes.
          </p>
          <form [formGroup]="otpForm" (ngSubmit)="verifyCode()" class="mt-7">
            <label class="label" for="signup-code">Verification code</label
            ><input
              id="signup-code"
              class="input text-center text-xl tracking-[.35em]"
              formControlName="code"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
            /><button class="btn btn-primary mt-5 w-full" [disabled]="busy()">
              {{ busy() ? "Verifying…" : "Verify and continue" }}</button
            ><button
              type="button"
              class="btn btn-ghost mt-2 w-full"
              (click)="stage.set('email')"
            >
              Change email
            </button>
          </form>
        }
        @if (stage() === "details") {
          <p class="eyebrow">Step 3 of 3</p>
          <h1 class="mt-2 text-3xl font-bold">Create your workspace</h1>
          <p class="muted mt-3">
            Your workspace address is generated securely from the business name.
          </p>
          <form
            [formGroup]="detailsForm"
            (ngSubmit)="complete()"
            class="mt-7 grid gap-5 sm:grid-cols-2"
          >
            <div class="sm:col-span-2">
              <label class="label" for="business">Business name</label
              ><input
                id="business"
                class="input"
                formControlName="businessName"
                autocomplete="organization"
              />
            </div>
            <div>
              <label class="label" for="first-name">First name</label
              ><input
                id="first-name"
                class="input"
                formControlName="firstName"
                autocomplete="given-name"
              />
            </div>
            <div>
              <label class="label" for="last-name">Last name</label
              ><input
                id="last-name"
                class="input"
                formControlName="lastName"
                autocomplete="family-name"
              />
            </div>
            <div>
              <label class="label" for="username">Username</label
              ><input
                id="username"
                class="input"
                formControlName="username"
                autocomplete="username"
              />
            </div>
            <div>
              <label class="label" for="password">Password</label
              ><input
                id="password"
                class="input"
                formControlName="password"
                type="password"
                autocomplete="new-password"
              />
              <p class="mt-2 text-xs text-muted">Use at least 10 characters.</p>
            </div>
            <fieldset class="sm:col-span-2">
              <legend class="label">Billing choice</legend>
              <div class="grid gap-3 sm:grid-cols-3">
                @for (option of billingOptions; track option.value) {
                  <label
                    class="cursor-pointer rounded-xl border p-4"
                    [class.border-brand]="
                      detailsForm.controls.billingOption.value === option.value
                    "
                    [class.bg-emerald-50]="
                      detailsForm.controls.billingOption.value === option.value
                    "
                    ><input
                      class="mr-2"
                      type="radio"
                      formControlName="billingOption"
                      [value]="option.value"
                    /><span class="font-bold">{{ option.label }}</span
                    ><span class="mt-1 block text-xs text-muted">{{
                      option.copy
                    }}</span></label
                  >
                }
              </div>
            </fieldset>
            <button
              class="btn btn-primary min-h-12 sm:col-span-2"
              [disabled]="busy()"
            >
              {{ busy() ? "Creating workspace…" : "Create secure workspace" }}
            </button>
          </form>
        }
        @if (stage() === "complete") {
          <div class="py-8 text-center">
            <span
              class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-2xl text-brand"
              >✓</span
            >
            <h1 class="mt-5 text-3xl font-bold">Your workspace is ready</h1>
            <p class="muted mx-auto mt-3 max-w-lg">
              Open the workspace and sign in with the administrator account you
              just created.
            </p>
            <a
              [href]="result()?.admin_url + '/auth/login'"
              class="btn btn-primary mt-6"
              >Open workspace</a
            >
          </div>
        }
      </div>
      <p class="mt-6 text-center text-sm text-muted">
        Already registered?
        <a routerLink="/find-workspace" class="font-bold text-brand"
          >Find your workspace</a
        >
      </p>
    </div>
  </section>`,
})
export class SignupPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  readonly stage = signal<SignupStage>("email");
  readonly busy = signal(false);
  readonly error = signal("");
  readonly result = signal<SignupCompleteResponse | null>(null);
  readonly turnstileToken = signal("");
  readonly steps = ["email", "otp", "details"];
  readonly stageIndex = computed(() =>
    Math.max(0, this.steps.indexOf(this.stage())),
  );
  readonly billingOptions = [
    { value: "trial", label: "Free trial", copy: "One month, no card" },
    { value: "quarterly", label: "Quarterly", copy: "Pay every 3 months" },
    { value: "annual", label: "Annual", copy: "One yearly payment" },
  ];
  readonly emailForm = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
  });
  readonly otpForm = this.fb.nonNullable.group({
    code: ["", [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });
  readonly detailsForm = this.fb.nonNullable.group({
    businessName: [
      "",
      [Validators.required, Validators.minLength(2), Validators.maxLength(120)],
    ],
    firstName: ["", [Validators.required, Validators.minLength(2)]],
    lastName: [""],
    username: [
      "",
      [Validators.required, Validators.pattern(/^[a-zA-Z0-9_.-]{3,50}$/)],
    ],
    password: ["", [Validators.required, Validators.minLength(10)]],
    billingOption: ["trial" as "trial" | "quarterly" | "annual"],
  });
  private challengeId = "";
  private signupToken = "";

  async requestCode(): Promise<void> {
    if (this.emailForm.invalid || this.busy()) {
      this.emailForm.markAllAsTouched();
      return;
    }
    await this.run(async () => {
      const response = await firstValueFrom(
        this.api.post<{ challenge_id: string }>("signup/otp/request", {
          email: this.emailForm.getRawValue().email,
          turnstile_token: this.turnstileToken(),
        }),
      );
      this.challengeId = response.challenge_id;
      this.stage.set("otp");
    });
  }
  async verifyCode(): Promise<void> {
    if (this.otpForm.invalid || this.busy()) {
      this.otpForm.markAllAsTouched();
      return;
    }
    await this.run(async () => {
      const response = await firstValueFrom(
        this.api.post<{ signup_token: string }>("signup/otp/verify", {
          challenge_id: this.challengeId,
          code: this.otpForm.getRawValue().code,
        }),
      );
      this.signupToken = response.signup_token;
      this.stage.set("details");
    });
  }
  async complete(): Promise<void> {
    if (this.detailsForm.invalid || this.busy()) {
      this.detailsForm.markAllAsTouched();
      return;
    }
    const value = this.detailsForm.getRawValue();
    await this.run(async () => {
      const response = await firstValueFrom(
        this.api.post<SignupCompleteResponse>("signup/complete", {
          signup_token: this.signupToken,
          business_name: value.businessName,
          first_name: value.firstName,
          last_name: value.lastName || undefined,
          username: value.username,
          password: value.password,
          locale: "en",
          billing_option: value.billingOption,
        }),
      );
      this.result.set(response);
      const local = window.location.hostname === "localhost";
      const target = local ? "http://localhost:4200" : response.admin_url;
      const fragment = new URLSearchParams({
        code: response.handoff_code,
        ...(local ? { workspace: response.workspace.slug } : {}),
        ...(response.billing_option === "trial"
          ? {}
          : { billing: response.billing_option }),
      });
      window.location.assign(`${target}/auth/activate#${fragment.toString()}`);
      this.stage.set("complete");
    });
  }
  private async run(task: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.error.set("");
    try {
      await task();
    } catch (error) {
      this.error.set(ApiService.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
