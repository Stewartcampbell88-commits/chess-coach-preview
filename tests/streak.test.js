import test from "node:test"; import assert from "node:assert/strict";
import { updateStreak, displayStreak } from "../js/logic/streak.js"; import { localDateKey } from "../js/logic/dates.js";
import { completeSession, recordAnswer, defaultProgress } from "../js/logic/progress.js";
test("first session", () => assert.deepEqual(updateStreak({ count: 0, lastDate: null }, "2026-10-20"), { count: 1, lastDate: "2026-10-20" }));
test("twice same day counts once", () => assert.deepEqual(updateStreak({ count: 3, lastDate: "2026-10-20" }, "2026-10-20"), { count: 3, lastDate: "2026-10-20" }));
test("next day +1 across month", () => assert.equal(updateStreak({ count: 3, lastDate: "2026-10-31" }, "2026-11-01").count, 4));
test("gap resets to 1", () => assert.equal(updateStreak({ count: 9, lastDate: "2026-10-17" }, "2026-10-20").count, 1));
test("display drops to 0 after a missed day", () => { assert.equal(displayStreak({ count: 5, lastDate: "2026-10-19" }, "2026-10-20"), 5);
  assert.equal(displayStreak({ count: 5, lastDate: "2026-10-18" }, "2026-10-20"), 0); });
test("local midnight boundary", () => { assert.equal(localDateKey(new Date(2026, 9, 20, 23, 50)), "2026-10-20");
  assert.equal(localDateKey(new Date(2026, 9, 21, 0, 10)), "2026-10-21"); });
test("answers alone never move the streak", () => {
  const p = recordAnswer(defaultProgress(), { id: "w1-l1-01", tag: "spot" }, false, "2026-10-20");
  assert.equal(p.streak.count, 0); assert.equal(p.tagMisses.spot, 1); assert.equal(p.tagSeen.spot, 1);
  assert.equal(completeSession(p, "2026-10-20").streak.count, 1); });
