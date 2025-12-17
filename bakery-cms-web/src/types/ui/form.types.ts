import type { Rule } from 'antd/es/form';

export interface FormField {
  name: string;
  label: string;
  rules?: Rule[];
  placeholder?: string;
  disabled?: boolean;
}

export interface FormConfig {
  fields: FormField[];
  initialValues?: Record<string, any>;
  onSubmit: (values: any) => void | Promise<void>;
}
