import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { Router, RouterOutlet } from "@angular/router";
import { AppShellComponent } from "@shared/ui/app-shell.component";
import { AuthService } from "@shared/core/auth.service";
import { NavItem } from "@shared/core/models";
import { SessionState } from "@shared/core/session.state";

@Component({
  imports: [RouterOutlet, AppShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<an-app-shell
    productName="Arz Neshan Platform"
    eyebrow="Private control plane"
    [userLabel]="session.platformUser()?.email ?? 'Platform operator'"
    contextLabel="Restricted access"
    [navItems]="nav"
    [owner]="true"
    (signOut)="logout()"
    ><router-outlet
  /></an-app-shell>`,
})
export class PlatformLayoutComponent {
  readonly session = inject(SessionState);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly nav: NavItem[] = [
    { label: "Overview", route: "/", exact: true, section: "Control plane" },
    { label: "Workspaces", route: "/workspaces", section: "Organizations" },
    { label: "Plans & versions", route: "/plans", section: "Commercial" },
    { label: "Payments", route: "/payments", section: "Commercial" },
    { label: "Platform operators", route: "/users", section: "Security" },
    { label: "Audit log", route: "/audit", section: "Security" },
    { label: "System health", route: "/health", section: "Operations" },
  ];
  async logout(): Promise<void> {
    await this.auth.logout("platform");
    await this.router.navigateByUrl("/login");
  }
}
