const test = require("node:test");
const assert = require("node:assert");
const VF = require("../public/feest.js");

const d = (j, m, dag) => new Date(j, m - 1, dag, 12);
const AAN = { aan: true };

test("Sinterklaas van 12 nov t/m 5 dec", () => {
  assert.strictEqual(VF.actiefFeest(d(2026, 11, 26), AAN).feest.id, "sinterklaas");
  assert.strictEqual(VF.actiefFeest(d(2026, 11, 12), AAN).feest.id, "sinterklaas");
  assert.strictEqual(VF.actiefFeest(d(2026, 12, 5), AAN).feest.id, "sinterklaas");
  assert.strictEqual(VF.actiefFeest(d(2026, 11, 11), AAN), null);
  assert.strictEqual(VF.actiefFeest(d(2026, 12, 6), AAN), null);
});

test("uit of niet ingesteld = geen feest", () => {
  assert.strictEqual(VF.actiefFeest(d(2026, 11, 26), { aan: false }), null);
  assert.strictEqual(VF.actiefFeest(d(2026, 11, 26)), null);
  assert.strictEqual(VF.actiefFeest(d(2026, 11, 26), {}), null);
  assert.strictEqual(VF.actiefFeest(d(2026, 11, 26), { verjaardagen: [{ naam: "Sarah", datum: "11-26" }] }), null);
});

test("verjaardag gaat voor", () => {
  const r = VF.actiefFeest(d(2026, 11, 26), { aan: true, verjaardagen: [{ naam: "Sarah", datum: "11-26" }] });
  assert.strictEqual(r.feest.id, "verjaardag");
  assert.strictEqual(r.naam, "Sarah");
});

test("halve regels worden genegeerd", () => {
  const r = VF.actiefFeest(d(2026, 11, 26), { aan: true, verjaardagen: [{ naam: "", datum: "11-26" }, { naam: "X", datum: "" }, null] });
  assert.strictEqual(r.feest.id, "sinterklaas");
});

test("29 februari in geen schrikkeljaar", () => {
  assert.strictEqual(VF.actiefFeest(d(2027, 2, 28), { aan: true, verjaardagen: [{ naam: "Y", datum: "02-29" }] }), null);
});

test("forceren voor voorbeeld", () => {
  assert.strictEqual(VF.actiefFeest(d(2026, 7, 1), {}, "sinterklaas").feest.id, "sinterklaas");
  const v = VF.actiefFeest(d(2026, 7, 1), { aan: false }, "verjaardag");
  assert.strictEqual(v.feest.id, "verjaardag");
  assert.strictEqual(v.naam, "Voorbeeld");
});

test("periode over de jaarwisseling", () => {
  assert.strictEqual(VF.binnen("01-01", "12-27", "01-02"), true);
  assert.strictEqual(VF.binnen("12-26", "12-27", "01-02"), false);
});

test("rand en moment leveren iets op", () => {
  for (const f of [...VF.FEESTEN, VF.VERJAARDAG]) {
    assert.match(f.rand(false), /<svg/);
    assert.match(f.rand(true), /<svg/);
    assert.ok(f.moment("Sarah").kop);
  }
  assert.deepStrictEqual(VF.FEEST_STD(), { aan: false, moment: false, verjaardagen: [] });
});
