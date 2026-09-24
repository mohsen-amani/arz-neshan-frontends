import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  afterNextRender,
  output,
} from "@angular/core";

interface TurnstileApi {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ): string;
  remove(widgetId: string): void;
}

@Component({
  selector: "an-turnstile",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="min-h-1" aria-label="Human verification"></div>`,
  host: { class: "block" },
})
export class TurnstileComponent implements OnDestroy {
  readonly tokenChange = output<string>();
  private widgetId?: string;

  constructor() {
    afterNextRender(() => this.initialize());
  }

  ngOnDestroy(): void {
    const api = this.api();
    if (api && this.widgetId) api.remove(this.widgetId);
  }

  private initialize(): void {
    const siteKey = document
      .querySelector<HTMLMetaElement>('meta[name="turnstile-site-key"]')
      ?.content.trim();
    if (!siteKey) {
      this.tokenChange.emit("local-turnstile-token");
      return;
    }
    const render = () => {
      const api = this.api();
      const host = document.querySelector<HTMLElement>(
        "an-turnstile:not([data-rendered])",
      );
      const container = host?.querySelector<HTMLElement>("div");
      if (!api || !host || !container) return;
      host.dataset["rendered"] = "true";
      this.widgetId = api.render(container, {
        sitekey: siteKey,
        callback: (token) => this.tokenChange.emit(token),
        "expired-callback": () => this.tokenChange.emit(""),
        "error-callback": () => this.tokenChange.emit(""),
      });
    };
    if (this.api()) {
      render();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-arz-turnstile]",
    );
    if (existing) {
      existing.addEventListener("load", render, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset["arzTurnstile"] = "true";
    script.addEventListener("load", render, { once: true });
    document.head.appendChild(script);
  }

  private api(): TurnstileApi | undefined {
    return (window as unknown as { turnstile?: TurnstileApi }).turnstile;
  }
}
