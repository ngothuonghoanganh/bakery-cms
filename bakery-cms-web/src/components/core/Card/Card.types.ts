/**
 * Card component props
 */

export type CardProps = {
  readonly children: React.ReactNode;
  readonly title?: string;
  readonly subtitle?: string;
  readonly footer?: React.ReactNode;
  readonly className?: string;
  readonly onClick?: () => void;
  readonly hoverable?: boolean;
};
