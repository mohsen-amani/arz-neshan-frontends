import { TestBed } from "@angular/core/testing";
import { ActivatedRoute, provideRouter } from "@angular/router";
import { ApiService } from "@shared/core/api.service";
import { of } from "rxjs";
import { ResourceListComponent } from "./resource-list.component";

describe("ResourceListComponent", () => {
  it("reactively filters loaded records as the search value changes", async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceListComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                title: "Customers",
                eyebrow: "Relationships",
                description: "Customer records",
                endpoint: "clients",
              },
            },
          },
        },
        {
          provide: ApiService,
          useValue: { get: () => of({ data: [], meta: { total: 0 } }) },
        },
      ],
    }).compileComponents();
    const component = TestBed.createComponent(
      ResourceListComponent,
    ).componentInstance;
    component.rows.set([
      { id: "one", first_name: "Amina" },
      { id: "two", first_name: "Farid" },
    ]);

    expect(component.filteredRows()).toHaveLength(2);
    component.query.set("far");
    expect(component.filteredRows()).toEqual([
      { id: "two", first_name: "Farid" },
    ]);
  });
});
