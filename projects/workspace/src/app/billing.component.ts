import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import { firstValueFrom } from "rxjs";
import { ApiService } from "@shared/core/api.service";
import { ApiRecord } from "@shared/core/models";
import { PageHeaderComponent } from "@shared/ui/page-header.component";
import { displayValue } from "@shared/core/format";

@Component({
  imports: [PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "workspace-page workspace-billing-page" },
  template: `<an-page-header
      eyebrow="Subscription"
      title="Billing and plan"
      description="Review workspace access and choose a renewal term."
    />
    @if (error()) {
      <p
        class="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      >
        {{ error() }}
      </p>
    }
    <section class="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <article class="card p-6">
        <p class="eyebrow">Current access</p>
        <h2 class="mt-3 text-2xl font-bold">
          {{ display(subscription()?.["status"] ?? "Loading") }}
        </h2>
        <span class="pill mt-2 border-emerald-200 bg-emerald-50 text-brand">{{
          display(subscription()?.["access_mode"])
        }}</span>
        <dl class="mt-6 space-y-3 text-sm">
          <div class="flex justify-between gap-4 border-b border-line pb-3">
            <dt class="text-muted">Billing interval</dt>
            <dd class="font-semibold">
              {{ display(subscription()?.["billingInterval"]) }}
            </dd>
          </div>
          <div class="flex justify-between gap-4 border-b border-line pb-3">
            <dt class="text-muted">Trial ends</dt>
            <dd class="font-semibold">
              {{ display(subscription()?.["trialEndsAt"]) }}
            </dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-muted">Current period ends</dt>
            <dd class="font-semibold">
              {{ display(subscription()?.["currentPeriodEndsAt"]) }}
            </dd>
          </div>
        </dl>
      </article>
      <div class="grid gap-4">
        @for (plan of plans(); track plan["version_id"]) {
          <article class="card p-6">
            <div class="flex flex-col justify-between gap-5 sm:flex-row">
              <div>
                <p class="eyebrow">{{ plan["code"] }}</p>
                <h2 class="mt-2 text-xl font-bold">{{ plan["name"] }}</h2>
                <p class="muted mb-0 mt-2 max-w-xl">
                  {{
                    plan["description"] ||
                      "Complete Arz Neshan workspace access."
                  }}
                </p>
              </div>
              <div class="flex shrink-0 flex-col gap-2">
                <button
                  class="btn btn-primary"
                  (click)="checkout(plan, 'annual')"
                  [disabled]="busy()"
                >
                  Annual · {{ display(plan["annual_price"]) }}
                  {{ plan["currency"] }}</button
                ><button
                  class="btn btn-secondary"
                  (click)="checkout(plan, 'quarterly')"
                  [disabled]="busy()"
                >
                  Quarterly · {{ display(plan["quarterly_price"]) }}
                  {{ plan["currency"] }}
                </button>
              </div>
            </div>
          </article>
        } @empty {
          <article class="card p-6 text-sm text-muted">
            No published renewal plan is currently available.
          </article>
        }
      </div>
    </section>`,
})
export class BillingComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly subscription = signal<ApiRecord | null>(null);
  readonly plans = signal<ApiRecord[]>([]);
  readonly busy = signal(false);
  readonly error = signal("");
  readonly display = displayValue;
  ngOnInit(): void {
    void this.load();
  }
  async load(): Promise<void> {
    try {
      const [subscription, plans] = await Promise.all([
        firstValueFrom(this.api.get<ApiRecord | null>("billing/subscription")),
        firstValueFrom(this.api.get<ApiRecord[]>("billing/plans")),
      ]);
      this.subscription.set(subscription);
      this.plans.set(plans);
    } catch (error) {
      this.error.set(ApiService.errorMessage(error));
    }
  }
  async checkout(
    plan: ApiRecord,
    interval: "quarterly" | "annual",
  ): Promise<void> {
    this.busy.set(true);
    this.error.set("");
    try {
      const result = await firstValueFrom(
        this.api.post<ApiRecord>(
          "billing/checkout",
          { plan_version_id: plan["version_id"], billing_interval: interval },
          crypto.randomUUID(),
        ),
      );
      const url = result["checkoutUrl"];
      if (typeof url === "string" && url) window.location.assign(url);
      else await this.load();
    } catch (error) {
      this.error.set(ApiService.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
