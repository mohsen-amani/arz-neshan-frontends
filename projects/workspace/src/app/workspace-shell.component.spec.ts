import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { WorkspaceShellComponent } from "./workspace-shell.component";
import { WorkspaceUiPreferencesService } from "./workspace-ui-preferences.service";

describe("WorkspaceShellComponent", () => {
  beforeEach(() => localStorage.clear());

  it("filters navigation and create actions by permission", async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceShellComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(WorkspaceShellComponent);
    fixture.componentRef.setInput("productName", "Example Exchange");
    fixture.componentRef.setInput("permissions", ["clients.read"]);
    fixture.componentRef.setInput("navGroups", [
      {
        label: "Workspace",
        icon: "home",
        items: [
          { label: "Overview", route: "/", icon: "home", exact: true },
          {
            label: "Customers",
            route: "/clients",
            icon: "users",
            permission: "clients.read",
          },
          {
            label: "Accounts",
            route: "/accounts",
            icon: "wallet",
            permission: "accounts.read",
          },
        ],
      },
    ]);
    fixture.componentRef.setInput("createActions", [
      {
        label: "Deposit",
        route: "/operations/deposit",
        icon: "cash-banknote",
        permission: "fund_flows.create",
        description: "Credit an account",
      },
    ]);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain("Customers");
    expect(text).not.toContain("Accounts");
    expect(fixture.componentInstance.visibleActions()).toHaveLength(0);
    expect(
      fixture.nativeElement.querySelector(".workspace-create-button"),
    ).toBeNull();

    const preferences = TestBed.inject(WorkspaceUiPreferencesService);
    preferences.setSidebarExpanded(false);
    fixture.componentInstance.mobileOpen.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Customers");
  });

  it("toggles the persisted sidebar and density preference", async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceShellComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(WorkspaceShellComponent);
    fixture.componentRef.setInput("productName", "Example Exchange");
    fixture.componentRef.setInput("navGroups", []);
    fixture.componentRef.setInput("createActions", []);
    fixture.detectChanges();
    const preferences = TestBed.inject(WorkspaceUiPreferencesService);

    preferences.toggleSidebar();
    preferences.setDensity("compact");
    fixture.detectChanges();

    const shell = fixture.nativeElement.querySelector(
      ".workspace-shell",
    ) as HTMLElement;
    expect(shell.classList.contains("workspace-shell--collapsed")).toBe(true);
    expect(shell.classList.contains("workspace-compact")).toBe(true);
    expect(localStorage.getItem("arz-neshan.workspace.sidebar-expanded")).toBe(
      "false",
    );
    expect(localStorage.getItem("arz-neshan.workspace.density")).toBe(
      "compact",
    );
  });
});
