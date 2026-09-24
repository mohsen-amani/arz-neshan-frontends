import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import { ApiService } from "@shared/core/api.service";
import { ApiRecord, Paginated } from "@shared/core/models";
import { PageHeaderComponent } from "@shared/ui/page-header.component";
import { humanize } from "@shared/core/format";

interface ScopeDraft {
  scope_type: "global" | "branch" | "cash_desk" | "partner" | "own";
  scope_id?: string;
}
@Component({
  imports: [ReactiveFormsModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "workspace-page workspace-admin-page" },
  template: `<an-page-header
      eyebrow="Access control"
      title="Roles, permissions, and scopes"
      description="Permissions define capabilities. Scopes limit the operational records available to each administrator."
    />
    @if (message()) {
      <p
        class="mb-5 rounded-xl border p-4 text-sm"
        [class.border-emerald-200]="!error()"
        [class.bg-emerald-50]="!error()"
        [class.text-emerald-800]="!error()"
        [class.border-red-200]="error()"
        [class.bg-red-50]="error()"
        [class.text-red-700]="error()"
      >
        {{ message() }}
      </p>
    }
    <div class="grid gap-6 xl:grid-cols-2">
      <section class="card overflow-hidden">
        <div class="border-b border-line p-6">
          <h2 class="mb-1 text-lg font-bold">Role permissions</h2>
          <p class="muted mb-0">
            Create reusable roles from the backend-owned permission catalog.
          </p>
        </div>
        <div class="p-6">
          <form
            [formGroup]="roleForm"
            (ngSubmit)="createRole()"
            class="mb-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
          >
            <input
              class="input"
              formControlName="name"
              placeholder="Role name"
              aria-label="Role name"
            /><input
              class="input"
              formControlName="description"
              placeholder="Description"
              aria-label="Role description"
            /><button class="btn btn-secondary">Add role</button>
          </form>
          <label class="label" for="role">Role to edit</label
          ><select
            id="role"
            class="input"
            [value]="selectedRoleId()"
            (change)="selectRole($any($event.target).value)"
          >
            <option value="">Select a role</option>
            @for (role of roles(); track role["id"]) {
              <option [value]="role['id']">{{ role["name"] }}</option>
            }
          </select>
          @if (selectedRoleId()) {
            <div class="mt-5 grid gap-2 sm:grid-cols-2">
              @for (permission of permissions(); track permission["id"]) {
                <label
                  class="flex cursor-pointer gap-3 rounded-lg border border-line p-3 hover:bg-slate-50"
                  ><input
                    type="checkbox"
                    class="mt-1 accent-emerald-700"
                    [checked]="
                      selectedPermissionIds().has(string(permission['id']))
                    "
                    (change)="
                      togglePermission(
                        string(permission['id']),
                        $any($event.target).checked
                      )
                    "
                  /><span
                    ><strong class="block text-sm">{{
                      permission["code"]
                    }}</strong
                    ><span class="mt-1 block text-xs leading-5 text-muted">{{
                      permission["description"] ||
                        humanize(string(permission["code"]))
                    }}</span></span
                  ></label
                >
              }
            </div>
            <button
              class="btn btn-primary mt-5"
              (click)="saveRolePermissions()"
              [disabled]="busy()"
            >
              Save role permissions
            </button>
          }
        </div>
      </section>
      <section class="card overflow-hidden">
        <div class="border-b border-line p-6">
          <h2 class="mb-1 text-lg font-bold">Administrator assignments</h2>
          <p class="muted mb-0">
            Combine one or more roles with the narrowest suitable data scopes.
          </p>
        </div>
        <div class="p-6">
          <label class="label" for="admin">Administrator</label
          ><select
            id="admin"
            class="input"
            [value]="selectedAdminId()"
            (change)="selectAdmin($any($event.target).value)"
          >
            <option value="">Select an administrator</option>
            @for (admin of admins(); track admin["id"]) {
              <option [value]="admin['id']">
                {{ admin["first_name"] }} {{ admin["last_name"] }} ·
                {{ admin["username"] }}
              </option>
            }
          </select>
          @if (selectedAdminId()) {
            <fieldset class="mt-5">
              <legend class="label">Assigned roles</legend>
              <div class="flex flex-wrap gap-2">
                @for (role of roles(); track role["id"]) {
                  <label class="pill cursor-pointer border-line bg-slate-50"
                    ><input
                      type="checkbox"
                      class="mr-2 accent-emerald-700"
                      [checked]="selectedRoleIds().has(string(role['id']))"
                      (change)="
                        toggleAdminRole(
                          string(role['id']),
                          $any($event.target).checked
                        )
                      "
                    />{{ role["name"] }}</label
                  >
                }
              </div>
            </fieldset>
            <fieldset class="mt-6">
              <legend class="label">Operational scopes</legend>
              <div class="grid gap-3 sm:grid-cols-[.8fr_1fr_auto]">
                <select
                  class="input"
                  [value]="scopeType()"
                  (change)="scopeType.set($any($event.target).value)"
                >
                  <option value="global">Global</option>
                  <option value="branch">Branch</option>
                  <option value="cash_desk">Cash desk</option>
                  <option value="partner">Partner</option>
                  <option value="own">Own records</option>
                </select>
                @if (scopeNeedsTarget()) {
                  <select
                    class="input"
                    [value]="scopeTarget()"
                    (change)="scopeTarget.set($any($event.target).value)"
                  >
                    <option value="">Select target</option>
                    @for (target of scopeTargets(); track target.id) {
                      <option [value]="target.id">{{ target.label }}</option>
                    }
                  </select>
                } @else {
                  <div class="input flex items-center text-muted">
                    No target required
                  </div>
                }
                <button
                  class="btn btn-secondary"
                  type="button"
                  (click)="addScope()"
                >
                  Add
                </button>
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                @for (
                  scope of scopes();
                  track scope.scope_type + ":" + scope.scope_id
                ) {
                  <button
                    type="button"
                    class="pill cursor-pointer border-emerald-200 bg-emerald-50 text-brand"
                    (click)="removeScope(scope)"
                  >
                    {{ humanize(scope.scope_type)
                    }}{{ scope.scope_id ? " · " + targetName(scope) : "" }} ×
                  </button>
                } @empty {
                  <p class="text-sm text-amber-800">
                    No scope means no scoped financial or operational records.
                  </p>
                }
              </div>
            </fieldset>
            <button
              class="btn btn-primary mt-6"
              (click)="saveAdminAssignments()"
              [disabled]="busy()"
            >
              Save assignments
            </button>
          }
        </div>
      </section>
    </div>`,
})
export class AccessManagementComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly roles = signal<ApiRecord[]>([]);
  readonly permissions = signal<ApiRecord[]>([]);
  readonly admins = signal<ApiRecord[]>([]);
  readonly branches = signal<ApiRecord[]>([]);
  readonly cashDesks = signal<ApiRecord[]>([]);
  readonly partners = signal<ApiRecord[]>([]);
  readonly selectedRoleId = signal("");
  readonly selectedPermissionIds = signal(new Set<string>());
  readonly selectedAdminId = signal("");
  readonly selectedRoleIds = signal(new Set<string>());
  readonly scopes = signal<ScopeDraft[]>([]);
  readonly scopeType = signal<ScopeDraft["scope_type"]>("global");
  readonly scopeTarget = signal("");
  readonly busy = signal(false);
  readonly error = signal(false);
  readonly message = signal("");
  readonly roleForm = this.fb.nonNullable.group({
    name: ["", Validators.required],
    description: [""],
  });
  readonly scopeNeedsTarget = computed(() =>
    ["branch", "cash_desk", "partner"].includes(this.scopeType()),
  );
  readonly scopeTargets = computed(() => {
    const source =
      this.scopeType() === "branch"
        ? this.branches()
        : this.scopeType() === "cash_desk"
          ? this.cashDesks()
          : this.partners();
    return source.map((item) => ({
      id: this.string(item["id"]),
      label: this.string(item["name"] ?? item["code"]),
    }));
  });
  readonly humanize = humanize;
  readonly string = (value: unknown) => String(value ?? "");
  ngOnInit(): void {
    void this.load();
  }
  async load(): Promise<void> {
    try {
      const [roles, permissions, admins, branches, desks, partners] =
        await Promise.all([
          firstValueFrom(this.api.get<ApiRecord[]>("access/roles")),
          firstValueFrom(this.api.get<ApiRecord[]>("access/permissions")),
          firstValueFrom(
            this.api.get<Paginated<ApiRecord>>("admins", { perPage: 100 }),
          ),
          firstValueFrom(this.api.get<ApiRecord[]>("branches")),
          firstValueFrom(this.api.get<ApiRecord[]>("cash-desks")),
          firstValueFrom(this.api.get<ApiRecord[]>("partners")),
        ]);
      this.roles.set(roles);
      this.permissions.set(permissions);
      this.admins.set(ApiService.rows(admins));
      this.branches.set(ApiService.rows(branches));
      this.cashDesks.set(ApiService.rows(desks));
      this.partners.set(ApiService.rows(partners));
    } catch (error) {
      this.notice(ApiService.errorMessage(error), true);
    }
  }
  async createRole(): Promise<void> {
    if (this.roleForm.invalid) return;
    await this.run(async () => {
      await firstValueFrom(
        this.api.post("access/roles", this.roleForm.getRawValue()),
      );
      this.roleForm.reset();
      this.roles.set(
        await firstValueFrom(this.api.get<ApiRecord[]>("access/roles")),
      );
    }, "Role created.");
  }
  async selectRole(id: string): Promise<void> {
    this.selectedRoleId.set(id);
    this.selectedPermissionIds.set(new Set());
    if (!id) return;
    try {
      const assigned = await firstValueFrom(
        this.api.get<ApiRecord[]>(`access/roles/${id}/permissions`),
      );
      this.selectedPermissionIds.set(
        new Set(assigned.map((item) => this.string(item["id"]))),
      );
    } catch (error) {
      this.notice(ApiService.errorMessage(error), true);
    }
  }
  togglePermission(id: string, checked: boolean): void {
    const next = new Set(this.selectedPermissionIds());
    checked ? next.add(id) : next.delete(id);
    this.selectedPermissionIds.set(next);
  }
  async saveRolePermissions(): Promise<void> {
    await this.run(
      () =>
        firstValueFrom(
          this.api.put(`access/roles/${this.selectedRoleId()}/permissions`, {
            permission_ids: [...this.selectedPermissionIds()],
          }),
        ).then(() => undefined),
      "Role permissions saved.",
    );
  }
  async selectAdmin(id: string): Promise<void> {
    this.selectedAdminId.set(id);
    this.selectedRoleIds.set(new Set());
    this.scopes.set([]);
    if (!id) return;
    try {
      const result = await firstValueFrom(
        this.api.get<{ roles: ApiRecord[]; scopes: ScopeDraft[] }>(
          `access/admins/${id}/assignments`,
        ),
      );
      this.selectedRoleIds.set(
        new Set(result.roles.map((role) => this.string(role["id"]))),
      );
      this.scopes.set(
        result.scopes.map((scope) => ({
          scope_type: scope.scope_type,
          scope_id: scope.scope_id,
        })),
      );
    } catch (error) {
      this.notice(ApiService.errorMessage(error), true);
    }
  }
  toggleAdminRole(id: string, checked: boolean): void {
    const next = new Set(this.selectedRoleIds());
    checked ? next.add(id) : next.delete(id);
    this.selectedRoleIds.set(next);
  }
  addScope(): void {
    const target = this.scopeNeedsTarget() ? this.scopeTarget() : undefined;
    if (this.scopeNeedsTarget() && !target) {
      this.notice("Choose a scope target.", true);
      return;
    }
    const scope: ScopeDraft = {
      scope_type: this.scopeType(),
      scope_id: target,
    };
    if (
      !this.scopes().some(
        (item) =>
          item.scope_type === scope.scope_type &&
          item.scope_id === scope.scope_id,
      )
    )
      this.scopes.update((items) => [...items, scope]);
    this.scopeTarget.set("");
  }
  removeScope(scope: ScopeDraft): void {
    this.scopes.update((items) => items.filter((item) => item !== scope));
  }
  targetName(scope: ScopeDraft): string {
    const source =
      scope.scope_type === "branch"
        ? this.branches()
        : scope.scope_type === "cash_desk"
          ? this.cashDesks()
          : this.partners();
    const found = source.find(
      (item) => this.string(item["id"]) === scope.scope_id,
    );
    return this.string(found?.["name"] ?? found?.["code"] ?? scope.scope_id);
  }
  async saveAdminAssignments(): Promise<void> {
    await this.run(
      () =>
        firstValueFrom(
          this.api.put(`access/admins/${this.selectedAdminId()}/assignments`, {
            role_ids: [...this.selectedRoleIds()],
            scopes: this.scopes(),
          }),
        ).then(() => undefined),
      "Administrator assignments saved atomically.",
    );
  }
  private async run(task: () => Promise<void>, success: string): Promise<void> {
    this.busy.set(true);
    this.message.set("");
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
