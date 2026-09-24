import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "@shared/core/auth.service";
import { ApiService } from "@shared/core/api.service";
import { BrandComponent } from "@shared/ui/brand.component";

@Component({
  imports: [ReactiveFormsModule, BrandComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main
    class="workspace-auth app-grid-bg grid min-h-screen place-items-center bg-canvas px-4 py-12"
  >
    <section class="w-full max-w-md">
      <div class="mb-7 flex justify-center"><an-brand /></div>
      <div class="card p-7 sm:p-9">
        <p class="eyebrow">Secure workspace</p>
        <h1 class="mt-2 text-3xl font-bold">Sign in</h1>
        <p class="muted mt-2">Use your administrator username or email.</p>
        @if (error()) {
          <p class="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {{ error() }}
          </p>
        }
        <form [formGroup]="form" (ngSubmit)="submit()" class="mt-7 space-y-5">
          <div>
            <label class="label" for="identifier">Username or email</label
            ><input
              class="input"
              id="identifier"
              formControlName="identifier"
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
          <button class="btn btn-primary w-full" [disabled]="busy()">
            {{ busy() ? "Signing in…" : "Sign in securely" }}
          </button>
        </form>
        <p class="mt-6 mb-0 text-center text-xs text-muted">
          Workspace access is monitored and session-bound.
        </p>
      </div>
    </section>
  </main>`,
})
export class WorkspaceLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly busy = signal(false);
  readonly error = signal("");
  readonly form = this.fb.nonNullable.group({
    identifier: ["", Validators.required],
    password: ["", Validators.required],
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
      await this.auth.loginWorkspace(
        value.identifier,
        value.password,
        this.route.snapshot.queryParamMap.get("workspace") ?? undefined,
      );
      await this.router.navigateByUrl("/");
    } catch (error) {
      this.error.set(ApiService.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}

@Component({
  imports: [BrandComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main
    class="workspace-auth app-grid-bg grid min-h-screen place-items-center bg-canvas px-4"
  >
    <section class="card w-full max-w-md p-9 text-center">
      <div class="flex justify-center"><an-brand /></div>
      <span
        class="mx-auto mt-8 grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-xl text-brand"
        >{{ error() ? "!" : "↻" }}</span
      >
      <h1 class="mt-5 text-2xl font-bold">
        {{ error() ? "Activation link unavailable" : "Opening your workspace" }}
      </h1>
      <p class="muted mt-2">
        {{
          error() || "Verifying the one-time handoff. This only takes a moment."
        }}
      </p>
    </section>
  </main>`,
})
export class ActivateComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly error = signal("");
  async ngOnInit(): Promise<void> {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const code = params.get("code");
    if (!code) {
      this.error.set("This activation link is missing its one-time code.");
      return;
    }
    try {
      await this.auth.exchangeHandoff(
        code,
        params.get("workspace") ?? undefined,
      );
      const billing = params.get("billing");
      await this.router.navigateByUrl(billing ? "/billing" : "/");
    } catch (error) {
      this.error.set(ApiService.errorMessage(error));
    }
  }
}
