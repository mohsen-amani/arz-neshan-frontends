import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { ApiService } from "@shared/core/api.service";
import { displayValue, formatMoney } from "@shared/core/format";
import { ApiRecord, Paginated } from "@shared/core/models";
import { SessionState } from "@shared/core/session.state";
import { PageHeaderComponent } from "@shared/ui/page-header.component";
import { StateComponent } from "@shared/ui/state.component";
import { WorkspaceReferenceLabelService } from "./workspace-reference-label.service";

@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageHeaderComponent,
    StateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "workspace-page workspace-detail-page" },
  template: `
    @if (loading()) {
      <an-state
        icon="…"
        title="Loading customer"
        message="Retrieving the customer profile and permitted financial records."
      />
    } @else if (error()) {
      <an-state icon="!" title="Customer unavailable" [message]="error()">
        <button class="btn btn-secondary" (click)="load()">Try again</button>
      </an-state>
    } @else if (client(); as record) {
      <an-page-header
        eyebrow="Customer record"
        [title]="customerName()"
        [description]="'Customer ' + display(record['client_id'])"
      >
        <a routerLink="/clients" class="btn btn-secondary">All customers</a>
        @if (session.can("clients.write")) {
          <a
            [routerLink]="['/clients', record['id'], 'edit']"
            class="btn btn-secondary"
            >Edit profile</a
          >
        }
        @if (session.can("fund_flows.create")) {
          <a routerLink="/operations/deposit" class="btn btn-primary"
            >Record deposit</a
          >
        }
      </an-page-header>
      @if (relatedNotice()) {
        <p
          class="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
          role="status"
        >
          {{ relatedNotice() }}
        </p>
      }

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        @for (item of profileFields; track item.key) {
          <article class="card p-5">
            <p
              class="mb-1 text-xs font-bold tracking-wide text-muted uppercase"
            >
              {{ item.label }}
            </p>
            <p
              class="mb-0 break-words text-sm font-semibold text-ink"
              [title]="profileTitle(record, item.key)"
            >
              {{ profileValue(record, item.key) }}
            </p>
          </article>
        }
      </section>

      @if (session.can("accounts.read")) {
        <section class="mt-6">
          <div class="mb-3 flex items-end justify-between gap-4">
            <div>
              <p class="eyebrow mb-1">Financial position</p>
              <h2 class="mb-0 text-xl font-bold">Accounts</h2>
            </div>
            <span class="text-sm text-muted"
              >{{ totals().accounts }} total</span
            >
          </div>
          @if (accounts().length) {
            <div class="table-shell overflow-x-auto">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Name</th>
                    <th>Currency</th>
                    <th class="text-right">Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (account of accounts(); track account["id"]) {
                    <tr>
                      <td>
                        <a
                          class="font-semibold text-brand"
                          [routerLink]="['/accounts', account['id']]"
                          >{{ display(account["acc_no"]) }}</a
                        >
                      </td>
                      <td>{{ display(account["name"]) }}</td>
                      <td>{{ currencyCode(account) }}</td>
                      <td class="text-right font-mono font-semibold">
                        {{ money(account["balance"], currencyCode(account)) }}
                      </td>
                      <td>{{ display(account["status"]) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <an-state
              title="No customer accounts"
              message="Create an account before posting account-based operations."
            />
          }
        </section>
      }

      <section class="mt-6 grid gap-6 xl:grid-cols-2">
        @if (session.can("transactions.read")) {
          <article class="card overflow-hidden">
            <div
              class="flex items-end justify-between border-b border-line px-5 py-4"
            >
              <div>
                <p class="eyebrow mb-1">Ledger activity</p>
                <h2 class="mb-0 text-lg font-bold">Recent transactions</h2>
              </div>
              <span class="text-sm text-muted"
                >{{ totals().transactions }} total</span
              >
            </div>
            @if (transactions().length) {
              <div class="divide-y divide-line">
                @for (transaction of transactions(); track transaction["id"]) {
                  <a
                    [routerLink]="['/transactions', transaction['id']]"
                    class="flex items-center justify-between gap-4 px-5 py-4 no-underline hover:bg-slate-50"
                  >
                    <div>
                      <p class="mb-1 text-sm font-bold text-ink">
                        {{ display(transaction["tr_no"]) }}
                      </p>
                      <p class="mb-0 text-xs text-muted">
                        {{ display(transaction["description"]) }} ·
                        {{ display(transaction["created_at"]) }}
                      </p>
                    </div>
                    <span class="pill border-slate-200 text-slate-700">{{
                      display(transaction["type"])
                    }}</span>
                  </a>
                }
              </div>
            } @else {
              <p class="m-0 p-6 text-sm text-muted">No transactions yet.</p>
            }
          </article>
        }

        @if (session.can("money_orders.read")) {
          <article class="card overflow-hidden">
            <div
              class="flex items-end justify-between border-b border-line px-5 py-4"
            >
              <div>
                <p class="eyebrow mb-1">Settlement</p>
                <h2 class="mb-0 text-lg font-bold">Recent money orders</h2>
              </div>
              <span class="text-sm text-muted"
                >{{ totals().moneyOrders }} total</span
              >
            </div>
            @if (orders().length) {
              <div class="divide-y divide-line">
                @for (order of orders(); track order["id"]) {
                  <a
                    [routerLink]="['/money-orders', order['id']]"
                    class="flex items-center justify-between gap-4 px-5 py-4 no-underline hover:bg-slate-50"
                  >
                    <div>
                      <p class="mb-1 text-sm font-bold text-ink">
                        {{ display(order["order_no"]) }}
                      </p>
                      <p class="mb-0 text-xs text-muted">
                        {{ display(order["client_role"]) }} ·
                        {{ money(order["amount"], orderCurrency(order)) }}
                      </p>
                    </div>
                    <span
                      class="pill border-emerald-200 bg-emerald-50 text-brand"
                      >{{ display(order["status"]) }}</span
                    >
                  </a>
                }
              </div>
            } @else {
              <p class="m-0 p-6 text-sm text-muted">No money orders yet.</p>
            }
          </article>
        }
      </section>

      @if (session.can("attachments.read")) {
        <section class="mt-6 card overflow-hidden">
          <div
            class="flex items-end justify-between border-b border-line px-5 py-4"
          >
            <div>
              <p class="eyebrow mb-1">KYC and records</p>
              <h2 class="mb-0 text-lg font-bold">Documents</h2>
            </div>
            <span class="text-sm text-muted"
              >{{ totals().documents }} total</span
            >
            @if (session.can("attachments.write")) {
              <button
                class="btn btn-secondary"
                (click)="showUpload.set(!showUpload())"
              >
                {{ showUpload() ? "Cancel upload" : "Add document" }}
              </button>
            }
          </div>
          @if (documentNotice()) {
            <p
              class="m-0 border-b border-line bg-slate-50 px-5 py-3 text-sm text-slate-700"
              role="status"
            >
              {{ documentNotice() }}
            </p>
          }
          @if (showUpload() && session.can("attachments.write")) {
            <form
              class="grid gap-4 border-b border-line bg-slate-50 p-5 sm:grid-cols-2"
              [formGroup]="uploadForm"
              (ngSubmit)="uploadDocument()"
            >
              <div>
                <label class="label" for="customer-document">File</label>
                <input
                  class="input pt-2"
                  id="customer-document"
                  type="file"
                  (change)="selectFile($event)"
                />
                <p class="mt-1 text-xs text-muted">
                  Maximum 10 MB. Files are scanned and stored by the configured
                  secure attachment backend.
                </p>
              </div>
              <div>
                <label class="label" for="document-type">Document type</label>
                <select
                  class="input"
                  id="document-type"
                  formControlName="documentType"
                >
                  <option value="general">General</option>
                  <option value="id_card">Identity card</option>
                  <option value="passport">Passport</option>
                  <option value="receiver_photo">Customer photo</option>
                  <option value="signature">Signature</option>
                </select>
              </div>
              <div class="sm:col-span-2">
                <label class="label" for="document-reason"
                  >Reason or note</label
                >
                <input
                  class="input"
                  id="document-reason"
                  formControlName="reason"
                  maxlength="500"
                />
              </div>
              <label class="flex items-center gap-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  formControlName="sensitive"
                  class="accent-emerald-700"
                />
                Sensitive document
              </label>
              <label class="flex items-center gap-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  formControlName="clientVisible"
                  class="accent-emerald-700"
                />
                Visible in customer portal
              </label>
              <div class="flex justify-end sm:col-span-2">
                <button
                  class="btn btn-primary min-w-40"
                  [disabled]="uploadBusy() || !selectedFile()"
                >
                  {{ uploadBusy() ? "Uploading…" : "Upload document" }}
                </button>
              </div>
            </form>
          }
          @if (documents().length) {
            <div class="overflow-x-auto">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Type</th>
                    <th>Visibility</th>
                    <th>Review</th>
                    <th>Created</th>
                    <th><span class="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  @for (document of documents(); track document["id"]) {
                    <tr>
                      <td class="font-semibold text-ink">
                        {{ display(document["file_name"]) }}
                      </td>
                      <td>{{ display(document["document_type"]) }}</td>
                      <td>
                        {{
                          document["client_visible"]
                            ? "Customer visible"
                            : "Internal"
                        }}
                      </td>
                      <td>
                        <span [class]="reviewClass(document)">
                          {{ display(document["review_status"] ?? "pending") }}
                        </span>
                      </td>
                      <td>{{ display(document["created_at"]) }}</td>
                      <td>
                        <div class="flex justify-end gap-2">
                          <button
                            class="btn btn-ghost"
                            (click)="downloadDocument(document)"
                            [disabled]="documentBusyId() === document['id']"
                          >
                            Download
                          </button>
                          @if (session.can("attachments.write")) {
                            <button
                              class="btn btn-ghost"
                              (click)="toggleVisibility(document)"
                              [disabled]="documentBusyId() === document['id']"
                            >
                              {{
                                document["client_visible"]
                                  ? "Make internal"
                                  : "Share"
                              }}
                            </button>
                          }
                          @if (
                            session.can("attachments.review") &&
                            document["review_status"] !== "approved"
                          ) {
                            <button
                              class="btn btn-ghost text-brand"
                              (click)="reviewDocument(document, 'approved')"
                              [disabled]="documentBusyId() === document['id']"
                            >
                              Approve
                            </button>
                          }
                          @if (
                            session.can("attachments.review") &&
                            document["review_status"] !== "rejected"
                          ) {
                            <button
                              class="btn btn-ghost text-red-700"
                              (click)="reviewDocument(document, 'rejected')"
                              [disabled]="documentBusyId() === document['id']"
                            >
                              Reject
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <p class="m-0 p-6 text-sm text-muted">
              No documents on this customer record.
            </p>
          }
        </section>
      }
    }
  `,
})
export class ClientDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly references = inject(WorkspaceReferenceLabelService);
  readonly session = inject(SessionState);
  readonly client = signal<ApiRecord | null>(null);
  readonly accounts = signal<ApiRecord[]>([]);
  readonly transactions = signal<ApiRecord[]>([]);
  readonly orders = signal<ApiRecord[]>([]);
  readonly documents = signal<ApiRecord[]>([]);
  readonly totals = signal({
    accounts: 0,
    transactions: 0,
    moneyOrders: 0,
    documents: 0,
  });
  readonly loading = signal(true);
  readonly error = signal("");
  readonly relatedNotice = signal("");
  readonly showUpload = signal(false);
  readonly uploadBusy = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly documentNotice = signal("");
  readonly documentBusyId = signal<unknown>(null);
  readonly uploadForm = this.fb.nonNullable.group({
    documentType: ["general"],
    reason: [""],
    sensitive: [true],
    clientVisible: [false],
  });
  readonly customerName = computed(() => {
    const record = this.client();
    return record
      ? [record["first_name"], record["last_name"]].filter(Boolean).join(" ")
      : "Customer";
  });
  readonly profileFields = [
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "identity_number", label: "Identity number" },
    { key: "passport_number", label: "Passport" },
    { key: "province", label: "Province" },
    { key: "branch_id", label: "Owning branch" },
    { key: "address", label: "Address" },
    { key: "status", label: "Status" },
    { key: "created_at", label: "Customer since" },
  ];
  readonly display = displayValue;
  readonly money = formatMoney;

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set("");
    this.relatedNotice.set("");
    const id = this.route.snapshot.paramMap.get("id");
    if (!id) {
      this.error.set("Customer identifier is missing.");
      this.loading.set(false);
      return;
    }
    try {
      const client = await firstValueFrom(
        this.api.get<ApiRecord>(`clients/${id}`),
      );
      this.client.set(client);
      await this.references.prepare(
        this.profileFields.map((field) => field.key),
        [client],
      );
      const tasks: Promise<void>[] = [];
      if (this.session.can("accounts.read"))
        tasks.push(
          this.loadCollection(
            `clients/${id}/accounts`,
            this.accounts,
            "accounts",
          ),
        );
      if (this.session.can("transactions.read"))
        tasks.push(
          this.loadCollection(
            `clients/${id}/transactions`,
            this.transactions,
            "transactions",
          ),
        );
      if (this.session.can("money_orders.read"))
        tasks.push(
          this.loadCollection(
            `clients/${id}/money-orders`,
            this.orders,
            "moneyOrders",
          ),
        );
      if (this.session.can("attachments.read"))
        tasks.push(
          this.loadCollection(
            `clients/${id}/documents`,
            this.documents,
            "documents",
          ),
        );
      const related = await Promise.allSettled(tasks);
      if (related.some((result) => result.status === "rejected")) {
        this.relatedNotice.set(
          "Some related records are unavailable for this role or subscription plan.",
        );
      }
    } catch (error) {
      this.error.set(ApiService.errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  currencyCode(account: ApiRecord): string {
    const currency = account["currency"] as ApiRecord | undefined;
    return String(currency?.["code"] ?? account["currency_id"] ?? "");
  }

  orderCurrency(order: ApiRecord): string {
    const currency = order["currency"] as ApiRecord | undefined;
    return String(currency?.["code"] ?? order["currency_id"] ?? "");
  }

  profileValue(record: ApiRecord, key: string): string {
    return this.references.display(key, record[key], record);
  }

  profileTitle(record: ApiRecord, key: string): string {
    return this.references.tooltip(key, record[key], record);
  }

  selectFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    if (file && file.size > 10 * 1024 * 1024) {
      this.selectedFile.set(null);
      this.documentNotice.set("The selected file exceeds the 10 MB limit.");
      return;
    }
    this.selectedFile.set(file);
    this.documentNotice.set("");
  }

  async uploadDocument(): Promise<void> {
    const file = this.selectedFile();
    const id = this.client()?.["id"];
    if (!file || !id || this.uploadBusy()) return;
    this.uploadBusy.set(true);
    this.documentNotice.set("");
    const value = this.uploadForm.getRawValue();
    const body = new FormData();
    body.set("file", file);
    body.set("owner_type", "client");
    body.set("owner_id", String(id));
    body.set("document_type", value.documentType);
    body.set("reason", value.reason);
    body.set("is_sensitive", String(value.sensitive));
    body.set("client_visible", String(value.clientVisible));
    try {
      await firstValueFrom(this.api.post("attachments", body));
      await this.loadCollection(
        `clients/${String(id)}/documents`,
        this.documents,
        "documents",
      );
      this.uploadForm.reset({
        documentType: "general",
        reason: "",
        sensitive: true,
        clientVisible: false,
      });
      this.selectedFile.set(null);
      this.showUpload.set(false);
      this.documentNotice.set("Document uploaded successfully.");
    } catch (error) {
      this.documentNotice.set(ApiService.errorMessage(error));
    } finally {
      this.uploadBusy.set(false);
    }
  }

  async downloadDocument(document: ApiRecord): Promise<void> {
    const id = document["id"];
    if (!id || this.documentBusyId()) return;
    this.documentBusyId.set(id);
    this.documentNotice.set("");
    try {
      const blob = await firstValueFrom(
        this.api.download(`attachments/${String(id)}/content`),
      );
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = String(document["file_name"] ?? "document");
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      this.documentNotice.set(ApiService.errorMessage(error));
    } finally {
      this.documentBusyId.set(null);
    }
  }

  async toggleVisibility(document: ApiRecord): Promise<void> {
    const id = document["id"];
    if (!id || this.documentBusyId()) return;
    this.documentBusyId.set(id);
    this.documentNotice.set("");
    try {
      const updated = await firstValueFrom(
        this.api.patch<ApiRecord>(`attachments/${String(id)}/visibility`, {
          client_visible: !document["client_visible"],
        }),
      );
      this.documents.update((documents) =>
        documents.map((item) => (item["id"] === id ? updated : item)),
      );
      this.documentNotice.set("Document visibility updated.");
    } catch (error) {
      this.documentNotice.set(ApiService.errorMessage(error));
    } finally {
      this.documentBusyId.set(null);
    }
  }

  reviewClass(document: ApiRecord): string {
    const status = document["review_status"];
    return status === "approved"
      ? "status-badge status-success"
      : status === "rejected"
        ? "status-badge status-danger"
        : "status-badge status-warning";
  }

  async reviewDocument(
    document: ApiRecord,
    status: "approved" | "rejected",
  ): Promise<void> {
    const id = document["id"];
    if (!id || this.documentBusyId()) return;
    this.documentBusyId.set(id);
    this.documentNotice.set("");
    try {
      const updated = await firstValueFrom(
        this.api.patch<ApiRecord>(`attachments/${String(id)}/review`, {
          status,
        }),
      );
      this.documents.update((documents) =>
        documents.map((item) => (item["id"] === id ? updated : item)),
      );
      this.documentNotice.set(
        status === "approved"
          ? "Document approved."
          : "Document rejected and hidden from the customer portal.",
      );
    } catch (error) {
      this.documentNotice.set(ApiService.errorMessage(error));
    } finally {
      this.documentBusyId.set(null);
    }
  }

  private async loadCollection(
    path: string,
    target: { set(value: ApiRecord[]): void },
    totalKey: "accounts" | "transactions" | "moneyOrders" | "documents",
  ): Promise<void> {
    const response = await firstValueFrom(
      this.api.get<Paginated<ApiRecord>>(path, { page: 1, perPage: 10 }),
    );
    target.set(ApiService.rows(response));
    this.totals.update((totals) => ({
      ...totals,
      [totalKey]: response.meta?.total ?? response.data.length,
    }));
  }
}
