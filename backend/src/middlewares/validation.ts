import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';
import { validateData, validatePartial, ValidationError } from '../utils';

export function validateBody(schema: ObjectSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = validateData(req.body, schema);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateQuery(schema: ObjectSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = validateData(req.query, schema) as any;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateParams(schema: ObjectSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.params = validateData(req.params, schema) as any;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateBodyPartial(schema: ObjectSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = validatePartial(req.body, schema);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateQueryPartial(schema: ObjectSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = validatePartial(req.query, schema) as any;
      next();
    } catch (error) {
      next(error);
    }
  };
}