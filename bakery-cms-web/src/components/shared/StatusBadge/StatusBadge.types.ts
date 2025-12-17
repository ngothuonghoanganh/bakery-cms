export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'default';

export interface StatusBadgeProps {
  status: StatusType;
  text: string;
}
