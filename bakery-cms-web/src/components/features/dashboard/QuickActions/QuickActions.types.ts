import type { ReactNode } from 'react';

export interface QuickAction {
  key: string;
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
  onClick: () => void;
}

export interface QuickActionsProps {
  actions: QuickAction[];
}
