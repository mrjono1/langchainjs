import * as z from "zod";
import { expectTypeOf, it, describe } from "vitest";
import { tool } from "../headless.js";
import type { DynamicStructuredTool } from "@langchain/core/tools";

describe("tool — headless overload", () => {
  it("should infer arg types from schema and preserve name literal", async () => {
    const myTool = tool({
      name: "test",
      description: "test",
      schema: z.object({
        message: z.string(),
      }),
    });

    expectTypeOf(myTool.name).toEqualTypeOf<"test">();

    const impl = myTool.implement(async (args) => {
      expectTypeOf(args).toEqualTypeOf<{ message: string }>();
      return { output: "test" };
    });

    expectTypeOf(impl.tool.name).toEqualTypeOf<"test">();
    expectTypeOf(impl.execute).toMatchTypeOf<
      (args: { message: string }) => Promise<{ output: string }>
    >();
  });
});

describe("tool — normal overload", () => {
  it("should return DynamicStructuredTool with proper types", () => {
    const myTool = tool(
      async ({ city }: { city: string }) => `Weather in ${city}`,
      {
        name: "get_weather",
        description: "Get the weather",
        schema: z.object({ city: z.string() }),
      }
    );

    expectTypeOf(myTool).toExtend<DynamicStructuredTool>();
    expectTypeOf(myTool.name).toEqualTypeOf<"get_weather">();
  });
});
