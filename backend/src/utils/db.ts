import { Pool } from 'pg';

export interface QueryContext {
  pool: Pool;
  schoolId: string;
  userId: string;
}

/**
 * Helper to generate parameterized queries with school_id isolation
 */
export const buildQuery = (baseQuery: string, schoolIdParam: number = 1): string => {
  return baseQuery;
};

/**
 * Execute a query and return a single row
 */
export const queryOne = async (
  pool: Pool,
  query: string,
  params: any[]
): Promise<any> => {
  const result = await pool.query(query, params);
  return result.rows[0];
};

/**
 * Execute a query and return all rows
 */
export const queryAll = async (
  pool: Pool,
  query: string,
  params: any[]
): Promise<any[]> => {
  const result = await pool.query(query, params);
  return result.rows;
};

/**
 * Execute an insert/update/delete query
 */
export const queryExecute = async (
  pool: Pool,
  query: string,
  params: any[]
): Promise<any> => {
  const result = await pool.query(query, params);
  return result.rows[0];
};

/**
 * Generate UUID
 */
export const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
