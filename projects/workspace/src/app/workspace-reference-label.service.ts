import { Injectable, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { ApiService } from "@shared/core/api.service";
import { displayValue, humanize } from "@shared/core/format";
import { ApiRecord, Paginated } from "@shared/core/models";
import { SessionState } from "@shared/core/session.state";

type ReferenceKind =
  | "account"
  | "admin"
  | "branch"
  | "cashDesk"
  | "client"
  | "currency"
  | "moneyOrder"
  | "partner"
  | "trackingRound"
  | "transaction";

interface ReferenceSource {
  endpoint: string;
  permission: string;
}

interface PaginationMeta {
  current_page?: number;
  page?: number;
  per_page?: number;
  perPage?: number;
  total?: number;
  last_page?: number;
  lastPage?: number;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SOURCES: Record<ReferenceKind, ReferenceSource> = {
  account: { endpoint: "accounts", permission: "accounts.read" },
  admin: { endpoint: "admins", permission: "admins.manage" },
  branch: { endpoint: "branches", permission: "branches.read" },
  cashDesk: { endpoint: "cash-desks", permission: "cash_desks.read" },
  client: { endpoint: "clients", permission: "clients.read" },
  currency: { endpoint: "currencies", permission: "currencies.read" },
  moneyOrder: {
    endpoint: "money-orders",
    permission: "money_orders.read",
  },
  partner: { endpoint: "partners", permission: "partners.read" },
  trackingRound: {
    endpoint: "money-order-tracking-rounds",
    permission: "money_orders.read",
  },
  transaction: {
    endpoint: "transactions",
    permission: "transactions.read",
  },
};

const COLUMN_KINDS: Record<string, ReferenceKind> = {
  account_id: "account",
  accountId: "account",
  admin_id: "admin",
  adminId: "admin",
  actor_id: "admin",
  actorId: "admin",
  branch_id: "branch",
  branchId: "branch",
  operational_branch_id: "branch",
  operationalBranchId: "branch",
  cash_desk_id: "cashDesk",
  cashDeskId: "cashDesk",
  client_id: "client",
  clientId: "client",
  sender_client_id: "client",
  senderClientId: "client",
  beneficiary_client_id: "client",
  beneficiaryClientId: "client",
  from_client_id: "client",
  fromClientId: "client",
  to_client_id: "client",
  toClientId: "client",
  currency_id: "currency",
  currencyId: "currency",
  from_currency_id: "currency",
  fromCurrencyId: "currency",
  to_currency_id: "currency",
  toCurrencyId: "currency",
  money_order_id: "moneyOrder",
  moneyOrderId: "moneyOrder",
  partner_id: "partner",
  partnerId: "partner",
  tracking_round_id: "trackingRound",
  trackingRoundId: "trackingRound",
  transaction_id: "transaction",
  transactionId: "transaction",
  funding_transaction_id: "transaction",
  fundingTransactionId: "transaction",
  payout_transaction_id: "transaction",
  payoutTransactionId: "transaction",
  reverses_transaction_id: "transaction",
  reversesTransactionId: "transaction",
  created_by_admin_id: "admin",
  createdByAdminId: "admin",
  reviewed_by_admin_id: "admin",
  reviewedByAdminId: "admin",
  uploaded_by_admin_id: "admin",
  uploadedByAdminId: "admin",
};

@Injectable({ providedIn: "root" })
export class WorkspaceReferenceLabelService {
  private readonly api = inject(ApiService);
  private readonly session = inject(SessionState);
  private readonly labelMaps = signal(
    new Map<ReferenceKind, ReadonlyMap<string, string>>(),
  );
  private readonly revision = signal(0);
  private readonly loaded = new Set<ReferenceKind>();
  private readonly loading = new Map<ReferenceKind, Promise<void>>();

  async prepare(columns: string[], rows: ApiRecord[] = []): Promise<void> {
    const kinds = new Set<ReferenceKind>();
    for (const column of columns) {
      const kind = this.kindForColumn(column);
      if (
        kind &&
        rows.some(
          (row) =>
            this.isUuid(row[column]) &&
            !this.companionLabel(column, kind, row) &&
            !this.labelMaps().get(kind)?.has(String(row[column])),
        )
      ) {
        kinds.add(kind);
      }
      if (["resource_id", "resourceId"].includes(column)) {
        for (const row of rows) {
          const resourceKind = this.kindForResource(row);
          if (resourceKind && this.isUuid(row[column])) kinds.add(resourceKind);
        }
      }
    }
    await Promise.all([...kinds].map((kind) => this.load(kind)));
  }

  register(kind: ReferenceKind, rows: ApiRecord[]): void {
    const map = new Map(this.labelMaps().get(kind) ?? []);
    for (const row of rows) {
      const id = String(row["id"] ?? "");
      const label = this.recordLabel(kind, row);
      if (id && label) map.set(id, label);
    }
    const all = new Map(this.labelMaps());
    all.set(kind, map);
    this.labelMaps.set(all);
  }

  display(column: string, value: unknown, row: ApiRecord = {}): string {
    this.revision();
    if (value === null || value === undefined || value === "") return "—";

    const kind =
      this.kindForColumn(column) ??
      (["resource_id", "resourceId"].includes(column)
        ? this.kindForResource(row)
        : undefined);
    if (!kind) return displayValue(value);

    const companion = this.companionLabel(column, kind, row);
    if (companion) return companion;

    const id = String(value);
    const resolved = this.labelMaps().get(kind)?.get(id);
    if (resolved) return resolved;
    const currentAdmin = this.session.context()?.user;
    if (kind === "admin" && currentAdmin?.id === id) {
      return this.recordLabel("admin", currentAdmin as unknown as ApiRecord);
    }
    if (!this.isUuid(value)) return displayValue(value);
    if (this.loading.has(kind)) return "Loading reference…";
    return `ID …${id.slice(-8)}`;
  }

  tooltip(column: string, value: unknown, row: ApiRecord = {}): string {
    if (!this.isUuid(value)) return "";
    const shown = this.display(column, value, row);
    return shown.startsWith("ID …")
      ? String(value)
      : `${shown} — ${String(value)}`;
  }

  columnLabel(column: string): string {
    const labels: Record<string, string> = {
      actor_id: "Actor",
      actorId: "Actor",
      created_by_admin_id: "Created by",
      createdByAdminId: "Created by",
      reviewed_by_admin_id: "Reviewed by",
      reviewedByAdminId: "Reviewed by",
      uploaded_by_admin_id: "Uploaded by",
      uploadedByAdminId: "Uploaded by",
      operational_branch_id: "Operational branch",
      operationalBranchId: "Operational branch",
      sender_client_id: "Sender customer",
      senderClientId: "Sender customer",
      beneficiary_client_id: "Beneficiary customer",
      beneficiaryClientId: "Beneficiary customer",
      from_client_id: "From customer",
      fromClientId: "From customer",
      to_client_id: "To customer",
      toClientId: "To customer",
      from_currency_id: "From currency",
      fromCurrencyId: "From currency",
      to_currency_id: "To currency",
      toCurrencyId: "To currency",
      resource_id: "Record",
      resourceId: "Record",
    };
    if (labels[column]) return labels[column];
    return humanize(column.replace(/_id$/, "").replace(/Id$/, ""));
  }

  searchText(row: ApiRecord): string {
    return Object.entries(row)
      .flatMap(([column, value]) => [value, this.display(column, value, row)])
      .map((value) => String(value ?? "").toLowerCase())
      .join(" ");
  }

  private async load(kind: ReferenceKind): Promise<void> {
    if (this.loaded.has(kind)) return;
    const active = this.loading.get(kind);
    if (active) return active;
    if (!this.session.can(SOURCES[kind].permission)) {
      this.loaded.add(kind);
      return;
    }

    const task = this.loadAll(SOURCES[kind].endpoint)
      .then((rows) => this.register(kind, rows))
      .catch(() => undefined)
      .then(() => {
        this.loaded.add(kind);
        this.loading.delete(kind);
        this.revision.update((value) => value + 1);
      });
    this.loading.set(kind, task);
    this.revision.update((value) => value + 1);
    return task;
  }

  private async loadAll(endpoint: string): Promise<ApiRecord[]> {
    const perPage = 100;
    const first = await firstValueFrom(
      this.api.get<ApiRecord[] | Paginated<ApiRecord>>(endpoint, {
        page: 1,
        perPage,
      }),
    );
    const rows = ApiService.rows(first);
    if (Array.isArray(first)) return rows;

    const meta = (first.meta ?? {}) as PaginationMeta;
    const lastPage =
      meta.last_page ??
      meta.lastPage ??
      Math.ceil(
        (meta.total ?? rows.length) /
          (meta.per_page ?? meta.perPage ?? perPage),
      );
    if (lastPage <= 1) return rows;

    const remaining = await Promise.all(
      Array.from({ length: lastPage - 1 }, (_, index) =>
        firstValueFrom(
          this.api.get<ApiRecord[] | Paginated<ApiRecord>>(endpoint, {
            page: index + 2,
            perPage,
          }),
        ),
      ),
    );
    return [
      ...rows,
      ...remaining.flatMap((response) => ApiService.rows(response)),
    ];
  }

  private kindForColumn(column: string): ReferenceKind | undefined {
    return COLUMN_KINDS[column];
  }

  private kindForResource(row: ApiRecord): ReferenceKind | undefined {
    const type = String(row["resource_type"] ?? row["resourceType"] ?? "")
      .toLowerCase()
      .replace(/[\s_-]/g, "");
    if (type.includes("cashdesk")) return "cashDesk";
    if (type.includes("trackinground")) return "trackingRound";
    if (type.includes("moneyorder")) return "moneyOrder";
    if (type.includes("transaction")) return "transaction";
    if (type.includes("currency")) return "currency";
    if (type.includes("account")) return "account";
    if (type.includes("client") || type.includes("customer")) return "client";
    if (type.includes("branch")) return "branch";
    if (type.includes("partner")) return "partner";
    if (type.includes("admin")) return "admin";
    return undefined;
  }

  private companionLabel(
    column: string,
    kind: ReferenceKind,
    row: ApiRecord,
  ): string {
    const base = column.replace(/_id$/, "").replace(/Id$/, "");
    const snakeBase = base.replace(
      /[A-Z]/g,
      (letter) => `_${letter.toLowerCase()}`,
    );
    const nested = row[base] ?? row[snakeBase];
    if (nested && typeof nested === "object") {
      const label = this.recordLabel(kind, nested as ApiRecord);
      if (label) return label;
    }

    const candidates = [
      `${snakeBase}_label`,
      `${snakeBase}_name`,
      `${snakeBase}_code`,
      `${base}Label`,
      `${base}Name`,
      `${base}Code`,
      ...(kind === "currency" ? ["currency_code", "currencyCode"] : []),
      ...(kind === "account" ? ["account_no", "accountNo", "acc_no"] : []),
      ...(kind === "transaction"
        ? ["transaction_no", "transactionNo", "tr_no"]
        : []),
      ...(kind === "moneyOrder" ? ["order_no", "orderNo"] : []),
    ];
    for (const key of candidates) {
      const value = row[key];
      if (value !== null && value !== undefined && value !== "") {
        return displayValue(value);
      }
    }
    return "";
  }

  private recordLabel(kind: ReferenceKind, row: ApiRecord): string {
    const join = (...values: unknown[]) =>
      [
        ...new Set(
          values.map((value) => String(value ?? "").trim()).filter(Boolean),
        ),
      ].join(" · ");
    switch (kind) {
      case "account":
        return join(row["acc_no"] ?? row["account_no"], row["name"]);
      case "admin":
        return join(
          join(row["first_name"], row["last_name"]),
          row["username"] ?? row["email"],
        );
      case "client":
        return join(
          join(row["first_name"], row["last_name"]),
          row["client_id"],
        );
      case "currency":
        return join(row["code"], row["name"]);
      case "transaction":
        return join(row["tr_no"] ?? row["transaction_no"], row["description"]);
      case "moneyOrder":
        return join(row["order_no"] ?? row["orderNo"], row["beneficiary_name"]);
      case "trackingRound":
        return join(row["name"], row["start_number"], row["end_number"]);
      default:
        return join(row["name"], row["code"]);
    }
  }

  private isUuid(value: unknown): boolean {
    return UUID_PATTERN.test(String(value ?? ""));
  }
}
