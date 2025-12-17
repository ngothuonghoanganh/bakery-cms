/**
 * ErrorMessage component props
 */

import type { AppError } from '@/types/common/error.types';

export type ErrorMessageProps = {
  readonly error: AppError | string;
  readonly className?: string;
};
