import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";
import { ApiService } from "@shared/core/api.service";
import { SignupPageComponent } from "./public-pages";

describe("SignupPageComponent", () => {
  it("requests the signup verification code by email", async () => {
    const post = vi.fn().mockReturnValue(of({ challenge_id: "challenge-1" }));
    await TestBed.configureTestingModule({
      imports: [SignupPageComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: { post } },
      ],
    }).compileComponents();
    const component =
      TestBed.createComponent(SignupPageComponent).componentInstance;
    component.emailForm.setValue({ email: "owner@example.com" });
    component.turnstileToken.set("turnstile-token");

    await component.requestCode();

    expect(post).toHaveBeenCalledWith("signup/otp/request", {
      email: "owner@example.com",
      turnstile_token: "turnstile-token",
    });
    expect(component.stage()).toBe("otp");
  });
});
