import express, { Router } from 'express';
import { Pool } from 'pg';
import { AuthRequest, verifyToken, checkRole } from '../middleware/auth';
import { validateSchoolName } from '../utils/validators';
import { handleError, ValidationError, NotFoundError } from '../utils/errors';
import { queryOne, queryAll, queryExecute, generateId } from '../utils/db';

export const createSchoolsRoutes = (pool: Pool): Router => {
  const router = express.Router();

  // Apply authentication to all routes
  router.use(verifyToken);

  /**
   * GET /api/v1/schools
   * Get current school details
   */
  router.get('/', async (req: AuthRequest, res) => {
    try {
      const school = await queryOne(
        pool,
        `SELECT id, name, email, subscription_plan, logo_url, created_at, updated_at
         FROM schools WHERE id = $1`,
        [req.user!.school_id]
      );

      if (!school) {
        throw new NotFoundError('School');
      }

      res.json(school);
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * PUT /api/v1/schools
   * Update school details (admin only)
   */
  router.put('/', checkRole(['admin']), async (req: AuthRequest, res) => {
    try {
      const { name, logo_url } = req.body;

      if (name) {
        validateSchoolName(name);
      }

      const school = await queryExecute(
        pool,
        `UPDATE schools 
         SET name = COALESCE($1, name),
             logo_url = COALESCE($2, logo_url),
             updated_at = NOW()
         WHERE id = $3
         RETURNING id, name, email, subscription_plan, logo_url, created_at, updated_at`,
        [name || null, logo_url || null, req.user!.school_id]
      );

      if (!school) {
        throw new NotFoundError('School');
      }

      res.json(school);
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * GET /api/v1/schools/stats
   * Get school statistics
   */
  router.get('/stats', async (req: AuthRequest, res) => {
    try {
      const stats = await queryOne(
        pool,
        `SELECT 
           (SELECT COUNT(*) FROM classes WHERE school_id = $1) as class_count,
           (SELECT COUNT(*) FROM pupils WHERE school_id = $1) as pupil_count,
           (SELECT COUNT(*) FROM users WHERE school_id = $1) as user_count,
           (SELECT COUNT(*) FROM subjects WHERE school_id = $1) as subject_count
         FROM schools WHERE id = $1`,
        [req.user!.school_id]
      );

      res.json(stats || {});
    } catch (error) {
      handleError(error, res);
    }
  });

  return router;
};
