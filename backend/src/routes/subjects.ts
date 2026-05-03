import express, { Router } from 'express';
import { Pool } from 'pg';
import { AuthRequest, verifyToken, checkRole } from '../middleware/auth';
import { validateSubjectName, validateScore } from '../utils/validators';
import { handleError, ValidationError, NotFoundError } from '../utils/errors';
import { queryOne, queryAll, queryExecute, generateId } from '../utils/db';

export const createSubjectsRoutes = (pool: Pool): Router => {
  const router = express.Router();

  // Apply authentication to all routes
  router.use(verifyToken);

  /**
   * GET /api/v1/subjects
   * List all subjects in school
   */
  router.get('/', async (req: AuthRequest, res) => {
    try {
      const subjects = await queryAll(
        pool,
        `SELECT id, name, max_score, ca_max, exam_max, created_at, updated_at
         FROM subjects 
         WHERE school_id = $1
         ORDER BY name ASC`,
        [req.user!.school_id]
      );

      res.json(subjects);
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * GET /api/v1/subjects/:id
   * Get subject details
   */
  router.get('/:id', async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const subject = await queryOne(
        pool,
        `SELECT id, name, max_score, ca_max, exam_max, created_at, updated_at
         FROM subjects 
         WHERE id = $1 AND school_id = $2`,
        [id, req.user!.school_id]
      );

      if (!subject) {
        throw new NotFoundError('Subject');
      }

      res.json(subject);
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * POST /api/v1/subjects
   * Create new subject (admin only)
   */
  router.post('/', checkRole(['admin']), async (req: AuthRequest, res) => {
    try {
      const { name, max_score = 100, ca_max = 40, exam_max = 60 } = req.body;

      validateSubjectName(name);
      validateScore(max_score);
      validateScore(ca_max);
      validateScore(exam_max);

      // Verify totals match
      if (ca_max + exam_max !== max_score) {
        throw new ValidationError(
          `CA max (${ca_max}) + Exam max (${exam_max}) must equal total max (${max_score})`
        );
      }

      // Check if subject already exists
      const existing = await queryOne(
        pool,
        `SELECT id FROM subjects WHERE school_id = $1 AND LOWER(name) = LOWER($2)`,
        [req.user!.school_id, name]
      );

      if (existing) {
        throw new ValidationError('Subject already exists');
      }

      const subjectId = generateId();

      const subject = await queryExecute(
        pool,
        `INSERT INTO subjects (id, school_id, name, max_score, ca_max, exam_max, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id, name, max_score, ca_max, exam_max, created_at, updated_at`,
        [subjectId, req.user!.school_id, name, max_score, ca_max, exam_max]
      );

      res.status(201).json(subject);
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * PUT /api/v1/subjects/:id
   * Update subject (admin only)
   */
  router.put('/:id', checkRole(['admin']), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { name, max_score, ca_max, exam_max } = req.body;

      // Verify subject exists
      const subject = await queryOne(
        pool,
        `SELECT id FROM subjects WHERE id = $1 AND school_id = $2`,
        [id, req.user!.school_id]
      );

      if (!subject) {
        throw new NotFoundError('Subject');
      }

      if (name) {
        validateSubjectName(name);
      }

      if (max_score !== undefined) {
        validateScore(max_score);
      }

      if (ca_max !== undefined) {
        validateScore(ca_max);
      }

      if (exam_max !== undefined) {
        validateScore(exam_max);
      }

      // Verify totals match if updating scores
      if (
        max_score !== undefined &&
        ca_max !== undefined &&
        exam_max !== undefined
      ) {
        if (ca_max + exam_max !== max_score) {
          throw new ValidationError(
            `CA max (${ca_max}) + Exam max (${exam_max}) must equal total max (${max_score})`
          );
        }
      }

      const updated = await queryExecute(
        pool,
        `UPDATE subjects 
         SET name = COALESCE($1, name),
             max_score = COALESCE($2, max_score),
             ca_max = COALESCE($3, ca_max),
             exam_max = COALESCE($4, exam_max),
             updated_at = NOW()
         WHERE id = $5 AND school_id = $6
         RETURNING id, name, max_score, ca_max, exam_max, created_at, updated_at`,
        [
          name || null,
          max_score !== undefined ? max_score : null,
          ca_max !== undefined ? ca_max : null,
          exam_max !== undefined ? exam_max : null,
          id,
          req.user!.school_id,
        ]
      );

      res.json(updated);
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * DELETE /api/v1/subjects/:id
   * Delete subject (admin only)
   */
  router.delete('/:id', checkRole(['admin']), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const deleted = await queryExecute(
        pool,
        `DELETE FROM subjects WHERE id = $1 AND school_id = $2 RETURNING id`,
        [id, req.user!.school_id]
      );

      if (!deleted) {
        throw new NotFoundError('Subject');
      }

      res.json({ message: 'Subject deleted successfully' });
    } catch (error) {
      handleError(error, res);
    }
  });

  return router;
};
