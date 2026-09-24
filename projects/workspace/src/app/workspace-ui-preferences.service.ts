import { Injectable, signal } from "@angular/core";
import { WorkspaceDensity } from "./workspace-ui.models";

const SIDEBAR_KEY = "arz-neshan.workspace.sidebar-expanded";
const DENSITY_KEY = "arz-neshan.workspace.density";

@Injectable({ providedIn: "root" })
export class WorkspaceUiPreferencesService {
  private readonly sidebarState = signal(this.readSidebar());
  private readonly densityState = signal<WorkspaceDensity>(this.readDensity());

  readonly sidebarExpanded = this.sidebarState.asReadonly();
  readonly density = this.densityState.asReadonly();

  toggleSidebar(): void {
    this.setSidebarExpanded(!this.sidebarState());
  }

  setSidebarExpanded(expanded: boolean): void {
    this.sidebarState.set(expanded);
    this.write(SIDEBAR_KEY, String(expanded));
  }

  setDensity(density: WorkspaceDensity): void {
    this.densityState.set(density);
    this.write(DENSITY_KEY, density);
  }

  private readSidebar(): boolean {
    if (typeof localStorage === "undefined") return true;
    return localStorage.getItem(SIDEBAR_KEY) !== "false";
  }

  private readDensity(): WorkspaceDensity {
    if (typeof localStorage === "undefined") return "balanced";
    return localStorage.getItem(DENSITY_KEY) === "compact"
      ? "compact"
      : "balanced";
  }

  private write(key: string, value: string): void {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
  }
}
