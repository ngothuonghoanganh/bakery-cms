/**
 * ErrorMessage component
 * Display error messages to users
 */

import type { ErrorMessageProps } from './ErrorMessage.types';
import { getErrorMessage } from '@/utils/error-handler';

export const ErrorMessage = ({ error, className = '' }: ErrorMessageProps): React.JSX.Element => {
  const message = typeof error === 'string' ? error : getErrorMessage(error);
  
  return (
    <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded ${className}`} role="alert">
      <p className="font-medium">Error</p>
      <p className="text-sm">{message}</p>
    </div>
  );
};
