import type { AppSupabaseClient } from "@/core/supabase/client";
import {
  loadAssignmentIconPaths,
  resolveAssignmentIconUrl,
} from "./assignment-icon-gateway";

function clientWithRpc(rpc: jest.Mock): AppSupabaseClient {
  return { rpc } as unknown as AppSupabaseClient;
}

describe("assignment icon gateway", () => {
  it("loads current paths by treatment, including actions without an icon", async () => {
    const rpc = jest.fn().mockResolvedValue({
      data: [
        { assignment_id: "a1", icon_storage_path: "clinic/action/new.png" },
        { assignment_id: "a2", icon_storage_path: null },
      ],
      error: null,
    });
    const paths = await loadAssignmentIconPaths(clientWithRpc(rpc), "t1");
    expect(rpc).toHaveBeenCalledWith("get_assignment_icons", {
      p_treatment_id: "t1",
    });
    expect(paths.get("a1")).toBe("clinic/action/new.png");
    expect(paths.get("a2")).toBeNull();
  });

  it("fetches replacement and removal again on the next read", async () => {
    const rpc = jest
      .fn()
      .mockResolvedValueOnce({
        data: [{ assignment_id: "a1", icon_storage_path: "old.png" }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ assignment_id: "a1", icon_storage_path: "new.png" }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ assignment_id: "a1", icon_storage_path: null }],
        error: null,
      });
    const client = clientWithRpc(rpc);
    expect((await loadAssignmentIconPaths(client, "t1")).get("a1")).toBe(
      "old.png",
    );
    expect((await loadAssignmentIconPaths(client, "t1")).get("a1")).toBe(
      "new.png",
    );
    expect((await loadAssignmentIconPaths(client, "t1")).get("a1")).toBeNull();
  });

  it("degrades gracefully when RPC is unavailable or network fails", async () => {
    expect(
      await loadAssignmentIconPaths(
        clientWithRpc(
          jest.fn().mockResolvedValue({ error: { message: "unavailable" } }),
        ),
        "t1",
      ),
    ).toEqual(new Map());
    expect(
      await loadAssignmentIconPaths(
        clientWithRpc(jest.fn().mockRejectedValue(new Error("offline"))),
        "t1",
      ),
    ).toEqual(new Map());
  });

  it("obtains a short-lived URL without caching it as domain data", async () => {
    const createSignedUrl = jest
      .fn()
      .mockResolvedValue({ data: { signedUrl: "signed" }, error: null });
    const from = jest.fn().mockReturnValue({ createSignedUrl });
    const client = { storage: { from } } as unknown as AppSupabaseClient;
    expect(
      await resolveAssignmentIconUrl("clinic/action/icon.png", client),
    ).toBe("signed");
    expect(from).toHaveBeenCalledWith("action-icons");
    expect(createSignedUrl).toHaveBeenCalledWith("clinic/action/icon.png", 300);
  });

  it("returns fallback on missing client or inaccessible file", async () => {
    expect(await resolveAssignmentIconUrl("path", null)).toBeNull();
    const client = {
      storage: {
        from: () => ({
          createSignedUrl: async () => ({ error: { message: "forbidden" } }),
        }),
      },
    } as unknown as AppSupabaseClient;
    expect(await resolveAssignmentIconUrl("path", client)).toBeNull();
  });
});
