import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { ApiService } from "@shared/core/api.service";
import { ApiRecord } from "@shared/core/models";
import { PageHeaderComponent } from "@shared/ui/page-header.component";
import { StateComponent } from "@shared/ui/state.component";
import { Paginated } from "@shared/core/models";
import { SessionState } from "@shared/core/session.state";

@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageHeaderComponent,
    StateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "workspace-page workspace-form-page" },
  template: `
    @if (loading()) {
      <an-state
        icon="…"
        title="Loading customer"
        message="Retrieving the current profile."
      />
    } @else if (loadError()) {
      <an-state icon="!" title="Customer unavailable" [message]="loadError()">
        <button class="btn btn-secondary" (click)="load()">Try again</button>
      </an-state>
    } @else {
      <an-page-header
        eyebrow="Customer maintenance"
        title="Edit customer profile"
        description="Update identity and contact details. Existing financial records remain immutable."
      >
        <a [routerLink]="['/clients', id]" class="btn btn-secondary">Cancel</a>
      </an-page-header>
      <form
        class="card mx-auto grid max-w-4xl gap-5 p-6 sm:grid-cols-2 sm:p-8"
        [formGroup]="form"
        (ngSubmit)="submit()"
      >
        @if (error()) {
          <p
            class="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2"
            role="alert"
          >
            {{ error() }}
          </p>
        }
        <div>
          <label class="label" for="edit-first-name">First name</label>
          <input
            class="input"
            id="edit-first-name"
            formControlName="firstName"
          />
        </div>
        @if (branches().length) {
          <div>
            <label class="label" for="edit-branch">Owning branch</label>
            <select class="input" id="edit-branch" formControlName="branchId">
              <option value="">Organization-wide / unassigned</option>
              @for (branch of branches(); track branch.id) {
                <option [value]="branch.id">{{ branch.label }}</option>
              }
            </select>
          </div>
        }
        <div>
          <label class="label" for="edit-last-name">Last name</label>
          <input class="input" id="edit-last-name" formControlName="lastName" />
        </div>
        <div>
          <label class="label" for="edit-email">Email</label>
          <input
            class="input"
            id="edit-email"
            type="email"
            formControlName="email"
          />
        </div>
        <div>
          <label class="label" for="edit-phone">Phone</label>
          <input class="input" id="edit-phone" formControlName="phone" />
        </div>
        <div>
          <label class="label" for="edit-identity">Identity number</label>
          <input
            class="input"
            id="edit-identity"
            formControlName="identityNumber"
          />
        </div>
        <div>
          <label class="label" for="edit-passport">Passport number</label>
          <input
            class="input"
            id="edit-passport"
            formControlName="passportNumber"
          />
        </div>
        <div>
          <label class="label" for="edit-birth-date">Date of birth</label>
          <input
            class="input"
            id="edit-birth-date"
            type="date"
            formControlName="dateOfBirth"
          />
        </div>
        <div>
          <label class="label" for="edit-status">Status</label>
          <select class="input" id="edit-status" formControlName="status">
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <p class="mt-1 text-xs text-muted">
            Suspending a customer revokes active portal sessions.
          </p>
        </div>
        <div>
          <label class="label" for="edit-province">Province</label>
          <input class="input" id="edit-province" formControlName="province" />
        </div>
        <div>
          <label class="label" for="edit-nationality">Nationality</label>
          <input
            class="input"
            id="edit-nationality"
            formControlName="nationality"
          />
        </div>
        <div class="sm:col-span-2">
          <label class="label" for="edit-occupation">Occupation</label>
          <input
            class="input"
            id="edit-occupation"
            formControlName="occupation"
          />
        </div>
        <div class="sm:col-span-2">
          <label class="label" for="edit-address">Address</label>
          <textarea
            class="input min-h-24"
            id="edit-address"
            formControlName="address"
          ></textarea>
        </div>
        <div class="flex justify-end sm:col-span-2">
          <button
            class="btn btn-primary min-w-40"
            [disabled]="busy() || form.invalid"
          >
            {{ busy() ? "Saving…" : "Save profile" }}
          </button>
        </div>
      </form>
    }
  `,
})
export class ClientEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly session = inject(SessionState);
  readonly id = this.route.snapshot.paramMap.get("id") ?? "";
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal("");
  readonly loadError = signal("");
  readonly branches = signal<Array<{ id: string; label: string }>>([]);
  readonly form = this.fb.nonNullable.group({
    firstName: ["", Validators.required],
    lastName: [""],
    email: ["", Validators.email],
    phone: [""],
    identityNumber: [""],
    passportNumber: [""],
    dateOfBirth: [""],
    province: [""],
    nationality: [""],
    occupation: [""],
    address: [""],
    status: ["active"],
    branchId: [""],
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set("");
    if (!this.id) {
      this.loadError.set("Customer identifier is missing.");
      this.loading.set(false);
      return;
    }
    try {
      const [record, branches] = await Promise.all([
        firstValueFrom(this.api.get<ApiRecord>(`clients/${this.id}`)),
        this.loadBranches(),
      ]);
      this.branches.set(branches);
      this.form.patchValue({
        firstName: String(record["first_name"] ?? ""),
        lastName: String(record["last_name"] ?? ""),
        email: String(record["email"] ?? ""),
        phone: String(record["phone"] ?? ""),
        identityNumber: String(record["identity_number"] ?? ""),
        passportNumber: String(record["passport_number"] ?? ""),
        dateOfBirth: String(record["date_of_birth"] ?? "").slice(0, 10),
        province: String(record["province"] ?? ""),
        nationality: String(record["nationality"] ?? ""),
        occupation: String(record["occupation"] ?? ""),
        address: String(record["address"] ?? ""),
        status: String(record["status"] ?? "active"),
        branchId: String(record["branch_id"] ?? ""),
      });
    } catch (error) {
      this.loadError.set(ApiService.errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid || !this.id || this.busy()) return;
    this.busy.set(true);
    this.error.set("");
    const value = this.form.getRawValue();
    const optional = (item: string) => item.trim() || undefined;
    try {
      await firstValueFrom(
        this.api.put(`clients/${this.id}`, {
          first_name: value.firstName.trim(),
          last_name: optional(value.lastName),
          email: optional(value.email),
          phone: optional(value.phone),
          identity_number: optional(value.identityNumber),
          passport_number: optional(value.passportNumber),
          date_of_birth: optional(value.dateOfBirth),
          province: optional(value.province),
          nationality: optional(value.nationality),
          occupation: optional(value.occupation),
          address: optional(value.address),
          status: value.status,
          branch_id: optional(value.branchId),
        }),
      );
      await this.router.navigate(["/clients", this.id]);
    } catch (error) {
      this.error.set(ApiService.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  private async loadBranches(): Promise<Array<{ id: string; label: string }>> {
    if (!this.session.can("branches.read")) return [];
    const response = await firstValueFrom(
      this.api.get<ApiRecord[] | Paginated<ApiRecord>>("branches", {
        perPage: 100,
      }),
    );
    return ApiService.rows(response).map((row) => ({
      id: String(row["id"]),
      label: String(row["name"] ?? row["code"] ?? row["id"]),
    }));
  }
}
