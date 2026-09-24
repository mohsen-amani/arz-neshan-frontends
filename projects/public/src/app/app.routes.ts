import { Routes } from "@angular/router";
import { PublicLayoutComponent } from "./public-layout.component";
import {
  HomePageComponent,
  PricingPageComponent,
  SecurityPageComponent,
  SignInPageComponent,
  SignupPageComponent,
  WorkspaceLookupPageComponent,
} from "./public-pages";

export const routes: Routes = [
  {
    path: "",
    component: PublicLayoutComponent,
    children: [
      {
        path: "",
        component: HomePageComponent,
        title: "Arz Neshan — Financial operations, clearly managed",
      },
      {
        path: "pricing",
        component: PricingPageComponent,
        title: "Pricing — Arz Neshan",
      },
      {
        path: "security",
        component: SecurityPageComponent,
        title: "Security — Arz Neshan",
      },
      {
        path: "sign-in",
        component: SignInPageComponent,
        title: "Sign in — Arz Neshan",
      },
      {
        path: "find-workspace",
        component: WorkspaceLookupPageComponent,
        title: "Find your workspace — Arz Neshan",
      },
      {
        path: "signup",
        component: SignupPageComponent,
        title: "Create a workspace — Arz Neshan",
      },
    ],
  },
  { path: "**", redirectTo: "" },
];
