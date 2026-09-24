import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";
import { ApiService } from "@shared/core/api.service";
import { TransactionReportComponent } from "./transaction-report.component";

describe("TransactionReportComponent", () => {
  it("loads server-calculated transaction totals with the selected filters", async () => {
    const get = vi.fn().mockReturnValue(
      of({
        data: [
          {
            transaction_id: "transaction-id",
            currency_id: "currency-id",
            currency_code: "AFN",
            volume: "1250.000000",
          },
        ],
        summary: {
          transaction_count: 1,
          row_count: 1,
          truncated: false,
          totals: [{ currency_code: "AFN", amount: "1250" }],
        },
      }),
    );
    await TestBed.configureTestingModule({
      imports: [TransactionReportComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: { get } },
      ],
    }).compileComponents();
    const component = TestBed.createComponent(
      TransactionReportComponent,
    ).componentInstance;
    component.filters.type = "deposit";

    await component.load();

    expect(get).toHaveBeenCalledWith(
      "reports/transactions",
      expect.objectContaining({ type: "deposit" }),
    );
    expect(component.summary()?.totals[0].amount).toBe("1250");
  });
});
