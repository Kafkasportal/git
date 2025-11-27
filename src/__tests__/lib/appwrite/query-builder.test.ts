
import { describe, it, expect } from "vitest";
import { createQueryBuilder } from "../../../lib/appwrite/query-builder";
import { Query } from "appwrite";

describe("AppwriteQueryBuilder", () => {
  it("should handle containsAny with multiple values using OR logic", () => {
    const builder = createQueryBuilder();
    builder.containsAny("roles", ["admin", "editor"]);

    const queries = builder.build();

    // The expected behavior is an OR query containing two contains queries
    // OR([contains("roles", "admin"), contains("roles", "editor")])

    // With the bug, it likely produces only one contains query or an incorrect structure
    // queries[0] should be something like '{"method":"or","values":[{"method":"contains","attribute":"roles","values":["admin"]},{"method":"contains","attribute":"roles","values":["editor"]}]}'
    // But since Query.toString() format might vary or rely on internal representation, we can check if it matches the expected Query.or output

    const expectedQuery = Query.or([
        Query.contains("roles", "admin"),
        Query.contains("roles", "editor")
    ]);

    expect(queries).toHaveLength(1);
    expect(queries[0]).toBe(expectedQuery);
  });

  it("should handle containsAny with single value", () => {
    const builder = createQueryBuilder();
    builder.containsAny("roles", ["admin"]);

    const queries = builder.build();
    // For single value, it could be a simple contains, or OR with single contains.
    // The current implementation probably does a simple contains, which is fine for single value.
    // But let's see what the fix will do. Usually optimization to single contains is good but consistency is also good.
    // For now let's just assert it contains the value "admin"

    expect(queries[0]).toContain('admin');
    expect(queries[0]).toContain('roles');
  });
});
