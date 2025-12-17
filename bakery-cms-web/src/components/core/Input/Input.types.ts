/**
 * Input component props
 */

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
export type InputSize = 'sm' | 'md' | 'lg';

export type InputProps = {
  readonly type?: InputType;
  readonly size?: InputSize;
  readonly value: string | number;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly error?: string;
  readonly label?: string;
  readonly name?: string;
  readonly required?: boolean;
  readonly className?: string;
  readonly fullWidth?: boolean;
};
