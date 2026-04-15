import { type ZodError } from "zod";
import * as z from "zod";

/**
 * Error thrown when the configuration for a retry middleware is invalid.
 */
export class InvalidRetryConfigError extends Error {
  cause: ZodError;

  constructor(error: ZodError) {
    const message = z.prettifyError(error).slice(2);
    super(message);
    this.name = "InvalidRetryConfigError";
    this.cause = error;
  }
}
