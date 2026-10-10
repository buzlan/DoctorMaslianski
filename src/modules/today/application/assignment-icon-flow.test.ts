import {
  calendarDate,
  recordAssignmentCompletion,
} from "@/modules/treatment/domain";
import { mapRemoteTreatment } from "@/modules/treatment/infrastructure/map-remote-treatment";
import { buildTodayOverview } from "./build-today-overview";

function treatment(icon: string | null) {
  return mapRemoteTreatment({
    treatment: {
      id: "t1",
      patient_id: "p1",
      treatment_context: "sclerotherapy",
      status: "active",
      created_at: "2026-10-06T00:00:00Z",
    },
    periods: [],
    milestones: [],
    completions: [],
    appointments: [],
    assignments: [
      {
        id: "a1",
        catalog_item_id: "c1",
        title: "Action",
        instruction: null,
        start_date: "2026-10-01",
        end_date: "2026-10-31",
        status: "active",
        icon_storage_path: icon,
      },
    ],
  });
}

describe("catalog icon to Today flow", () => {
  it("preserves path through domain copying, completion, and Today projection", () => {
    const plan = treatment("clinic/action/icon.png");
    const date = calendarDate(2026, 10, 6);
    expect(plan.assignments[0]?.iconStoragePath).toBe("clinic/action/icon.png");
    const completed = recordAssignmentCompletion(plan, "a1", date);
    expect(completed.status).toBe("recorded");
    if (completed.status !== "recorded") throw new Error("Completion failed");
    const overview = buildTodayOverview(completed.treatment, date);
    expect(overview.kind).toBe("ready");
    if (overview.kind !== "ready") throw new Error("Overview failed");
    expect(overview.assignments[0]).toMatchObject({
      completed: true,
      iconStoragePath: "clinic/action/icon.png",
    });
  });

  it("clears the icon after a refreshed catalog read returns null", () => {
    expect(treatment("old.png").assignments[0]?.iconStoragePath).toBe(
      "old.png",
    );
    const overview = buildTodayOverview(
      treatment(null),
      calendarDate(2026, 10, 6),
    );
    if (overview.kind !== "ready") throw new Error("Overview failed");
    expect(overview.assignments[0]?.iconStoragePath).toBeUndefined();
  });
});
