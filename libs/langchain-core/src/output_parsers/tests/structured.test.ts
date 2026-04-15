import * as z from "zod";

import { describe, expect, test } from "vitest";

import { OutputParserException } from "../base.js";
import { StructuredOutputParser } from "../structured.js";
import { InteropZodObject, InteropZodType } from "../../utils/types/zod.js";

test("StructuredOutputParser.fromNamesAndDescriptions", async () => {
  const parser = StructuredOutputParser.fromNamesAndDescriptions({
    url: "A link to the resource",
  });

  expect(await parser.parse('```\n{"url": "value"}```')).toEqual({
    url: "value",
  });

  expect(parser.getFormatInstructions()).toMatchInlineSnapshot(`
  "You must format your output as a JSON value that adheres to a given "JSON Schema" instance.

  "JSON Schema" is a declarative language that allows you to annotate and validate JSON documents.

  For example, the example "JSON Schema" instance {{"properties": {{"foo": {{"description": "a list of test words", "type": "array", "items": {{"type": "string"}}}}}}, "required": ["foo"]}}
  would match an object with one required property, "foo". The "type" property specifies "foo" must be an "array", and the "description" property semantically describes it as "a list of test words". The items within "foo" must be strings.
  Thus, the object {{"foo": ["bar", "baz"]}} is a well-formatted instance of this example "JSON Schema". The object {{"properties": {{"foo": ["bar", "baz"]}}}} is not well-formatted.

  Your output will be parsed and type-checked according to the provided schema instance, so make sure all fields in your output match the schema exactly and there are no trailing commas!

  Here is the JSON Schema instance your output must adhere to. Include the enclosing markdown codeblock:
  \`\`\`json
  {"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"url":{"type":"string","description":"A link to the resource"}},"required":["url"],"additionalProperties":false}
  \`\`\`
  "
  `);
});

enum StateProvinceEnum {
  Alabama = "AL",
  Alaska = "AK",
  Arizona = "AZ",
}

describe("StructuredOutputParser.fromZodSchema", () => {
  const assertValid = async (
    parser: StructuredOutputParser<InteropZodObject>
  ) => {
    expect(await parser.parse('```\n{"url": "value"}```')).toEqual({
      url: "value",
    });
  };
  test("resolves url field from zod object schema", async () => {
    const parser = StructuredOutputParser.fromZodSchema(
      z.object({ url: z.string().describe("A link to the resource") })
    );

    await assertValid(parser);

    expect(parser.getFormatInstructions()).toMatchInlineSnapshot(`
      "You must format your output as a JSON value that adheres to a given "JSON Schema" instance.

      "JSON Schema" is a declarative language that allows you to annotate and validate JSON documents.

      For example, the example "JSON Schema" instance {{"properties": {{"foo": {{"description": "a list of test words", "type": "array", "items": {{"type": "string"}}}}}}, "required": ["foo"]}}
      would match an object with one required property, "foo". The "type" property specifies "foo" must be an "array", and the "description" property semantically describes it as "a list of test words". The items within "foo" must be strings.
      Thus, the object {{"foo": ["bar", "baz"]}} is a well-formatted instance of this example "JSON Schema". The object {{"properties": {{"foo": ["bar", "baz"]}}}} is not well-formatted.

      Your output will be parsed and type-checked according to the provided schema instance, so make sure all fields in your output match the schema exactly and there are no trailing commas!

      Here is the JSON Schema instance your output must adhere to. Include the enclosing markdown codeblock:
      \`\`\`json
      {"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"url":{"type":"string","description":"A link to the resource"}},"required":["url"],"additionalProperties":false}
      \`\`\`
      "
    `);
  });
});

describe("StructuredOutputParser.fromZodSchema", () => {
  const assertThrows = async (schema: InteropZodType) => {
    const parser = StructuredOutputParser.fromZodSchema(schema);

    await expect(parser.parse('```\n{"url": "value"}```')).rejects.toThrow(
      OutputParserException
    );
  };

  test("rejects parse when value violates enum constraint", async () => {
    await assertThrows(
      z.object({ answer: z.enum(["yes", "no"]).describe("yes or no") })
    );
  });
});

describe("StructuredOutputParser.fromZodSchema", () => {
  const assertValid = async (
    parser: StructuredOutputParser<InteropZodObject>
  ) => {
    expect(
      await parser.parse(
        '```\n{"answer": "value", "sources": ["this-source"]}```'
      )
    ).toEqual({
      answer: "value",
      sources: ["this-source"],
    });

    expect(
      await parser.parse(
        '```json\n{"answer": "value", "sources": ["this-source"]}```'
      )
    ).toEqual({
      answer: "value",
      sources: ["this-source"],
    });

    expect(
      await parser.parse(
        'some other stuff```json\n{"answer": "value", "sources": ["this-source"]}```some other stuff at the end'
      )
    ).toEqual({
      answer: "value",
      sources: ["this-source"],
    });
  };

  test("answer and sources with markdown code fences", async () => {
    const parser = StructuredOutputParser.fromZodSchema(
      z.object({
        answer: z.string().describe("answer to the user's question"),
        sources: z
          .array(z.string())
          .describe("sources used to answer the question, should be websites."),
      })
    );

    await assertValid(parser);

    expect(parser.getFormatInstructions()).toMatchInlineSnapshot(`
      "You must format your output as a JSON value that adheres to a given "JSON Schema" instance.

      "JSON Schema" is a declarative language that allows you to annotate and validate JSON documents.

      For example, the example "JSON Schema" instance {{"properties": {{"foo": {{"description": "a list of test words", "type": "array", "items": {{"type": "string"}}}}}}, "required": ["foo"]}}
      would match an object with one required property, "foo". The "type" property specifies "foo" must be an "array", and the "description" property semantically describes it as "a list of test words". The items within "foo" must be strings.
      Thus, the object {{"foo": ["bar", "baz"]}} is a well-formatted instance of this example "JSON Schema". The object {{"properties": {{"foo": ["bar", "baz"]}}}} is not well-formatted.

      Your output will be parsed and type-checked according to the provided schema instance, so make sure all fields in your output match the schema exactly and there are no trailing commas!

      Here is the JSON Schema instance your output must adhere to. Include the enclosing markdown codeblock:
      \`\`\`json
      {"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"answer":{"type":"string","description":"answer to the user's question"},"sources":{"type":"array","items":{"type":"string"},"description":"sources used to answer the question, should be websites."}},"required":["answer","sources"],"additionalProperties":false}
      \`\`\`
      "
    `);
  });
});

describe("StructuredOutputParser.fromZodSchema", () => {
  test("complex nested object with optional dates and native enum", async () => {
    const parser = StructuredOutputParser.fromZodSchema(
      z
        .object({
          url: z.string().describe("A link to the resource"),
          title: z.string().describe("A title for the resource"),
          year: z.number().describe("The year the resource was created"),
          createdAt: z
            .string()
            .describe("The date and time the resource was created"),
          createdAtDate: z
            .string()
            .describe("The date the resource was created")
            .optional(),
          authors: z.array(
            z.object({
              name: z.string().describe("The name of the author"),
              email: z.string().describe("The email of the author"),
              type: z.enum(["author", "editor"]).optional(),
              address: z
                .string()
                .optional()
                .describe("The address of the author"),
              stateProvince: z
                .nativeEnum(StateProvinceEnum)
                .optional()
                .describe("The state or province of the author"),
            })
          ),
        })
        .describe("Only One object")
    );

    expect(
      await parser.parse(
        '```\n{"url": "value", "title": "value", "year": 2011, "createdAt": "2023-03-29T16:07:09.600Z", "createdAtDate": "2023-03-29", "authors": [{"name": "value", "email": "value", "stateProvince": "AZ"}]}```'
      )
    ).toEqual({
      url: "value",
      title: "value",
      year: 2011,
      createdAt: "2023-03-29T16:07:09.600Z",
      createdAtDate: "2023-03-29",
      authors: [{ name: "value", email: "value", stateProvince: "AZ" }],
    });

    expect(parser.getFormatInstructions()).toMatchInlineSnapshot(`
      "You must format your output as a JSON value that adheres to a given "JSON Schema" instance.

      "JSON Schema" is a declarative language that allows you to annotate and validate JSON documents.

      For example, the example "JSON Schema" instance {{"properties": {{"foo": {{"description": "a list of test words", "type": "array", "items": {{"type": "string"}}}}}}, "required": ["foo"]}}
      would match an object with one required property, "foo". The "type" property specifies "foo" must be an "array", and the "description" property semantically describes it as "a list of test words". The items within "foo" must be strings.
      Thus, the object {{"foo": ["bar", "baz"]}} is a well-formatted instance of this example "JSON Schema". The object {{"properties": {{"foo": ["bar", "baz"]}}}} is not well-formatted.

      Your output will be parsed and type-checked according to the provided schema instance, so make sure all fields in your output match the schema exactly and there are no trailing commas!

      Here is the JSON Schema instance your output must adhere to. Include the enclosing markdown codeblock:
      \`\`\`json
      {"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"url":{"type":"string","description":"A link to the resource"},"title":{"type":"string","description":"A title for the resource"},"year":{"type":"number","description":"The year the resource was created"},"createdAt":{"type":"string","description":"The date and time the resource was created"},"createdAtDate":{"type":"string","description":"The date the resource was created"},"authors":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string","description":"The name of the author"},"email":{"type":"string","description":"The email of the author"},"type":{"type":"string","enum":["author","editor"]},"address":{"description":"The address of the author","type":"string"},"stateProvince":{"description":"The state or province of the author","type":"string","enum":["AL","AK","AZ"]}},"required":["name","email"],"additionalProperties":false}}},"required":["url","title","year","createdAt","authors"],"additionalProperties":false,"description":"Only One object"}
      \`\`\`
      "
    `);
  });
});

describe("StructuredOutputParser.fromZodSchema parsing newlines", () => {
  const assertValid = async (schema: InteropZodType) => {
    const parser = StructuredOutputParser.fromZodSchema(schema);

    expect(
      await parser.parse(
        '```\n{"url": "value", "summary": "line1,\nline2,\nline3"}```'
      )
    ).toEqual({
      url: "value",
      summary: "line1,\nline2,\nline3",
    });
  };

  test("preserves newlines inside string fields", async () => {
    await assertValid(
      z.object({
        url: z.string().describe("A link to the resource"),
        summary: z.string().describe("A summary"),
      })
    );
  });
});

// https://github.com/langchain-ai/langchainjs/issues/8339
describe("StructuredOutputParser.fromZodSchema parsing json with backticks", () => {
  const markdownBioSchema = z.object({
    name: z.string().describe("Name"),
    biograph: z.string().describe("Biograph in markdown"),
  });

  describe("without backticks", () => {
    const output =
      '{"name": "John Doe", "biograph": "john doe is a cool dude"}';
    test("parses raw json object", async () => {
      const parser = StructuredOutputParser.fromZodSchema(markdownBioSchema);
      const result = await parser.parse(output);
      expect(result).toHaveProperty("name", "John Doe");
      expect(result).toHaveProperty("biograph", "john doe is a cool dude");
    });
  });
  describe("with outer backticks", () => {
    const output =
      '```json\n{"name": "John Doe", "biograph": "john doe is a cool dude"}```';
    test("strips fenced json block", async () => {
      const parser = StructuredOutputParser.fromZodSchema(markdownBioSchema);
      const result = await parser.parse(output);
      expect(result).toHaveProperty("name", "John Doe");
      expect(result).toHaveProperty("biograph", "john doe is a cool dude");
    });
  });
  describe("with inner backticks", () => {
    const output =
      '{"name": "John Doe", "biograph": "john doe is a ```cool dude```"}';
    test("preserves backticks inside string values", async () => {
      const parser = StructuredOutputParser.fromZodSchema(markdownBioSchema);
      const result = await parser.parse(output);
      expect(result).toHaveProperty("name", "John Doe");
      expect(result).toHaveProperty(
        "biograph",
        "john doe is a ```cool dude```"
      );
    });
  });
});
