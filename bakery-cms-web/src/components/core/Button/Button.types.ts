/**
 * Button component props
 */

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly disabled?: boolean;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly onClick?: () => void;
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly fullWidth?: boolean;
};
