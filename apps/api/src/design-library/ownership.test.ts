import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import { AuthRequest, requireDeveloper } from "../middleware/auth";
import designLibraryRouter from "../routes/design-library";
import { projectOwnershipFilter, projectResourceOwnershipFilter } from "./ownership";

test("design routes are behind developer authentication", () => {
  const stack = (designLibraryRouter as unknown as { stack: Array<{ handle: unknown }> }).stack;
  assert.equal(stack[0]?.handle, requireDeveloper);
});

test("project and selection database filters always include the owner", () => {
  const projectId = "project-a";
  const ownerId = "developer-a";
  assert.deepEqual(projectOwnershipFilter(projectId, ownerId), { _id: projectId, ownerId });
  assert.deepEqual(projectResourceOwnershipFilter(projectId, ownerId), { projectId, ownerId });
});

test("developer auth rejects ordinary users and accepts a developer token", () => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "design-library-auth-test-secret";
  try {
    const invoke = (role: "user" | "developer") => {
      const token = jwt.sign({ id: "account-a", role, isDeveloper: role === "developer" }, process.env.JWT_SECRET!);
      const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
      const response = { statusCode: 200, status(code: number) { this.statusCode = code; return this; }, json() { return this; } };
      let nextCalled = false;
      requireDeveloper(req, response as never, () => { nextCalled = true; });
      return { req, response, nextCalled };
    };
    assert.equal(invoke("developer").nextCalled, true);
    const ordinaryUser = invoke("user");
    assert.equal(ordinaryUser.nextCalled, false);
    assert.equal(ordinaryUser.response.statusCode, 403);
  } finally {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});
