import { Routes } from "@angular/router";
import { platformGuard } from "@shared/core/auth.guards";
import { PlatformLayoutComponent } from "./platform-layout.component";
import {
  PlatformLoginComponent,
  PlatformDashboardComponent,
  PlatformResourceComponent,
  PlansComponent,
  SystemHealthComponent,
  WorkspaceDetailComponent,
} from "./platform-pages";
import { PlatformUsersComponent } from "./platform-users.component";

export const routes: Routes = [
  {
    path: "login",
    component: PlatformLoginComponent,
    title: "Platform sign in — Arz Neshan",
  },
  {
    path: "",
    component: PlatformLayoutComponent,
    canActivate: [platformGuard],
    canActivateChild: [platformGuard],
    children: [
      {
        path: "",
        component: PlatformDashboardComponent,
        title: "Platform overview — Arz Neshan",
      },
      {
        path: "workspaces",
        component: PlatformResourceComponent,
        data: {
          title: "Workspaces",
          eyebrow: "Organizations",
          description: "Registered organizations and their operational status.",
          endpoint: "platform/workspaces",
          linkBase: "/workspaces",
        },
        title: "Workspaces — Arz Neshan",
      },
      {
        path: "users",
        component: PlatformUsersComponent,
        title: "Platform operators — Arz Neshan",
      },
      {
        path: "workspaces/:id",
        component: WorkspaceDetailComponent,
        title: "Workspace detail — Arz Neshan",
      },
      { path: "plans", component: PlansComponent, title: "Plans — Arz Neshan" },
      {
        path: "payments",
        component: PlatformResourceComponent,
        data: {
          title: "Payments",
          eyebrow: "Commerce",
          description: "Recent subscription checkout and payment records.",
          endpoint: "platform/payments",
        },
        title: "Payments — Arz Neshan",
      },
      {
        path: "audit",
        component: PlatformResourceComponent,
        data: {
          title: "Platform audit",
          eyebrow: "Control plane",
          description:
            "Administrator actions affecting plans, workspaces, and subscriptions.",
          endpoint: "platform/audit",
        },
        title: "Platform audit — Arz Neshan",
      },
      {
        path: "health",
        component: SystemHealthComponent,
        title: "System health — Arz Neshan",
      },
    ],
  },
  { path: "**", redirectTo: "" },
];
