import express, { Router } from 'express';
import { Pool } from 'pg';
import { AuthRequest, verifyToken, checkRole } from '../middleware/auth';
import { validateClassName, validateTerm } from '../utils/validators';
import { handleError, ValidationError, NotFoundError } from '../utils/errors';
import { queryOne, queryAll, queryExecute, generateId } from '../utils/db';

export const createClassesRoutes = (pool: Pool): Router => {
  const router = express.Router();

  // Apply authentication to all routes
  router.use(verifyToken);

  /**
   * GET /api/v1/classes
   * List all classes in school
   */
  router.get('/', async (req: AuthRequest, res) => {
    try {
      const { teacher_id } = req.query;

      let query = `SELECT id, name, teacher_id, academic_year, term, created_at, updated_at
                   FROM classes 
                   WHERE school_id = $1`;
      const params: any[] = [req.user!.school_id];

      // Teachers can only see their own classes
      if (req.user!.role === 'teacher') {
        query += ` AND teacher_id = $2`;
        params.push(req.user!.id);
      } else if (teacher_id) {
        query += ` AND teacher_id = $${params.length + 1}`;
        params.push(teacher_id);
      }

      query += ` ORDER BY name ASC`;

      const classes = await queryAll(pool, query, params);
      res.json(classes);
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * GET /api/v1/classes/:id
   * Get class details
   */
  router.get('/:id', async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      let query = `SELECT id, name, teacher_id, academic_year, term, created_at, updated_at
                   FROM classes 
                   WHERE id = $1 AND school_id = $2`;
      const params: any[] = [id, req.user!.school_id];

      // Teachers can only see their own classes
      if (req.user!.role === 'teacher') {
        query += ` AND teacher_id = $3`;
        params.push(req.user!.id);
      }

      const classData = await queryOne(pool, query, params);

      if (!classData) {
        throw new NotFoundError('Class');
      }

      res.json(classData);
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * POST /api/v1/classes
   * Create new class (admin only)
   */
  router.post('/', checkRole(['admin']), async (req: AuthRequest, res) => {
    try {
      const { name, teacher_id, academic_year, term } = req.body;

      validateClassName(name);
      validateTerm(term);

      if (!academic_year) {
        throw new ValidationError('Academic year is required');
      }

      // Verify teacher exists in school
      if (teacher_id) {
        const teacher = await queryOne(
          pool,
          `SELECT id FROM users WHERE id = $1 AND school_id = $2 AND role = 'teacher'`,
          [teacher_id, req.user!.school_id]
        );

        if (!teacher) {
          throw new ValidationError('Teacher not found in school');
        }
      }

      const classId = generateId();

      const classData = await queryExecute(
        pool,
        `INSERT INTO classes (id, school_id, name, teacher_id, academic_year, term, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id, name, teacher_id, academic_year, term, created_at, updated_at`,
        [classId, req.user!.school_id, name, teacher_id || null, academic_year, term]
      );

      res.status(201).json(classData);
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * PUT /api/v1/classes/:id
   * Update class (admin only)
   */
  router.put('/:id', checkRole(['admin']), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { name, teacher_id, term } = req.body;

      // Verify class exists
      const classData = await queryOne(
        pool,
        `SELECT id FROM classes WHERE id = $1 AND school_id = $2`,
        [id, req.user!.school_id]
      );

      if (!classData) {
        throw new NotFoundError('Class');
      }

      if (name) {
        validateClassName(name);
      }

      if (term) {
        validateTerm(term);
      }

      // Verify teacher if provided
      if (teacher_id) {
        const teacher = await queryOne(
          pool,
          `SELECT id FROM users WHERE id = $1 AND school_id = $2 AND role = 'teacher'`,
          [teacher_id, req.user!.school_id]
        );

        if (!teacher) {
          throw new ValidationError('Teacher not found in school');
        }
      }

      const updated = await queryExecute(
        pool,
        `UPDATE classes 
         SET name = COALESCE($1, name),
             teacher_id = CASE WHEN $2::text IS NOT NULL THEN $2 ELSE teacher_id END,
             term = COALESCE($3, term),
             updated_at = NOW()
         WHERE id = $4 AND school_id = $5
         RETURNING id, name, teacher_id, academic_year, term, created_at, updated_at`,
        [name || null, teacher_id || null, term || null, id, req.user!.school_id]
      );

      res.json(updated);
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * DELETE /api/v1/classes/:id
   * Delete class (admin only)
   */
  router.delete('/:id', checkRole(['admin']), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const deleted = await queryExecute(
        pool,
        `DELETE FROM classes WHERE id = $1 AND school_id = $2 RETURNING id`,
        [id, req.user!.school_id]
      );

      if (!deleted) {
        throw new NotFoundError('Class');
      }

      res.json({ message: 'Class deleted successfully' });
    } catch (error) {
      handleError(error, res);
    }
  });

  return router;
};
