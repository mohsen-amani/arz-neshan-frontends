import { TestBed } from "@angular/core/testing";
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from "@angular/router";
import { ApiService } from "@shared/core/api.service";
import { of } from "rxjs";
import { ClientDetailComponent } from "./client-detail.component";

describe("ClientDetailComponent documents", () => {
  it("uploads a customer-owned document with secure defaults", async () => {
    const post = vi.fn(() => of({ id: "document-id" }));
    const get = vi.fn(() =>
      of({ data: [], meta: { total: 0, page: 1, perPage: 10 } }),
    );
    await TestBed.configureTestingModule({
      imports: [ClientDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: "client-id" }) },
          },
        },
        {
          provide: ApiService,
          useValue: { post, get },
        },
      ],
    }).compileComponents();
    const component = TestBed.createComponent(
      ClientDetailComponent,
    ).componentInstance;
    component.client.set({ id: "client-id" });
    component.selectedFile.set(
      new File(["identity"], "identity.pdf", { type: "application/pdf" }),
    );
    component.uploadForm.patchValue({ documentType: "id_card" });

    await component.uploadDocument();

    expect(post).toHaveBeenCalledOnce();
    const [path, body] = post.mock.calls[0] as unknown as [string, FormData];
    expect(path).toBe("attachments");
    expect(body.get("owner_type")).toBe("client");
    expect(body.get("owner_id")).toBe("client-id");
    expect(body.get("document_type")).toBe("id_card");
    expect(body.get("is_sensitive")).toBe("true");
    expect(body.get("client_visible")).toBe("false");
  });
});
