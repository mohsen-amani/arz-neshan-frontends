import { ChangeDetectionStrategy, Component, input } from "@angular/core";

@Component({
  selector: "an-state",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="card flex min-h-44 flex-col items-center justify-center px-6 py-10 text-center"
      role="status"
    >
      <div
        class="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-xl text-brand"
      >
        {{ icon() }}
      </div>
      <h2 class="mb-1 text-base font-bold text-ink">{{ title() }}</h2>
      <p class="muted mb-0 max-w-md">{{ message() }}</p>
      <div class="mt-4"><ng-content /></div>
    </div>
  `,
})
export class StateComponent {
  readonly icon = input("◇");
  readonly title = input.required<string>();
  readonly message = input("");
}
