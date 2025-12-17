import React from 'react';
import { AntTag } from '../../core';
import type { StatusBadgeProps, StatusType } from './StatusBadge.types';

const statusColorMap: Record<StatusType, string> = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'processing',
  default: 'default',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, text }) => {
  return <AntTag color={statusColorMap[status]}>{text}</AntTag>;
};
