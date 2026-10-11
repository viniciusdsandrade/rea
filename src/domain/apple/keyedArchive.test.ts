import { describe, expect, it } from "vitest";
import { z } from "zod";

import { MAX_JSON_DEPTH } from "../jsonValue.js";
import {
  keyedArchiveInputSchema,
  projectKeyedArchive,
} from "./keyedArchive.js";

const deepValue = (depth: number): unknown => {
  let value: unknown = 1;
  for (let index = 0; index < depth; index += 1) value = { nested: value };
  return value;
};

describe("keyedArchiveInputSchema", () => {
  it("rejects paths containing NUL bytes", () => {
    const result = keyedArchiveInputSchema.safeParse({
      path: "Contents/Resources/Model\0.plist",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "Local filesystem paths cannot contain NUL",
      );
    }
  });

  it("defaults to dot when path is omitted", () => {
    const parsed = keyedArchiveInputSchema.parse({});
    expect(parsed.path).toBe(".");
  });
});

describe("projectKeyedArchive input bound", () => {
  it("rejects an over-deep archive value with a validation error instead of crashing", () => {
    let error: unknown;
    try {
      projectKeyedArchive(deepValue(MAX_JSON_DEPTH + 1), {
        offset: 0,
        limit: 1,
      });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(z.ZodError);
    expect(error).not.toBeInstanceOf(RangeError);
  });
});
