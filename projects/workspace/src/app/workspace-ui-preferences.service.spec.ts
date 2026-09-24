import { TestBed } from "@angular/core/testing";
import { WorkspaceUiPreferencesService } from "./workspace-ui-preferences.service";

describe("WorkspaceUiPreferencesService", () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it("uses expanded and balanced defaults", () => {
    const service = TestBed.inject(WorkspaceUiPreferencesService);
    expect(service.sidebarExpanded()).toBe(true);
    expect(service.density()).toBe("balanced");
  });

  it("restores valid device preferences", () => {
    localStorage.setItem("arz-neshan.workspace.sidebar-expanded", "false");
    localStorage.setItem("arz-neshan.workspace.density", "compact");
    const service = TestBed.inject(WorkspaceUiPreferencesService);
    expect(service.sidebarExpanded()).toBe(false);
    expect(service.density()).toBe("compact");
  });
});
