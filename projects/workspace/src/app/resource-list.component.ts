import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { ApiService } from "@shared/core/api.service";
import { ApiRecord, Paginated } from "@shared/core/models";
import { PageHeaderComponent } from "@shared/ui/page-header.component";
import { StateComponent } from "@shared/ui/state.component";
import { SessionState } from "@shared/core/session.state";
import { WorkspaceReferenceLabelService } from "./workspace-reference-label.service";

interface ResourceConfig {
  title: string;
  eyebrow: string;
  description: string;
  endpoint: string;
  searchKey?: string;
  actionLabel?: string;
  actionRoute?: string;
  permission?: string;
  detailRoute?: string;
}

@Component({
  imports: [FormsModule, RouterLink, PageHeaderComponent, StateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "workspace-page workspace-list-page" },
  template: `
    <an-page-header
      [eyebrow]="config.eyebrow"
      [title]="config.title"
      [description]="config.description"
    >
      @if (
        config.actionRoute &&
        (!config.permission || session.can(config.permission))
      ) {
        <a [routerLink]="config.actionRoute" class="btn btn-primary">{{
          config.actionLabel
        }}</a>
      }
    </an-page-header>
    <div
      class="card mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <label class="relative block w-full max-w-md"
        ><span class="sr-only">Search</span
        ><input
          class="input pl-10"
          [ngModel]="query()"
          (ngModelChange)="query.set($event)"
          placeholder="Search these records"
        /><span class="pointer-events-none absolute top-2.5 left-3 text-muted"
          >⌕</span
        ></label
      >
      <p class="mb-0 text-sm text-muted">
        {{ filteredRows().length }} record{{
          filteredRows().length === 1 ? "" : "s"
        }}
      </p>
    </div>
    @if (loading()) {
      <an-state
        icon="…"
        title="Loading records"
        message="Retrieving the latest workspace data."
      />
    } @else if (error()) {
      <an-state icon="!" title="Records unavailable" [message]="error()"
        ><button class="btn btn-secondary" (click)="load()">
          Try again
        </button></an-state
      >
    } @else if (!filteredRows().length) {
      <an-state
        title="No records found"
        [message]="
          query()
            ? 'Try a different search phrase.'
            : 'Records will appear here as your workspace starts operating.'
        "
      />
    } @else {
      <div class="table-shell workspace-desktop-table overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              @for (column of columns(); track column) {
                <th>{{ columnLabel(column) }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of filteredRows(); track row["id"] ?? $index) {
              <tr>
                @for (column of columns(); track column) {
                  <td [class.font-semibold]="$first" [class.text-ink]="$first">
                    @if ($first && config.detailRoute && row["id"]) {
                      <a
                        [routerLink]="[config.detailRoute, row['id']]"
                        class="font-semibold text-brand"
                        [title]="cellTitle(row, column)"
                        >{{ cellValue(row, column) }}</a
                      >
                    } @else {
                      <span
                        [class]="
                          column === 'status' ? statusClass(row[column]) : ''
                        "
                        [title]="cellTitle(row, column)"
                        >{{ cellValue(row, column) }}</span
                      >
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="workspace-mobile-records">
        @for (row of filteredRows(); track row["id"] ?? $index) {
          @if (config.detailRoute && row["id"]) {
            <a
              [routerLink]="[config.detailRoute, row['id']]"
              class="workspace-mobile-record"
            >
              @for (column of columns(); track column) {
                <span class="workspace-mobile-record__row">
                  <span>{{ columnLabel(column) }}</span>
                  <strong
                    [class]="
                      column === 'status' ? statusClass(row[column]) : ''
                    "
                  >
                    <span [title]="cellTitle(row, column)">{{
                      cellValue(row, column)
                    }}</span>
                  </strong>
                </span>
              }
            </a>
          } @else {
            <article class="workspace-mobile-record">
              @for (column of columns(); track column) {
                <span class="workspace-mobile-record__row">
                  <span>{{ columnLabel(column) }}</span>
                  <strong
                    [class]="
                      column === 'status' ? statusClass(row[column]) : ''
                    "
                  >
                    <span [title]="cellTitle(row, column)">{{
                      cellValue(row, column)
                    }}</span>
                  </strong>
                </span>
              }
            </article>
          }
        }
      </div>
    }
  `,
})
export class ResourceListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly references = inject(WorkspaceReferenceLabelService);
  readonly session = inject(SessionState);
  readonly rows = signal<ApiRecord[]>([]);
  readonly loading = signal(true);
  readonly error = signal("");
  readonly query = signal("");
  readonly config = this.route.snapshot.data as ResourceConfig;
  readonly filteredRows = computed(() => {
    const needle = this.query().trim().toLowerCase();
    return needle
      ? this.rows().filter((row) =>
          this.references.searchText(row).includes(needle),
        )
      : this.rows();
  });
  readonly columns = computed(() => {
    const first = this.rows()[0];
    if (!first) return [];
    const primary: Record<string, string[]> = {
      clients: ["client_id"],
      accounts: ["acc_no"],
      transactions: ["tr_no"],
      "money-orders": ["order_no", "orderNo"],
      "money-order-tracking-rounds": ["name", "start_number"],
      branches: ["name", "code"],
      "cash-desks": ["name", "code"],
      partners: ["name", "code"],
      currencies: ["code", "name"],
      admins: ["first_name", "username"],
      "organization/audit": ["action"],
    };
    const preferred = [
      ...(primary[this.config.endpoint] ?? []),
      "tr_no",
      "order_no",
      "orderNo",
      "name",
      "first_name",
      "code",
      "acc_no",
      "email",
      "phone",
      "currency",
      "amount",
      "status",
      "created_at",
      "createdAt",
      "client_id",
    ];
    const keys = Object.keys(first).filter(
      (key) =>
        ![
          "password",
          "passwordSalt",
          "password_salt",
          "workspaceId",
          "workspace_id",
          "id",
        ].includes(key) && typeof first[key] !== "object",
    );
    return [
      ...new Set([...preferred.filter((key) => keys.includes(key)), ...keys]),
    ].slice(0, 7);
  });
  ngOnInit(): void {
    void this.load();
  }
  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set("");
    try {
      const response = await firstValueFrom(
        this.api.get<ApiRecord[] | Paginated<ApiRecord> | ApiRecord>(
          this.config.endpoint,
          { page: 1, perPage: 100 },
        ),
      );
      const rows = ApiService.rows(response);
      this.rows.set(rows);
      await this.references.prepare(this.columns(), rows);
    } catch (error) {
      this.error.set(ApiService.errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
  cellValue(row: ApiRecord, column: string): string {
    return this.references.display(column, row[column], row);
  }
  cellTitle(row: ApiRecord, column: string): string {
    return this.references.tooltip(column, row[column], row);
  }
  columnLabel(column: string): string {
    return this.references.columnLabel(column);
  }
  statusClass(value: unknown): string {
    const status = String(value ?? "").toLowerCase();
    return status.includes("active") ||
      status.includes("paid") ||
      status.includes("posted")
      ? "pill border-emerald-200 bg-emerald-50 text-brand"
      : status.includes("pending") ||
          status.includes("transit") ||
          status.includes("trial")
        ? "pill border-amber-200 bg-amber-50 text-amber-800"
        : "pill border-slate-200 bg-slate-50 text-slate-700";
  }
}
