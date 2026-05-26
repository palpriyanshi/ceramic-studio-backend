/**
 * Zod validation middleware factory.
 * Usage: router.post("/route", validate(schema), controller)
 *
 * @param {import("zod").ZodSchema} schema
 * @param {"body" | "query" | "params"} source - which part of req to validate
 */
const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    return res.status(400).json({ success: false, errors });
  }

  // Replace req[source] with the parsed (and coerced) data
  req[source] = result.data;
  next();
};

export default validate;
