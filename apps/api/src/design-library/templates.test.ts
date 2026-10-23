import assert from "node:assert/strict";
import test from "node:test";
import {
  designTemplates,
  evaluateCompatibility,
  filterTemplates,
  findTemplate,
  validateTemplateConfiguration,
} from "./templates";
import { validateDesignSelectionInput } from "./selection";

test("template registry contains distinct Phase 3 layouts and components", () => {
  assert.ok(designTemplates.length >= 13);
  assert.equal(findTemplate("analytics-dashboard")?.category, "dashboard");
  assert.equal(findTemplate("collapsible-sidebar")?.category, "navigation");
  assert.equal(findTemplate("confirmation-dialog")?.supportedComponentTypes[0], "dialog");
  assert.equal(findTemplate("missing-template"), undefined);
});

test("search and category filters narrow the registry", () => {
  assert.deepEqual(filterTemplates({ search: "trend panels" }).map((item) => item.id), ["analytics-dashboard"]);
  assert.ok(filterTemplates({ category: "navigation" }).every((item) => item.category === "navigation"));
  assert.deepEqual(filterTemplates({ framework: "Vue" }), []);
});

test("compatibility distinguishes full, partial, and unsupported projects", () => {
  const template = findTemplate("minimal-dashboard")!;
  assert.equal(evaluateCompatibility(template, null).level, "partial");
  assert.equal(evaluateCompatibility(template, { summary: { primaryFramework: "Next.js" }, uiInventory: { stylingSystems: ["Tailwind CSS"] } }).level, "full");
  assert.equal(evaluateCompatibility(template, { summary: { primaryFramework: "Vue" }, uiInventory: { stylingSystems: ["CSS"] } }).level, "unsupported");
  assert.equal(evaluateCompatibility(template, { summary: { primaryFramework: "React" }, uiInventory: { stylingSystems: [] } }).level, "partial");
});

test("template configuration only accepts the documented enum properties", () => {
  assert.equal(validateTemplateConfiguration(undefined), true);
  assert.equal(validateTemplateConfiguration({ accent: "violet", density: "compact" }), true);
  assert.equal(validateTemplateConfiguration({ accent: "orange" }), false);
  assert.equal(validateTemplateConfiguration({ arbitraryPath: "src/app.tsx" }), false);
  assert.equal(validateTemplateConfiguration(["blue"]), false);
});

test("selection validation tracks a published template version and target", () => {
  const valid = validateDesignSelectionInput({ templateId: "analytics-dashboard", templateVersion: 1, targetComponentType: "page", configuration: { accent: "blue" } });
  assert.equal(valid.valid, true);
  if (valid.valid) {
    assert.equal(valid.value.template.id, "analytics-dashboard");
    assert.equal(valid.value.templateVersion, 1);
  }
  const oldVersion = validateDesignSelectionInput({ templateId: "analytics-dashboard", templateVersion: 0, targetComponentType: "page" });
  assert.equal(oldVersion.valid, false);
  if (!oldVersion.valid) assert.equal(oldVersion.code, "TEMPLATE_VERSION_UNAVAILABLE");
  const wrongTarget = validateDesignSelectionInput({ templateId: "analytics-dashboard", templateVersion: 1, targetComponentType: "dialog" });
  assert.equal(wrongTarget.valid, false);
});
