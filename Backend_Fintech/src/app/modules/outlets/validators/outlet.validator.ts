import { z } from 'zod';
import {
  createOutletBodySchema, outletIdParamSchema, outletListQuerySchema,
  outletStatusBodySchema, updateOutletBodySchema,
} from '../dto';

export { validateBody, validateParams, validateQuery } from '../../merchant-onboarding/validators/merchant-onboarding.validator';

export {
  createOutletBodySchema, outletIdParamSchema, outletListQuerySchema,
  outletStatusBodySchema, updateOutletBodySchema,
};
