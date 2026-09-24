import { ChangeDetectionStrategy, Component, input } from "@angular/core";

@Component({
  selector: "an-brand",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="inline-flex items-center gap-3 no-underline" [attr.href]="href()">
      <img
        src="/brand/arz-neshan-mark.svg"
        alt=""
        class="h-10 w-10 rounded-xl ring-1 ring-black/5"
      />
      <span>
        <strong
          class="block text-base leading-none"
          [class.text-white]="inverse()"
          [class.text-ink]="!inverse()"
          >Arz Neshan</strong
        >
        @if (showTagline()) {
          <span
            class="mt-1 block text-[10px] font-semibold tracking-[.13em] uppercase"
            [class.text-slate-400]="inverse()"
            [class.text-muted]="!inverse()"
            >Financial operations</span
          >
        }
      </span>
    </a>
  `,
})
export class BrandComponent {
  readonly href = input("/");
  readonly showTagline = input(true);
  readonly inverse = input(false);
}
