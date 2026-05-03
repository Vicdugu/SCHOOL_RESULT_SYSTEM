import express, { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { AuthRequest, verifyToken, checkRole } from '../middleware/auth';
import {
  validateEmail,
  validatePassword,
  validateRole,
} from '../utils/validators';
import { handleError, ValidationError, NotFoundError } from '../utils/errors';
import { queryOne, queryAll, queryExecute, generateId } from '../utils/db';

export const createUsersRoutes = (pool: Pool): Router => {
  const router = express.Router();

  // Apply authentication to all routes
  router.use(verifyToken);

  /**
   * GET /api/v1/users
   * List all users in school (admin only)
   */
  router.get('/', checkRole(['admin']), async (req: AuthRequest, res) => {
    try {
      const users = await queryAll(
        pool,
        `SELECT id, email, role, created_at, updated_at
         FROM users 
         WHERE school_id = $1
         ORDER BY created_at DESC`,
        [req.user!.school_id]
      );

      res.json(users);
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * GET /api/v1/users/:id
   * Get user by ID
   */
  router.get('/:id', async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const isAdmin = req.user!.role === 'admin';

      // Admin can view any user, others can only view themselves
      if (!isAdmin && req.user!.id !== id) {
        throw new ValidationError('You can only view your own profile');
      }

      const user = await queryOne(
        pool,
        `SELECT id, email, role, created_at, updated_at
         FROM users 
         WHERE id = $1 AND school_id = $2`,
        [id, req.user!.school_id]
      );

      if (!user) {
        throw new NotFoundError('User');
      }

      res.json(user);
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * POST /api/v1/users
   * Create new user (admin only)
   */
  router.post('/', checkRole(['admin']), async (req: AuthRequest, res) => {
    try {
      const { email, password, role } = req.body;

      validateEmail(email);
      validatePassword(password);
      validateRole(role);

      // Check if user already exists in school
      const existingUser = await queryOne(
        pool,
        `SELECT id FROM users WHERE school_id = $1 AND LOWER(email) = LOWER($2)`,
        [req.user!.school_id, email]
      );

      if (existingUser) {
        throw new ValidationError('User with this email already exists in school');
      }

      const userId = generateId();
      const passwordHash = await bcrypt.hash(password, 10);

      const user = await queryExecute(
        pool,
        `INSERT INTO users (id, school_id, email, role, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id, email, role, created_at, updated_at`,
        [userId, req.user!.school_id, email, role, passwordHash]
      );

      res.status(201).json(user);
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * PUT /api/v1/users/:id
   * Update user (admin can update any user, teachers can update only themselves)
   */
  router.put('/:id', async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { email, role, password } = req.body;
      const isAdmin = req.user!.role === 'admin';

      // Check permission
      if (!isAdmin && req.user!.id !== id) {
        throw new ValidationError('You can only update your own profile');
      }

      // Non-admins cannot change role
      if (!isAdmin && role) {
        throw new ValidationError('You cannot change your role');
      }

      // Validate inputs if provided
      if (email) {
        validateEmail(email);
      }
      if (role) {
        validateRole(role);
      }

      // Check if email is unique in school
      if (email) {
        const existingUser = await queryOne(
          pool,
          `SELECT id FROM users WHERE school_id = $1 AND LOWER(email) = LOWER($2) AND id != $3`,
          [req.user!.school_id, email, id]
        );

        if (existingUser) {
          throw new ValidationError('Email already in use');
        }
      }

      let passwordHash: string | null = null;
      if (password) {
        validatePassword(password);
        passwordHash = await bcrypt.hash(password, 10);
      }

      const user = await queryExecute(
        pool,
        `UPDATE users 
         SET email = COALESCE($1, email),
             role = COALESCE($2, role),
             password_hash = COALESCE($3, password_hash),
             updated_at = NOW()
         WHERE id = $4 AND school_id = $5
         RETURNING id, email, role, created_at, updated_at`,
        [
          email || null,
          role || null,
          passwordHash || null,
          id,
          req.user!.school_id,
        ]
      );

      if (!user) {
        throw new NotFoundError('User');
      }

      res.json(user);
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * DELETE /api/v1/users/:id
   * Delete user (admin only)
   */
  router.delete('/:id', checkRole(['admin']), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      // Cannot delete self
      if (req.user!.id === id) {
        throw new ValidationError('You cannot delete your own account');
      }

      const user = await queryExecute(
        pool,
        `DELETE FROM users 
         WHERE id = $1 AND school_id = $2
         RETURNING id`,
        [id, req.user!.school_id]
      );

      if (!user) {
        throw new NotFoundError('User');
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      handleError(error, res);
    }
  });

  return router;
};
