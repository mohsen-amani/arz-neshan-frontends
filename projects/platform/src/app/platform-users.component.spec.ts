import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { ApiService } from "@shared/core/api.service";
import { PlatformUsersComponent } from "./platform-users.component";

describe("PlatformUsersComponent", () => {
  it("keeps the one-time TOTP provisioning result visible after creation", async () => {
    const api = {
      get: vi.fn().mockReturnValue(of([])),
      post: vi.fn().mockReturnValue(
        of({
          id: "operator-id",
          email: "operator@example.com",
          status: "active",
          totp_secret: "BASE32SECRET",
          provisioning_uri: "otpauth://totp/example",
        }),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [PlatformUsersComponent],
      providers: [{ provide: ApiService, useValue: api }],
    }).compileComponents();
    const component = TestBed.createComponent(
      PlatformUsersComponent,
    ).componentInstance;
    component.form.setValue({
      email: "operator@example.com",
      password: "Secure!Password1",
    });

    await component.create();

    expect(component.created()?.["totp_secret"]).toBe("BASE32SECRET");
    expect(api.post).toHaveBeenCalledWith(
      "platform/users",
      expect.objectContaining({ email: "operator@example.com" }),
    );
  });
});
