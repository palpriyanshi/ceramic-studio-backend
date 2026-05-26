/**
 * @file pagination.utils.js
 * @description Reusable pagination helpers used across all list controllers.
 */

/**
 * Extracts and normalises page/limit from query params and computes skip.
 *
 * @param {import('express').Request} req
 * @param {object} [defaults]
 * @param {number} [defaults.page=1]
 * @param {number} [defaults.limit=20]
 * @returns {{ page: number, limit: number, skip: number }}
 */
export function getPaginationParams(req, defaults = {}) {
  const page  = Math.max(1, Number(req.query.page)  || defaults.page  || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || defaults.limit || 20));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Wraps a data array with standard pagination metadata.
 *
 * @param {Array}  data
 * @param {number} total - Total matching documents
 * @param {number} page
 * @param {number} limit
 * @param {string} [dataKey="data"] - Key name for the data array in the response
 * @returns {object}
 */
export function paginate(data, total, page, limit, dataKey = "data") {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    [dataKey]: data,
  };
}
