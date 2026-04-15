/* oxlint-disable @typescript-eslint/no-explicit-any */

import {
  parse,
  parseAsync,
  globalRegistry,
  util,
  clone,
  _unknown,
  _never,
  $ZodUnknown,
  $ZodNever,
  $ZodOptional,
} from "zod/v4/core";

// Internal-only type import – used for casts inside function bodies.
// Never appears in exported type signatures, so it won't leak into
// downstream .d.ts files or trigger cross-version structural comparisons.
import type * as z4 from "zod/v4/core";

import { SerializableSchema } from "../standard_schema.js";

// Public API uses structural interfaces (no nominal `zod` imports in exported
// `.d.ts`) so TypeScript stays fast when consumers hoist duplicate `zod@4`
// copies. Real `$ZodType` instances remain assignable to these shapes.

export interface ZodV4Internals<O = any, I = any> {
  def: any;
  output: O;
  input: I;
  [key: string]: any;
}

export interface ZodV4Like<Output = any, Input = Output> {
  _zod: ZodV4Internals<Output, Input>;
  "~standard"?: any;
}

export interface ZodV4ObjectLike extends ZodV4Like {
  _zod: ZodV4Internals & {
    def: { type: "object"; shape: Record<string, any>; [key: string]: any };
  };
}

export interface ZodV4ArrayLike extends ZodV4Like {
  _zod: ZodV4Internals & {
    def: { type: "array"; element: ZodV4Like; [key: string]: unknown };
  };
}

export interface ZodV4OptionalLike extends ZodV4Like {
  _zod: ZodV4Internals & {
    def: { type: "optional"; innerType: ZodV4Like; [key: string]: unknown };
  };
}

export interface ZodV4NullableLike extends ZodV4Like {
  _zod: ZodV4Internals & {
    def: { type: "nullable"; innerType: ZodV4Like; [key: string]: unknown };
  };
}

export interface ZodV4PipeLike extends ZodV4Like {
  _zod: ZodV4Internals & {
    def: { type: "pipe"; in: InteropZodType; [key: string]: unknown };
    [key: string]: unknown;
  };
}

// Aliases (Zod v4 only; names kept where downstream generics reference them)

export type ZodStringV4 = ZodV4Like<string, unknown>;
/** @deprecated Use ZodStringV4 — Zod v3 is no longer supported. */
export type ZodStringV3 = ZodStringV4;

export type ZodObjectV4 = ZodV4ObjectLike;
/** @deprecated Use ZodObjectV4 — Zod v3 is no longer supported. */
export type ZodObjectV3 = ZodObjectV4;

export type ZodObjectV4Classic = ZodV4ObjectLike;
export type ZodObjectMain = ZodV4ObjectLike;

export type ZodDefaultV4<T extends ZodV4Like> = ZodV4Like<
  T extends ZodV4Like<infer O, any> ? O : any
>;
export type ZodOptionalV4<T extends ZodV4Like> = ZodV4Like<
  T extends ZodV4Like<infer O, any> ? O | undefined : any
>;
export type ZodNullableV4<T extends ZodV4Like> = ZodV4Like<
  T extends ZodV4Like<infer O, any> ? O | null : any
>;

export type InteropZodType<Output = any, Input = Output> = ZodV4Like<
  Output,
  Input
>;

export type InteropZodObject = ZodV4ObjectLike;

export type InteropZodDefault<T extends InteropZodObject = InteropZodObject> =
  ZodDefaultV4<T>;

export type InteropZodOptional<T extends InteropZodObject = InteropZodObject> =
  ZodOptionalV4<T>;

export type InteropZodObjectShape<
  T extends InteropZodObject = InteropZodObject,
> = T extends ZodV4ObjectLike
  ? { [K in keyof T["_zod"]["def"]["shape"]]: T["_zod"]["def"]["shape"][K] }
  : never;

export interface InteropZodIssue {
  message: string;
  path: (string | number)[];
  [key: string]: unknown;
}

export type InferInteropZodInput<T> =
  T extends ZodV4Like<unknown, infer Input>
    ? Input
    : T extends { _zod: { input: infer Input } }
      ? Input
      : never;

export type InferInteropZodOutput<T> =
  T extends ZodV4Like<infer Output, unknown>
    ? Output
    : T extends { _zod: { output: infer Output } }
      ? Output
      : never;

export type InteropZodLiteral = ZodV4Like;

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export function isZodSchemaV4(
  schema: unknown
): schema is ZodV4Like<unknown, unknown> {
  if (typeof schema !== "object" || schema === null) {
    return false;
  }

  const obj = schema as Record<string, unknown>;
  if (!("_zod" in obj)) {
    return false;
  }

  const zod = obj._zod;
  return (
    typeof zod === "object" &&
    zod !== null &&
    "def" in (zod as Record<string, unknown>)
  );
}

/**
 * @deprecated Zod v3 is no longer supported; always returns `false`.
 * Kept so packages (e.g. `@langchain/langgraph`) that import this symbol keep working.
 */
export function isZodSchemaV3(_schema: unknown): boolean {
  return false;
}

/** @deprecated Use isZodSchemaV4. */
export function isZodSchema<
  RunOutput extends Record<string, unknown> = Record<string, unknown>,
>(
  schema: ZodV4Like<RunOutput> | Record<string, unknown>
): schema is ZodV4Like<RunOutput> {
  return isZodSchemaV4(schema);
}

export function isInteropZodSchema(input: unknown): input is InteropZodType {
  if (!input) {
    return false;
  }
  if (typeof input !== "object") {
    return false;
  }
  if (Array.isArray(input)) {
    return false;
  }
  return isZodSchemaV4(input);
}

export function isZodLiteralV4(obj: unknown): obj is ZodV4Like {
  if (!isZodSchemaV4(obj)) return false;
  if (
    typeof obj === "object" &&
    obj !== null &&
    "_zod" in obj &&
    typeof obj._zod === "object" &&
    obj._zod !== null &&
    "def" in obj._zod &&
    typeof obj._zod.def === "object" &&
    obj._zod.def !== null &&
    "type" in obj._zod.def &&
    obj._zod.def.type === "literal"
  ) {
    return true;
  }
  return false;
}

export function isInteropZodLiteral(obj: unknown): obj is InteropZodLiteral {
  return isZodLiteralV4(obj);
}

type InteropZodSafeParseResult<T> =
  | { success: true; data: T; error?: never }
  | { success: false; error: InteropZodError; data?: never };

export interface InteropZodError {
  issues: InteropZodIssue[];
}

export async function interopSafeParseAsync<T>(
  schema: InteropZodType<T>,
  input: unknown
): Promise<InteropZodSafeParseResult<T>> {
  if (isZodSchemaV4(schema)) {
    try {
      const data = await parseAsync(schema as z4.$ZodType<T>, input);
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error as InteropZodError,
      };
    }
  }
  throw new Error("Schema must be a Zod v4 schema (zod/v4)");
}

export async function interopParseAsync<T>(
  schema: InteropZodType<T>,
  input: unknown
): Promise<T> {
  if (isZodSchemaV4(schema)) {
    return await parseAsync(schema as z4.$ZodType<T>, input);
  }
  throw new Error("Schema must be a Zod v4 schema (zod/v4)");
}

export function interopSafeParse<T>(
  schema: InteropZodType<T>,
  input: unknown
): InteropZodSafeParseResult<T> {
  if (isZodSchemaV4(schema)) {
    try {
      const data = parse(schema as z4.$ZodType<T>, input);
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error as InteropZodError,
      };
    }
  }
  throw new Error("Schema must be a Zod v4 schema (zod/v4)");
}

export function interopParse<T>(schema: InteropZodType<T>, input: unknown): T {
  if (isZodSchemaV4(schema)) {
    return parse(schema as z4.$ZodType<T>, input);
  }
  throw new Error("Schema must be a Zod v4 schema (zod/v4)");
}

export function getSchemaDescription(
  schema: SerializableSchema | InteropZodType<unknown> | Record<string, unknown>
): string | undefined {
  if (isZodSchemaV4(schema)) {
    return globalRegistry.get(schema as z4.$ZodType)?.description;
  }
  if ("description" in schema && typeof schema.description === "string") {
    return schema.description;
  }
  return undefined;
}

export function isShapelessZodSchema(schema: unknown): boolean {
  if (!isInteropZodSchema(schema)) {
    return false;
  }

  const def = schema._zod.def;

  if (def.type === "object") {
    const shape = def.shape as Record<string, unknown> | undefined;
    return !shape || Object.keys(shape).length === 0;
  }

  if (def.type === "record") {
    return true;
  }

  return true;
}

export function isSimpleStringZodSchema(
  schema: unknown
): schema is InteropZodType<string | undefined> {
  if (!isInteropZodSchema(schema)) {
    return false;
  }

  const def = schema._zod.def;

  return def.type === "string";
}

export function isZodObjectV4(obj: unknown): obj is ZodV4ObjectLike {
  if (!isZodSchemaV4(obj)) return false;
  if (
    typeof obj === "object" &&
    obj !== null &&
    "_zod" in obj &&
    typeof obj._zod === "object" &&
    obj._zod !== null &&
    "def" in obj._zod &&
    typeof obj._zod.def === "object" &&
    obj._zod.def !== null &&
    "type" in obj._zod.def &&
    obj._zod.def.type === "object"
  ) {
    return true;
  }
  return false;
}

export function isZodArrayV4(obj: unknown): obj is ZodV4ArrayLike {
  if (!isZodSchemaV4(obj)) return false;
  if (
    typeof obj === "object" &&
    obj !== null &&
    "_zod" in obj &&
    typeof obj._zod === "object" &&
    obj._zod !== null &&
    "def" in obj._zod &&
    typeof obj._zod.def === "object" &&
    obj._zod.def !== null &&
    "type" in obj._zod.def &&
    obj._zod.def.type === "array"
  ) {
    return true;
  }
  return false;
}

export function isZodOptionalV4(obj: unknown): obj is ZodV4OptionalLike {
  if (!isZodSchemaV4(obj)) return false;
  if (
    typeof obj === "object" &&
    obj !== null &&
    "_zod" in obj &&
    typeof obj._zod === "object" &&
    obj._zod !== null &&
    "def" in obj._zod &&
    typeof obj._zod.def === "object" &&
    obj._zod.def !== null &&
    "type" in obj._zod.def &&
    obj._zod.def.type === "optional"
  ) {
    return true;
  }
  return false;
}

export function isZodNullableV4(obj: unknown): obj is ZodV4NullableLike {
  if (!isZodSchemaV4(obj)) return false;
  if (
    typeof obj === "object" &&
    obj !== null &&
    "_zod" in obj &&
    typeof obj._zod === "object" &&
    obj._zod !== null &&
    "def" in obj._zod &&
    typeof obj._zod.def === "object" &&
    obj._zod.def !== null &&
    "type" in obj._zod.def &&
    obj._zod.def.type === "nullable"
  ) {
    return true;
  }
  return false;
}

export function isInteropZodObject(obj: unknown): obj is InteropZodObject {
  return isZodObjectV4(obj);
}

export function getInteropZodObjectShape<T extends InteropZodObject>(
  schema: T
): InteropZodObjectShape<T> {
  if (isZodSchemaV4(schema)) {
    return schema._zod.def.shape as InteropZodObjectShape<T>;
  }
  throw new Error("Schema must be a Zod v4 object schema");
}

export function extendInteropZodObject<T extends InteropZodObject>(
  schema: T,
  extension: InteropZodObjectShape
): InteropZodObject {
  if (isZodSchemaV4(schema)) {
    return util.extend(schema as z4.$ZodObject, extension);
  }
  throw new Error("Schema must be a Zod v4 object schema");
}

export function interopZodObjectPartial<T extends InteropZodObject>(
  schema: T
): InteropZodObject {
  if (isZodSchemaV4(schema)) {
    return util.partial($ZodOptional, schema as z4.$ZodObject, undefined);
  }
  throw new Error("Schema must be a Zod v4 object schema");
}

export function interopZodObjectStrict<T extends InteropZodObject>(
  schema: T,
  recursive = false
): InteropZodObject {
  if (isZodObjectV4(schema)) {
    const outputShape: Record<string, any> = schema._zod.def.shape;
    if (recursive) {
      for (const [key, keySchema] of Object.entries(schema._zod.def.shape)) {
        if (isZodObjectV4(keySchema)) {
          const outputSchema = interopZodObjectStrict(keySchema, recursive);
          outputShape[key] = outputSchema;
        } else if (isZodArrayV4(keySchema)) {
          let elementSchema = keySchema._zod.def.element;
          if (isZodObjectV4(elementSchema)) {
            elementSchema = interopZodObjectStrict(elementSchema, recursive);
          }
          outputShape[key] = clone(keySchema as unknown as z4.$ZodType, {
            ...keySchema._zod.def,
            element: elementSchema,
          });
        } else {
          outputShape[key] = keySchema;
        }
        const meta = globalRegistry.get(keySchema as z4.$ZodType);
        if (meta) globalRegistry.add(outputShape[key] as z4.$ZodType, meta);
      }
    }
    const modifiedSchema = clone<z4.$ZodObject>(schema as z4.$ZodObject, {
      ...schema._zod.def,
      shape: outputShape,
      catchall: _never($ZodNever),
    });
    const meta = globalRegistry.get(schema as unknown as z4.$ZodType);
    if (meta) globalRegistry.add(modifiedSchema, meta);
    return modifiedSchema;
  }
  throw new Error("Schema must be a Zod v4 object schema");
}

export function interopZodObjectPassthrough<T extends InteropZodObject>(
  schema: T,
  recursive: boolean = false
): InteropZodObject {
  if (isZodObjectV4(schema)) {
    const outputShape: Record<string, any> = schema._zod.def.shape;
    if (recursive) {
      for (const [key, keySchema] of Object.entries(schema._zod.def.shape)) {
        if (isZodObjectV4(keySchema)) {
          const outputSchema = interopZodObjectPassthrough(
            keySchema,
            recursive
          );
          outputShape[key] = outputSchema;
        } else if (isZodArrayV4(keySchema)) {
          let elementSchema = keySchema._zod.def.element;
          if (isZodObjectV4(elementSchema)) {
            elementSchema = interopZodObjectPassthrough(
              elementSchema,
              recursive
            ) as ZodV4ObjectLike;
          }
          outputShape[key] = clone(keySchema as unknown as z4.$ZodType, {
            ...keySchema._zod.def,
            element: elementSchema,
          });
        } else {
          outputShape[key] = keySchema;
        }
        const meta = globalRegistry.get(keySchema as z4.$ZodType);
        if (meta) globalRegistry.add(outputShape[key] as z4.$ZodType, meta);
      }
    }
    const modifiedSchema = clone<z4.$ZodObject>(schema as z4.$ZodObject, {
      ...schema._zod.def,
      shape: outputShape,
      catchall: _unknown($ZodUnknown),
    });
    const meta = globalRegistry.get(schema as unknown as z4.$ZodType);
    if (meta) globalRegistry.add(modifiedSchema, meta);
    return modifiedSchema as InteropZodObject;
  }
  throw new Error("Schema must be a Zod v4 object schema");
}

export function getInteropZodDefaultGetter<T extends InteropZodType>(
  schema: T
): (() => InferInteropZodOutput<T>) | undefined {
  if (isZodSchemaV4(schema)) {
    try {
      const defaultValue = parse(schema as z4.$ZodType, undefined);
      return () => defaultValue as InferInteropZodOutput<T>;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function isZodTransformV4(schema: InteropZodType): schema is ZodV4PipeLike {
  return isZodSchemaV4(schema) && schema._zod.def.type === "pipe";
}

function interopZodTransformInputSchemaImpl(
  schema: InteropZodType,
  recursive: boolean,
  cache: WeakMap<InteropZodType, InteropZodType>
): InteropZodType {
  const cached = cache.get(schema);
  if (cached !== undefined) {
    return cached;
  }

  if (isZodSchemaV4(schema)) {
    let outputSchema: InteropZodType = schema;
    if (isZodTransformV4(schema)) {
      outputSchema = interopZodTransformInputSchemaImpl(
        schema._zod.def.in,
        recursive,
        cache
      );
    }
    if (recursive) {
      if (isZodObjectV4(outputSchema)) {
        const outputShape: Record<string, any> = {};
        for (const [key, keySchema] of Object.entries(
          outputSchema._zod.def.shape
        )) {
          outputShape[key] = interopZodTransformInputSchemaImpl(
            keySchema as InteropZodType,
            recursive,
            cache
          );
        }
        outputSchema = clone<z4.$ZodObject>(outputSchema as z4.$ZodObject, {
          ...outputSchema._zod.def,
          shape: outputShape,
        }) as InteropZodType;
      } else if (isZodArrayV4(outputSchema)) {
        const elementSchema = interopZodTransformInputSchemaImpl(
          outputSchema._zod.def.element as InteropZodType,
          recursive,
          cache
        );
        outputSchema = clone<z4.$ZodArray>(
          outputSchema as unknown as z4.$ZodArray,
          {
            ...outputSchema._zod.def,
            element: elementSchema as z4.$ZodType,
          }
        ) as InteropZodType;
      } else if (isZodOptionalV4(outputSchema)) {
        const innerSchema = interopZodTransformInputSchemaImpl(
          outputSchema._zod.def.innerType as InteropZodType,
          recursive,
          cache
        );
        outputSchema = clone<z4.$ZodOptional>(
          outputSchema as unknown as z4.$ZodOptional,
          {
            ...outputSchema._zod.def,
            innerType: innerSchema as z4.$ZodType,
          }
        ) as InteropZodType;
      } else if (isZodNullableV4(outputSchema)) {
        const innerSchema = interopZodTransformInputSchemaImpl(
          outputSchema._zod.def.innerType as InteropZodType,
          recursive,
          cache
        );
        outputSchema = clone<z4.$ZodNullable>(
          outputSchema as unknown as z4.$ZodNullable,
          {
            ...outputSchema._zod.def,
            innerType: innerSchema as z4.$ZodType,
          }
        ) as InteropZodType;
      }
    }
    const meta = globalRegistry.get(schema as z4.$ZodType);
    if (meta) globalRegistry.add(outputSchema as z4.$ZodType, meta);
    cache.set(schema, outputSchema);
    return outputSchema;
  }

  throw new Error("Schema must be a Zod v4 schema (zod/v4)");
}

export function interopZodTransformInputSchema(
  schema: InteropZodType,
  recursive = false
): InteropZodType {
  const cache = new WeakMap<InteropZodType, InteropZodType>();
  return interopZodTransformInputSchemaImpl(schema, recursive, cache);
}

export function interopZodObjectMakeFieldsOptional<T extends InteropZodObject>(
  schema: T,
  predicate: (key: string, value: InteropZodType) => boolean
): InteropZodObject {
  if (isZodSchemaV4(schema)) {
    const shape = getInteropZodObjectShape(schema as InteropZodObject);
    const outputShape: Record<string, any> = {
      ...schema._zod.def.shape,
    };

    for (const [key, value] of Object.entries(shape)) {
      if (predicate(key, value as InteropZodType)) {
        outputShape[key] = new $ZodOptional({
          type: "optional" as const,
          innerType: value as z4.$ZodType,
        });
      }
    }

    const modifiedSchema = clone<z4.$ZodObject>(schema as z4.$ZodObject, {
      ...schema._zod.def,
      shape: outputShape,
    });

    const meta = globalRegistry.get(schema as unknown as z4.$ZodType);
    if (meta) globalRegistry.add(modifiedSchema, meta);

    return modifiedSchema as InteropZodObject;
  }

  throw new Error("Schema must be a Zod v4 object schema");
}

export function isInteropZodError(e: unknown) {
  return (
    // oxlint-disable-next-line no-instanceof/no-instanceof
    e instanceof Error &&
    (e.constructor.name === "ZodError" || e.constructor.name === "$ZodError")
  );
}
