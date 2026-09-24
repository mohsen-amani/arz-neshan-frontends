import { HttpErrorResponse } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { ApiService } from "@shared/core/api.service";
import { of, throwError } from "rxjs";
import { SystemHealthComponent } from "./platform-pages";

describe("SystemHealthComponent", () => {
  it("keeps liveness and dependency readiness as separate results", async () => {
    await TestBed.configureTestingModule({
      imports: [SystemHealthComponent],
      providers: [
        {
          provide: ApiService,
          useValue: {
            get: (path: string) =>
              path === "health/live"
                ? of({ status: "ok" })
                : throwError(
                    () =>
                      new HttpErrorResponse({
                        status: 503,
                        statusText: "Service Unavailable",
                      }),
                  ),
          },
        },
      ],
    }).compileComponents();
    const component = TestBed.createComponent(
      SystemHealthComponent,
    ).componentInstance;

    await component.load();

    expect(component.liveness().status).toBe("operational");
    expect(component.readiness().status).toBe("unavailable");
    expect(component.lastChecked()).toBeTruthy();
  });
});
