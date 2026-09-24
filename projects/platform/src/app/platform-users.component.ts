import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import { ApiService } from "@shared/core/api.service";
import { displayValue } from "@shared/core/format";
import { ApiRecord } from "@shared/core/models";
import { SessionState } from "@shared/core/session.state";
import { PageHeaderComponent } from "@shared/ui/page-header.component";
import { StateComponent } from "@shared/ui/state.component";

@Component({
  imports: [ReactiveFormsModule, PageHeaderComponent, StateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <an-page-header
      eyebrow="Security"
      title="Platform operators"
      description="Manage the small set of people allowed into the private control plane. Every account uses password and TOTP authentication."
    >
      <button class="btn btn-primary" (click)="showCreate.set(!showCreate())">
        {{ showCreate() ? "Cancel" : "Add operator" }}
      </button>
    </an-page-header>

    @if (message()) {
      <p class="notice mb-5" [class.notice-danger]="failed()" role="status">
        {{ message() }}
      </p>
    }

    @if (created(); as provisioning) {
      <section
        class="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-6"
        aria-labelledby="provisioning-title"
      >
        <p
          class="mb-1 text-xs font-bold tracking-wider text-amber-800 uppercase"
        >
          Shown once
        </p>
        <h2
          id="provisioning-title"
          class="mb-2 text-lg font-bold text-amber-950"
        >
          Enroll {{ provisioning["email"] }} in an authenticator
        </h2>
        <p class="mb-4 text-sm leading-6 text-amber-900">
          Transfer this secret through an approved secure channel. It cannot be
          retrieved again from the API.
        </p>
        <div class="rounded-lg border border-amber-200 bg-white p-4">
          <p class="mb-1 text-xs font-bold text-muted uppercase">TOTP secret</p>
          <code class="break-all text-base font-bold tracking-wider">{{
            provisioning["totp_secret"]
          }}</code>
          <p class="mt-4 mb-1 text-xs font-bold text-muted uppercase">
            Provisioning URI
          </p>
          <code class="block break-all text-xs leading-5">{{
            provisioning["provisioning_uri"]
          }}</code>
        </div>
        <button class="btn btn-secondary mt-4" (click)="created.set(null)">
          I stored it securely
        </button>
      </section>
    }

    @if (showCreate()) {
      <form
        class="card mb-6 grid gap-5 p-6 sm:grid-cols-2"
        [formGroup]="form"
        (ngSubmit)="create()"
      >
        <div>
          <label class="label" for="operator-email">Operator email</label>
          <input
            class="input"
            id="operator-email"
            type="email"
            formControlName="email"
            autocomplete="off"
          />
        </div>
        <div>
          <label class="label" for="operator-password">Initial password</label>
          <input
            class="input"
            id="operator-password"
            type="password"
            formControlName="password"
            autocomplete="new-password"
          />
          <p class="mt-1 text-xs text-muted">
            Use upper/lowercase letters, a number, and a symbol.
          </p>
        </div>
        <div class="flex justify-end sm:col-span-2">
          <button class="btn btn-primary min-w-40" [disabled]="busy()">
            {{ busy() ? "Creating…" : "Create operator" }}
          </button>
        </div>
      </form>
    }

    @if (loading()) {
      <an-state
        icon="…"
        title="Loading operators"
        message="Retrieving platform access records."
      />
    } @else if (loadError()) {
      <an-state
        icon="!"
        title="Operators unavailable"
        [message]="loadError()"
      />
    } @else {
      <div class="table-shell overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th>Created</th>
              <th>Updated</th>
              <th><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            @for (user of users(); track user["id"]) {
              <tr>
                <td class="font-semibold text-ink">
                  {{ user["email"] }}
                  @if (user["id"] === session.platformUser()?.id) {
                    <span class="ml-2 text-xs text-muted">You</span>
                  }
                </td>
                <td>
                  <span
                    [class]="
                      user['status'] === 'active'
                        ? 'status-badge status-success'
                        : 'status-badge status-danger'
                    "
                    >{{ user["status"] }}</span
                  >
                </td>
                <td>{{ display(user["createdAt"]) }}</td>
                <td>{{ display(user["updatedAt"]) }}</td>
                <td class="text-right">
                  <button
                    class="btn btn-ghost"
                    [class.text-red-700]="user['status'] === 'active'"
                    [disabled]="
                      busyId() === user['id'] ||
                      user['id'] === session.platformUser()?.id
                    "
                    (click)="toggle(user)"
                  >
                    {{ user["status"] === "active" ? "Disable" : "Enable" }}
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class PlatformUsersComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly session = inject(SessionState);
  readonly users = signal<ApiRecord[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal("");
  readonly showCreate = signal(false);
  readonly busy = signal(false);
  readonly busyId = signal<unknown>(null);
  readonly message = signal("");
  readonly failed = signal(false);
  readonly created = signal<ApiRecord | null>(null);
  readonly display = displayValue;
  readonly form = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set("");
    try {
      this.users.set(
        await firstValueFrom(this.api.get<ApiRecord[]>("platform/users")),
      );
    } catch (error) {
      this.loadError.set(ApiService.errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  async create(): Promise<void> {
    if (this.form.invalid || this.busy()) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    try {
      this.created.set(
        await firstValueFrom(
          this.api.post<ApiRecord>("platform/users", this.form.getRawValue()),
        ),
      );
      this.message.set(
        "Platform operator created. Complete authenticator enrollment now.",
      );
      this.failed.set(false);
      this.form.reset();
      this.showCreate.set(false);
      await this.load();
    } catch (error) {
      this.message.set(ApiService.errorMessage(error));
      this.failed.set(true);
    } finally {
      this.busy.set(false);
    }
  }

  async toggle(user: ApiRecord): Promise<void> {
    const id = user["id"];
    if (!id || id === this.session.platformUser()?.id || this.busyId()) return;
    this.busyId.set(id);
    try {
      const updated = await firstValueFrom(
        this.api.patch<ApiRecord>(`platform/users/${String(id)}/status`, {
          status: user["status"] === "active" ? "disabled" : "active",
        }),
      );
      this.users.update((users) =>
        users.map((item) => (item["id"] === id ? updated : item)),
      );
      this.message.set(
        "Operator status updated and active sessions revoked when required.",
      );
      this.failed.set(false);
    } catch (error) {
      this.message.set(ApiService.errorMessage(error));
      this.failed.set(true);
    } finally {
      this.busyId.set(null);
    }
  }
}
