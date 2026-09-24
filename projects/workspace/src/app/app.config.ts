import { ApplicationConfig } from "@angular/core";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { provideFrontendCore } from "@shared/core/app.providers";
import { routes } from "./app.routes";
export const appConfig: ApplicationConfig = {
  providers: [
    ...provideFrontendCore(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: "enabled" }),
    ),
  ],
};
