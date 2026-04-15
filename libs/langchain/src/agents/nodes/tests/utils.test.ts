import { describe, it, expect } from "vitest";
import * as z from "zod";
import { StateSchema } from "@langchain/langgraph";
import { getInteropZodObjectShape } from "@langchain/core/utils/types";
import { initializeMiddlewareStates, derivePrivateState } from "../utils.js";
import type { AgentMiddleware } from "../../middleware/types.js";

const baseState = { messages: [] };

describe("initializeMiddlewareStates", () => {
  it("should work with a zod v4 stateSchema", async () => {
    const middleware: AgentMiddleware = {
      name: "test-middleware",
      stateSchema: z.object({
        counter: z.number().default(0),
      }),
    };

    const result = await initializeMiddlewareStates([middleware], baseState);
    expect(result).toEqual({ counter: 0 });
  });

  it("should skip middleware without stateSchema", async () => {
    const middleware: AgentMiddleware = { name: "no-schema-middleware" };
    const result = await initializeMiddlewareStates([middleware], baseState);
    expect(result).toEqual({});
  });

  it("should throw a descriptive error when required fields are missing", async () => {
    const middleware: AgentMiddleware = {
      name: "test-middleware",
      stateSchema: z.object({
        requiredField: z.string(),
      }),
    };

    await expect(
      initializeMiddlewareStates([middleware], baseState)
    ).rejects.toThrow(/requiredField/);
  });
});

describe("derivePrivateState", () => {
  it("should return a schema with built-in fields when no stateSchema given", () => {
    const schema = derivePrivateState();
    const shape = getInteropZodObjectShape(schema);
    expect(shape).toHaveProperty("messages");
  });

  it("should include private (underscore) fields from a zod v4 schema", () => {
    const stateSchema = z.object({
      publicField: z.string().default("pub"),
      _privateField: z.string().default("priv"),
    });

    const schema = derivePrivateState(stateSchema);
    const shape = getInteropZodObjectShape(schema);
    expect(shape).toHaveProperty("_privateField");
    expect(shape).toHaveProperty("messages");
  });

  it("should include private fields from StateSchema", () => {
    const stateSchema = new StateSchema({
      publicField: z.string().default("pub"),
      _privateField: z.string().default("priv"),
    });

    const schema = derivePrivateState(stateSchema);
    const shape = getInteropZodObjectShape(schema);
    expect(shape).toHaveProperty("_privateField");
    expect(shape).toHaveProperty("messages");
  });
});
