import { TestBed } from "@angular/core/testing";
import { ActivatedRoute, provideRouter } from "@angular/router";
import { ApiService } from "@shared/core/api.service";
import { OperationFormComponent } from "./operation-form.component";

describe("OperationFormComponent", () => {
  async function create(): Promise<OperationFormComponent> {
    await TestBed.configureTestingModule({
      imports: [OperationFormComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { kind: "money_order" } } },
        },
        { provide: ApiService, useValue: {} },
      ],
    }).compileComponents();
    return TestBed.createComponent(OperationFormComponent).componentInstance;
  }

  it("applies the backend partner-funding rule for incoming orders", async () => {
    const component = await create();
    component.form.patchValue({ direction: "incoming" });
    component.directionChanged();
    expect(component.form.controls.fundingType.value).toBe("partner");
    expect(component.form.controls.payoutType.value).toBe("cash");

    component.form.patchValue({
      partnerId: "partner-id",
      currencyId: "currency-id",
      amount: "100.00",
      beneficiaryName: "Recipient",
    });
    component.review();
    expect(component.stage()).toBe("review");
    expect(component.payload()).toEqual(
      expect.objectContaining({
        direction: "incoming",
        partner_id: "partner-id",
        funding_type: "partner",
      }),
    );
  });

  it("rejects partner funding for outgoing orders before submission", async () => {
    const component = await create();
    component.form.patchValue({
      direction: "outgoing",
      fundingType: "partner",
      partnerId: "partner-id",
      currencyId: "currency-id",
      amount: "100.00",
      beneficiaryName: "Recipient",
    });
    component.review();
    expect(component.stage()).toBe("edit");
    expect(component.error()).toContain("required operation details");
  });
});
