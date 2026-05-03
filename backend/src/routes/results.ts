import express, { Router } from 'express';
import { Pool } from 'pg';
import { AuthRequest, verifyToken, checkRole } from '../middleware/auth';
import {
  validateScore,
  validateObservationRating,
} from '../utils/validators';
import { handleError, ValidationError, NotFoundError } from '../utils/errors';
import { queryOne, queryAll, queryExecute, generateId } from '../utils/db';

export const createResultsRoutes = (pool: Pool): Router => {
  const router = express.Router();

  // Apply authentication to all routes
  router.use(verifyToken);

  /**
   * GET /api/v1/results
   * List results (filtered by class and/or subject)
   */
  router.get('/', async (req: AuthRequest, res) => {
    try {
      const { class_id, subject_id, pupil_id } = req.query;

      if (!class_id) {
        throw new ValidationError('class_id is required');
      }

      // Verify access to class
      let classQuery = `SELECT id, teacher_id FROM classes WHERE id = $1 AND school_id = $2`;
      const classParams: any[] = [class_id, req.user!.school_id];

      if (req.user!.role === 'teacher') {
        classQuery += ` AND teacher_id = $3`;
        classParams.push(req.user!.id);
      }

      const classData = await queryOne(pool, classQuery, classParams);

      if (!classData) {
        throw new ValidationError('You do not have access to this class');
      }

      let query = `SELECT r.id, r.pupil_id, r.subject_id, r.ca1_score, r.ca2_score, 
                          r.exam_score, r.total_score, r.created_at, r.updated_at,
                          p.name as pupil_name, s.name as subject_name
                   FROM results r
                   JOIN pupils p ON p.id = r.pupil_id
                   JOIN subjects s ON s.id = r.subject_id
                   WHERE r.school_id = $1 AND p.class_id = $2`;
      const params: any[] = [req.user!.school_id, class_id];

      if (subject_id) {
        query += ` AND r.subject_id = $${params.length + 1}`;
        params.push(subject_id);
      }

      if (pupil_id) {
        query += ` AND r.pupil_id = $${params.length + 1}`;
        params.push(pupil_id);
      }

      query += ` ORDER BY p.name, s.name`;

      const results = await queryAll(pool, query, params);
      res.json(results);
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * GET /api/v1/results/:id
   * Get result details
   */
  router.get('/:id', async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const result = await queryOne(
        pool,
        `SELECT r.id, r.pupil_id, r.subject_id, r.ca1_score, r.ca2_score, 
                r.exam_score, r.total_score, r.created_at, r.updated_at,
                p.name as pupil_name, s.name as subject_name, c.id as class_id
         FROM results r
         JOIN pupils p ON p.id = r.pupil_id
         JOIN subjects s ON s.id = r.subject_id
         JOIN classes c ON c.id = p.class_id
         WHERE r.id = $1 AND r.school_id = $2`,
        [id, req.user!.school_id]
      );

      if (!result) {
        throw new NotFoundError('Result');
      }

      // Check teacher access
      if (req.user!.role === 'teacher') {
        const classAccess = await queryOne(
          pool,
          `SELECT id FROM classes WHERE id = $1 AND teacher_id = $2`,
          [result.class_id, req.user!.id]
        );

        if (!classAccess) {
          throw new ValidationError('You do not have access to this result');
        }
      }

      res.json(result);
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * POST /api/v1/results
   * Create new result
   */
  router.post('/', async (req: AuthRequest, res) => {
    try {
      const { pupil_id, subject_id, ca1_score, ca2_score, exam_score } = req.body;

      if (!pupil_id || !subject_id) {
        throw new ValidationError('pupil_id and subject_id are required');
      }

      validateScore(ca1_score);
      validateScore(ca2_score);
      validateScore(exam_score);

      // Verify pupil and get class
      const pupil = await queryOne(
        pool,
        `SELECT class_id FROM pupils WHERE id = $1 AND school_id = $2`,
        [pupil_id, req.user!.school_id]
      );

      if (!pupil) {
        throw new ValidationError('Pupil not found');
      }

      // Check teacher access
      if (req.user!.role === 'teacher') {
        const classAccess = await queryOne(
          pool,
          `SELECT id FROM classes WHERE id = $1 AND teacher_id = $2`,
          [pupil.class_id, req.user!.id]
        );

        if (!classAccess) {
          throw new ValidationError('You do not have access to this class');
        }
      }

      // Verify subject exists
      const subject = await queryOne(
        pool,
        `SELECT id, max_score FROM subjects WHERE id = $1 AND school_id = $2`,
        [subject_id, req.user!.school_id]
      );

      if (!subject) {
        throw new ValidationError('Subject not found');
      }

      // Check if result already exists
      const existing = await queryOne(
        pool,
        `SELECT id FROM results WHERE pupil_id = $1 AND subject_id = $2`,
        [pupil_id, subject_id]
      );

      if (existing) {
        throw new ValidationError('Result already exists for this pupil and subject');
      }

      const resultId = generateId();
      const totalScore =
        (ca1_score || 0) + (ca2_score || 0) + (exam_score || 0);

      const result = await queryExecute(
        pool,
        `INSERT INTO results (id, school_id, pupil_id, subject_id, ca1_score, ca2_score, 
                              exam_score, total_score, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING id, pupil_id, subject_id, ca1_score, ca2_score, exam_score, total_score, created_at, updated_at`,
        [
          resultId,
          req.user!.school_id,
          pupil_id,
          subject_id,
          ca1_score || null,
          ca2_score || null,
          exam_score || null,
          totalScore,
        ]
      );

      res.status(201).json(result);
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * PUT /api/v1/results/:id
   * Update result scores
   */
  router.put('/:id', async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { ca1_score, ca2_score, exam_score } = req.body;

      // Validate scores
      if (ca1_score !== undefined && ca1_score !== null) {
        validateScore(ca1_score);
      }
      if (ca2_score !== undefined && ca2_score !== null) {
        validateScore(ca2_score);
      }
      if (exam_score !== undefined && exam_score !== null) {
        validateScore(exam_score);
      }

      // Get result with class info
      const result = await queryOne(
        pool,
        `SELECT r.*, p.class_id 
         FROM results r
         JOIN pupils p ON p.id = r.pupil_id
         WHERE r.id = $1 AND r.school_id = $2`,
        [id, req.user!.school_id]
      );

      if (!result) {
        throw new NotFoundError('Result');
      }

      // Check teacher access
      if (req.user!.role === 'teacher') {
        const classAccess = await queryOne(
          pool,
          `SELECT id FROM classes WHERE id = $1 AND teacher_id = $2`,
          [result.class_id, req.user!.id]
        );

        if (!classAccess) {
          throw new ValidationError('You do not have access to this result');
        }
      }

      // Calculate new total
      const newCa1 = ca1_score !== undefined ? ca1_score : result.ca1_score;
      const newCa2 = ca2_score !== undefined ? ca2_score : result.ca2_score;
      const newExam = exam_score !== undefined ? exam_score : result.exam_score;
      const newTotal = (newCa1 || 0) + (newCa2 || 0) + (newExam || 0);

      const updated = await queryExecute(
        pool,
        `UPDATE results 
         SET ca1_score = COALESCE($1, ca1_score),
             ca2_score = COALESCE($2, ca2_score),
             exam_score = COALESCE($3, exam_score),
             total_score = $4,
             updated_at = NOW()
         WHERE id = $5
         RETURNING id, pupil_id, subject_id, ca1_score, ca2_score, exam_score, total_score, created_at, updated_at`,
        [
          ca1_score !== undefined ? ca1_score : null,
          ca2_score !== undefined ? ca2_score : null,
          exam_score !== undefined ? exam_score : null,
          newTotal,
          id,
        ]
      );

      res.json(updated);
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * DELETE /api/v1/results/:id
   * Delete result (admin only)
   */
  router.delete('/:id', checkRole(['admin']), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const deleted = await queryExecute(
        pool,
        `DELETE FROM results WHERE id = $1 AND school_id = $2 RETURNING id`,
        [id, req.user!.school_id]
      );

      if (!deleted) {
        throw new NotFoundError('Result');
      }

      res.json({ message: 'Result deleted successfully' });
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * POST /api/v1/results/observations/:pupil_id
   * Update pupil observations
   */
  router.post('/observations/:pupil_id', async (req: AuthRequest, res) => {
    try {
      const { pupil_id } = req.params;
      const { classroom_rating, psychological_rating, social_rating, physical_rating } =
        req.body;

      validateObservationRating(classroom_rating);
      validateObservationRating(psychological_rating);
      validateObservationRating(social_rating);
      validateObservationRating(physical_rating);

      // Verify pupil and get class
      const pupil = await queryOne(
        pool,
        `SELECT class_id FROM pupils WHERE id = $1 AND school_id = $2`,
        [pupil_id, req.user!.school_id]
      );

      if (!pupil) {
        throw new ValidationError('Pupil not found');
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

      // Check if observation exists
      const existing = await queryOne(
        pool,
        `SELECT id FROM observations WHERE pupil_id = $1`,
        [pupil_id]
      );

      let observation;

      if (existing) {
        observation = await queryExecute(
          pool,
          `UPDATE observations 
           SET classroom_rating = COALESCE($1, classroom_rating),
               psychological_rating = COALESCE($2, psychological_rating),
               social_rating = COALESCE($3, social_rating),
               physical_rating = COALESCE($4, physical_rating),
               updated_at = NOW()
           WHERE pupil_id = $5
           RETURNING *`,
          [
            classroom_rating || null,
            psychological_rating || null,
            social_rating || null,
            physical_rating || null,
            pupil_id,
          ]
        );
      } else {
        const obsId = generateId();
        observation = await queryExecute(
          pool,
          `INSERT INTO observations (id, school_id, pupil_id, classroom_rating, 
                                      psychological_rating, social_rating, physical_rating, 
                                      created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           RETURNING *`,
          [
            obsId,
            req.user!.school_id,
            pupil_id,
            classroom_rating || null,
            psychological_rating || null,
            social_rating || null,
            physical_rating || null,
          ]
        );
      }

      res.json(observation);
    } catch (error) {
      handleError(error, res);
    }
  });

  return router;
};
