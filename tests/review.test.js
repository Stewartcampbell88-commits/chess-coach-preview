import test from "node:test"; import assert from "node:assert/strict";
import { scheduleAnswer, dueIds } from "../js/logic/review.js"; import { addDays } from "../js/logic/dates.js";
test("addDays crosses month", () => assert.equal(addDays("2026-10-31", 1), "2026-11-01"));
test("miss -> box 0 due tomorrow", () => assert.deepEqual(scheduleAnswer({}, "a", false, "2026-10-20").a, { box: 0, due: "2026-10-21" }));
test("hit climbs boxes", () => { const r = scheduleAnswer({ a: { box: 0, due: "2026-10-21" } }, "a", true, "2026-10-21");
  assert.deepEqual(r.a, { box: 1, due: "2026-10-24" }); });
test("top box stays at 35 days", () => assert.deepEqual(scheduleAnswer({ a: { box: 4, due: "2026-10-20" } }, "a", true, "2026-10-20").a, { box: 4, due: "2026-11-24" }));
test("hit on untracked ignored", () => assert.deepEqual(scheduleAnswer({}, "a", true, "2026-10-20"), {}));
test("dueIds sorted", () => assert.deepEqual(dueIds({ b: { box: 0, due: "2026-10-19" }, a: { box: 0, due: "2026-10-19" }, c: { box: 1, due: "2026-10-25" } }, "2026-10-20"), ["a", "b"]));
