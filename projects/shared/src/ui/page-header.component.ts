import { ChangeDetectionStrategy, Component, input } from "@angular/core";

@Component({
  selector: "an-page-header",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        @if (eyebrow()) {
          <p class="eyebrow mb-2">{{ eyebrow() }}</p>
        }
        <h1 class="page-title mb-1">{{ title() }}</h1>
        @if (description()) {
          <p class="muted mb-0 max-w-3xl">{{ description() }}</p>
        }
      </div>
      <div class="flex shrink-0 flex-wrap gap-2"><ng-content /></div>
    </header>
  `,
})
export class PageHeaderComponent {
  readonly eyebrow = input("");
  readonly title = input.required<string>();
  readonly description = input("");
}
