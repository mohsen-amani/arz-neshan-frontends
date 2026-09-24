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
import { ApiRecord } from "@shared/core/models";
import { SessionState } from "@shared/core/session.state";
import { PageHeaderComponent } from "@shared/ui/page-header.component";
import { StateComponent } from "@shared/ui/state.component";

@Component({
  imports: [ReactiveFormsModule, PageHeaderComponent, StateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "workspace-page workspace-settings-page workspace-form-page" },
  template: `
    <an-page-header
      eyebrow="Organization"
      title="Workspace settings"
      description="Manage the organization name and default language. Workspace identity and owner phone remain protected."
    />
    @if (loading()) {
      <an-state
        icon="…"
        title="Loading settings"
        message="Retrieving workspace configuration."
      />
    } @else if (loadError()) {
      <an-state icon="!" title="Settings unavailable" [message]="loadError()">
        <button class="btn btn-secondary" (click)="load()">Try again</button>
      </an-state>
    } @else {
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <form class="card p-6 sm:p-8" [formGroup]="form" (ngSubmit)="save()">
          <div class="border-b border-line pb-5">
            <p class="eyebrow mb-2">General</p>
            <h2 class="mb-1 text-xl font-bold">Organization profile</h2>
            <p class="muted mb-0">
              These values appear throughout the operational workspace.
            </p>
          </div>
          @if (message()) {
            <p
              class="notice mt-5"
              [class.notice-danger]="failed()"
              role="status"
            >
              {{ message() }}
            </p>
          }
          <div class="mt-6 grid gap-5 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="label" for="workspace-name"
                >Organization name</label
              >
              <input
                class="input"
                id="workspace-name"
                formControlName="name"
                maxlength="150"
              />
            </div>
            <div>
              <label class="label" for="workspace-locale"
                >Default language</label
              >
              <select
                class="input"
                id="workspace-locale"
                formControlName="defaultLocale"
              >
                <option value="en">English</option>
                <option value="fa">Dari / Persian</option>
                <option value="ps">Pashto</option>
              </select>
            </div>
            <div>
              <label class="label">Workspace address</label>
              <div
                class="input flex items-center bg-slate-50 text-muted"
                aria-readonly="true"
              >
                {{ workspace()?.["slug"] }}
              </div>
            </div>
          </div>
          @if (session.can("settings.manage")) {
            <div class="mt-7 flex justify-end border-t border-line pt-5">
              <button class="btn btn-primary min-w-40" [disabled]="busy()">
                {{ busy() ? "Saving…" : "Save settings" }}
              </button>
            </div>
          }
        </form>
        <aside class="space-y-4">
          <section class="card p-5">
            <p class="eyebrow mb-2">Protected identity</p>
            <dl class="m-0 space-y-4 text-sm">
              <div>
                <dt class="text-muted">Workspace ID</dt>
                <dd class="mt-1 break-all font-mono text-xs">
                  {{ workspace()?.["id"] }}
                </dd>
              </div>
              <div>
                <dt class="text-muted">Owner contact</dt>
                <dd class="mt-1 font-semibold">
                  {{
                    workspace()?.["owner_email"] ||
                      workspace()?.["owner_phone_e164"]
                  }}
                </dd>
              </div>
              <div>
                <dt class="text-muted">Status</dt>
                <dd class="mt-1">
                  <span class="status-badge status-success">{{
                    workspace()?.["status"]
                  }}</span>
                </dd>
              </div>
            </dl>
          </section>
          <p
            class="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900"
          >
            Slug and owner-phone changes require a controlled support process
            because they affect hostname routing and account recovery.
          </p>
        </aside>
      </div>
    }
  `,
})
export class SettingsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly session = inject(SessionState);
  readonly workspace = signal<ApiRecord | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly loadError = signal("");
  readonly message = signal("");
  readonly failed = signal(false);
  readonly form = this.fb.nonNullable.group({
    name: ["", [Validators.required, Validators.maxLength(150)]],
    defaultLocale: ["en", Validators.required],
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set("");
    try {
      const workspace = await firstValueFrom(
        this.api.get<ApiRecord>("workspace/settings"),
      );
      this.workspace.set(workspace);
      this.form.patchValue({
        name: String(workspace["name"] ?? ""),
        defaultLocale: String(workspace["default_locale"] ?? "en"),
      });
      if (!this.session.can("settings.manage")) this.form.disable();
    } catch (error) {
      this.loadError.set(ApiService.errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    if (
      this.form.invalid ||
      this.busy() ||
      !this.session.can("settings.manage")
    )
      return;
    this.busy.set(true);
    this.message.set("");
    try {
      const value = this.form.getRawValue();
      const updated = await firstValueFrom(
        this.api.patch<ApiRecord>("workspace/settings", {
          name: value.name,
          default_locale: value.defaultLocale,
        }),
      );
      this.workspace.set(updated);
      this.message.set("Workspace settings saved.");
      this.failed.set(false);
    } catch (error) {
      this.message.set(ApiService.errorMessage(error));
      this.failed.set(true);
    } finally {
      this.busy.set(false);
    }
  }
}
