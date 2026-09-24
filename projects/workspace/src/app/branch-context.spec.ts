import { TestBed } from "@angular/core/testing";
import { BranchContextService } from "@shared/core/branch-context.service";

describe("BranchContextService", () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.resetTestingModule();
  });

  it("persists the active branch for a workspace reload", () => {
    const service = TestBed.inject(BranchContextService);
    service.select("branch-id");

    expect(service.selected()).toBe("branch-id");
    expect(sessionStorage.getItem("arz-neshan.active-branch")).toBe(
      "branch-id",
    );

    service.select("");
    expect(sessionStorage.getItem("arz-neshan.active-branch")).toBeNull();
  });
});
