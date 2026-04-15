/* oxlint-disable @typescript-eslint/no-explicit-any */
/**
 * Draft-07 JSON Schema shapes produced by Zod's toJSONSchema and used by
 * structured output / OpenAI-style tool schemas. Extracted from the former
 * vendored zod-to-json-schema fork (types only).
 */

export type JsonSchema7Meta = {
  title?: string;
  default?: any;
  description?: string;
  markdownDescription?: string;
};

type JsonSchema7RefType = { $ref: string };

export type JsonSchema7AnyType = { $ref?: string };

export type JsonSchema7UnknownType = JsonSchema7AnyType;

export type JsonSchema7BooleanType = {
  type: "boolean";
};

export type JsonSchema7NullType = {
  type: "null";
};

export type JsonSchema7NeverType = {
  not: JsonSchema7AnyType;
};

type JsonSchema7Err = Partial<Record<string, string>>;

export type JsonSchema7StringType = {
  type: "string";
  minLength?: number;
  maxLength?: number;
  format?:
    | "email"
    | "idn-email"
    | "uri"
    | "uuid"
    | "date-time"
    | "ipv4"
    | "ipv6"
    | "date"
    | "time"
    | "duration";
  pattern?: string;
  allOf?: {
    pattern: string;
    errorMessage?: JsonSchema7Err;
  }[];
  anyOf?: {
    format: string;
    errorMessage?: JsonSchema7Err;
  }[];
  errorMessage?: JsonSchema7Err;
  contentEncoding?: string;
};

export type JsonSchema7NumberType = {
  type: "number" | "integer";
  minimum?: number;
  exclusiveMinimum?: number;
  maximum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  errorMessage?: JsonSchema7Err;
};

export type JsonSchema7BigintType = {
  type: "integer";
  format: "int64";
  minimum?: bigint;
  exclusiveMinimum?: bigint;
  maximum?: bigint;
  exclusiveMaximum?: bigint;
  multipleOf?: bigint;
  errorMessage?: JsonSchema7Err;
};

export type JsonSchema7EnumType = {
  type: "string";
  enum: string[];
};

export type JsonSchema7NativeEnumType = {
  type: "string" | "number" | ["string", "number"];
  enum: (string | number)[];
};

export type JsonSchema7LiteralType =
  | {
      type: "string" | "number" | "integer" | "boolean";
      const: string | number | boolean;
    }
  | {
      type: "object" | "array";
    };

export type JsonSchema7DateType =
  | {
      type: "integer" | "string";
      format: "unix-time" | "date-time" | "date";
      minimum?: number;
      maximum?: number;
      errorMessage?: JsonSchema7Err;
    }
  | {
      anyOf: JsonSchema7DateType[];
    };

export type JsonSchema7ObjectType = {
  type: "object";
  properties: Record<string, JsonSchema7Type>;
  additionalProperties?: boolean | JsonSchema7Type;
  required?: string[];
};

type JsonSchema7RecordPropertyNamesType =
  | Omit<JsonSchema7StringType, "type">
  | Omit<JsonSchema7EnumType, "type">;

export type JsonSchema7RecordType = {
  type: "object";
  additionalProperties?: JsonSchema7Type | true;
  propertyNames?: JsonSchema7RecordPropertyNamesType;
};

export type JsonSchema7MapType = {
  type: "array";
  maxItems: 125;
  items: {
    type: "array";
    items: [JsonSchema7Type, JsonSchema7Type];
    minItems: 2;
    maxItems: 2;
  };
};

export type JsonSchema7ArrayType = {
  type: "array";
  items?: JsonSchema7Type;
  minItems?: number;
  maxItems?: number;
  errorMessages?: JsonSchema7Err;
};

export type JsonSchema7TupleType = {
  type: "array";
  minItems: number;
  items: JsonSchema7Type[];
} & (
  | {
      maxItems: number;
    }
  | {
      additionalItems?: JsonSchema7Type;
    }
);

export type JsonSchema7AllOfType = {
  allOf: JsonSchema7Type[];
  unevaluatedProperties?: boolean;
};

export type JsonSchema7SetType = {
  type: "array";
  uniqueItems: true;
  items?: JsonSchema7Type;
  minItems?: number;
  maxItems?: number;
  errorMessage?: JsonSchema7Err;
};

export type JsonSchema7UndefinedType = {
  not: JsonSchema7AnyType;
};

type JsonSchema7Primitive =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "null";

type JsonSchema7PrimitiveUnionType =
  | {
      type: JsonSchema7Primitive | JsonSchema7Primitive[];
    }
  | {
      type: JsonSchema7Primitive | JsonSchema7Primitive[];
      enum: (string | number | bigint | boolean | null)[];
    };

type JsonSchema7AnyOfType = {
  anyOf: JsonSchema7Type[];
};

export type JsonSchema7UnionType =
  | JsonSchema7PrimitiveUnionType
  | JsonSchema7AnyOfType;

export type JsonSchema7NullableType =
  | {
      anyOf: [JsonSchema7Type, JsonSchema7NullType];
    }
  | {
      type: [string, "null"];
    };

export type JsonSchema7TypeUnion =
  | JsonSchema7StringType
  | JsonSchema7ArrayType
  | JsonSchema7NumberType
  | JsonSchema7BigintType
  | JsonSchema7BooleanType
  | JsonSchema7DateType
  | JsonSchema7EnumType
  | JsonSchema7LiteralType
  | JsonSchema7NativeEnumType
  | JsonSchema7NullType
  | JsonSchema7ObjectType
  | JsonSchema7RecordType
  | JsonSchema7TupleType
  | JsonSchema7UnionType
  | JsonSchema7UndefinedType
  | JsonSchema7RefType
  | JsonSchema7NeverType
  | JsonSchema7MapType
  | JsonSchema7AnyType
  | JsonSchema7NullableType
  | JsonSchema7AllOfType
  | JsonSchema7UnknownType
  | JsonSchema7SetType;

export type JsonSchema7Type = JsonSchema7TypeUnion & JsonSchema7Meta;

/** Alias used across LangChain for draft-07 JSON Schema objects. */
export type JSONSchema = JsonSchema7Type;
