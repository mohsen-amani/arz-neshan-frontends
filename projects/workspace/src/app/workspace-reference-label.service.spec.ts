import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { ApiService } from "@shared/core/api.service";
import { SessionState } from "@shared/core/session.state";
import { WorkspaceReferenceLabelService } from "./workspace-reference-label.service";

describe("WorkspaceReferenceLabelService", () => {
  const branchId = "28ff3c0d-9059-4828-80a2-58fe526228d7";

  it("replaces permitted foreign-key UUIDs with business labels", async () => {
    const get = vi.fn().mockReturnValue(
      of({
        data: [{ id: branchId, name: "Kabul Central", code: "KBL" }],
        meta: { total: 1, page: 1, perPage: 100 },
      }),
    );
    await TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: { get } }],
    }).compileComponents();
    const session = TestBed.inject(SessionState);
    session.setContext({
      user: { id: "admin-id", username: "operator" },
      workspace: {
        id: "workspace-id",
        name: "Workspace",
        slug: "workspace",
        default_locale: "en",
        status: "active",
      },
      membership_role: "member",
      permissions: ["branches.read"],
      scopes: [],
    });
    const service = TestBed.inject(WorkspaceReferenceLabelService);
    const row = { branch_id: branchId };

    await service.prepare(["branch_id"], [row]);

    expect(get).toHaveBeenCalledWith("branches", { page: 1, perPage: 100 });
    expect(service.display("branch_id", branchId, row)).toBe(
      "Kabul Central · KBL",
    );
    expect(service.tooltip("branch_id", branchId, row)).toContain(branchId);
  });

  it("uses embedded companion data without fetching another collection", async () => {
    const get = vi.fn();
    await TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: { get } }],
    }).compileComponents();
    const service = TestBed.inject(WorkspaceReferenceLabelService);
    const row = {
      currency_id: branchId,
      currency: { code: "AFN", name: "Afghani" },
    };

    await service.prepare(["currency_id"], [row]);

    expect(get).not.toHaveBeenCalled();
    expect(service.display("currency_id", branchId, row)).toBe("AFN · Afghani");
  });
});
