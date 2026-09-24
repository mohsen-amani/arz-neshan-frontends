import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { AppComponent } from "./app.component";

describe("Platform AppComponent", () => {
  it("creates the platform application shell", async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    expect(
      TestBed.createComponent(AppComponent).componentInstance,
    ).toBeTruthy();
  });
});
