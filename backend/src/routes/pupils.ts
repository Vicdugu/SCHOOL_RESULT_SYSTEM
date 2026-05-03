import express, { Router } from 'express';
import { Pool } from 'pg';
import { AuthRequest, verifyToken, checkRole } from '../middleware/auth';
import { validatePupilName } from '../utils/validators';
import { handleError, ValidationError, NotFoundError } from '../utils/errors';
import { queryOne, queryAll, queryExecute, generateId } from '../utils/db';

export const createPupilsRoutes = (pool: Pool): Router => {
  const router = express.Router();

  // Apply authentication to all routes
  router.use(verifyToken);

  /**
   * GET /api/v1/pupils
   * List pupils (optionally filtered by class)
   */
  router.get('/', async (req: AuthRequest, res) => {
    try {
      const { class_id } = req.query;

      let query = `SELECT id, name, registration_number, class_id, created_at, updated_at
                   FROM pupils 
                   WHERE school_id = $1`;
      const params: any[] = [req.user!.school_id];

      if (class_id) {
        // Verify teacher has access to this class
        if (req.user!.role === 'teacher') {
          const classAccess = await queryOne(
            pool,
            `SELECT id FROM classes WHERE id = $1 AND school_id = $2 AND teacher_id = $3`,
            [class_id, req.user!.school_id, req.user!.id]
          );

          if (!classAccess) {
            throw new ValidationError('You do not have access to this class');
          }
        }

        query += ` AND class_id = $${params.length + 1}`;
        params.push(class_id);
      }

      query += ` ORDER BY name ASC`;

      const pupils = await queryAll(pool, query, params);
      res.json(pupils);
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * GET /api/v1/pupils/:id
   * Get pupil details
   */
  router.get('/:id', async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const pupil = await queryOne(
        pool,
        `SELECT id, name, registration_number, class_id, created_at, updated_at
         FROM pupils 
         WHERE id = $1 AND school_id = $2`,
        [id, req.user!.school_id]
      );

      if (!pupil) {
        throw new NotFoundError('Pupil');
      }

      // Check teacher access
      if (req.user!.role === 'teacher') {
        const classAccess = await queryOne(
          pool,
          `SELECT id FROM classes WHERE id = $1 AND teacher_id = $2`,
          [pupil.class_id, req.user!.id]
        );

        if (!classAccess) {
          throw new ValidationError('You do not have access to this pupil');
        }
      }

      res.json(pupil);
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * POST /api/v1/pupils
   * Create new pupil (admin and teachers can add to their classes)
   */
  router.post('/', async (req: AuthRequest, res) => {
    try {
      const { name, registration_number, class_id } = req.body;

      validatePupilName(name);

      if (!class_id) {
        throw new ValidationError('Class ID is required');
      }

      // Verify class exists and user has access
      let query = `SELECT id FROM classes WHERE id = $1 AND school_id = $2`;
      const params: any[] = [class_id, req.user!.school_id];

      if (req.user!.role === 'teacher') {
        query += ` AND teacher_id = $3`;
        params.push(req.user!.id);
      }

      const classData = await queryOne(pool, query, params);

      if (!classData) {
        throw new ValidationError('Class not found or you do not have access');
      }

      // Check if registration number is unique in school
      if (registration_number) {
        const existing = await queryOne(
          pool,
          `SELECT id FROM pupils WHERE school_id = $1 AND registration_number = $2`,
          [req.user!.school_id, registration_number]
        );

        if (existing) {
          throw new ValidationError('Registration number already exists');
        }
      }

      const pupilId = generateId();

      const pupil = await queryExecute(
        pool,
        `INSERT INTO pupils (id, school_id, class_id, name, registration_number, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id, name, registration_number, class_id, created_at, updated_at`,
        [pupilId, req.user!.school_id, class_id, name, registration_number || null]
      );

      res.status(201).json(pupil);
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * PUT /api/v1/pupils/:id
   * Update pupil
   */
  router.put('/:id', async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { name, registration_number } = req.body;

      // Verify pupil exists
      const pupil = await queryOne(
        pool,
        `SELECT id, class_id FROM pupils WHERE id = $1 AND school_id = $2`,
        [id, req.user!.school_id]
      );

      if (!pupil) {
        throw new NotFoundError('Pupil');
      }

      // Check teacher access
      if (req.user!.role === 'teacher') {
        const classAccess = await queryOne(
          pool,
          `SELECT id FROM classes WHERE id = $1 AND teacher_id = $2`,
          [pupil.class_id, req.user!.id]
        );

        if (!classAccess) {
          throw new ValidationError('You do not have access to this pupil');
        }
      }

      if (name) {
        validatePupilName(name);
      }

      // Check registration number uniqueness if changing
      if (registration_number && registration_number !== pupil.registration_number) {
        const existing = await queryOne(
          pool,
          `SELECT id FROM pupils WHERE school_id = $1 AND registration_number = $2 AND id != $3`,
          [req.user!.school_id, registration_number, id]
        );

        if (existing) {
          throw new ValidationError('Registration number already exists');
        }
      }

      const updated = await queryExecute(
        pool,
        `UPDATE pupils 
         SET name = COALESCE($1, name),
             registration_number = COALESCE($2, registration_number),
             updated_at = NOW()
         WHERE id = $3 AND school_id = $4
         RETURNING id, name, registration_number, class_id, created_at, updated_at`,
        [name || null, registration_number || null, id, req.user!.school_id]
      );

      res.json(updated);
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * DELETE /api/v1/pupils/:id
   * Delete pupil (admin only)
   */
  router.delete('/:id', checkRole(['admin']), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const deleted = await queryExecute(
        pool,
        `DELETE FROM pupils WHERE id = $1 AND school_id = $2 RETURNING id`,
        [id, req.user!.school_id]
      );

      if (!deleted) {
        throw new NotFoundError('Pupil');
      }

      res.json({ message: 'Pupil deleted successfully' });
    } catch (error) {
      handleError(error, res);
    }
  });

  return router;
};
