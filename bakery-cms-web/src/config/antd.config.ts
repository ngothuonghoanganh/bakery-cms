import type { ConfigProviderProps } from 'antd';

// Ant Design global configuration
export const antdConfig: ConfigProviderProps = {
  componentSize: 'middle',
  // Form configuration
  form: {
    validateMessages: {
      required: '${label} is required',
      types: {
        email: '${label} is not a valid email',
        number: '${label} is not a valid number',
      },
      number: {
        range: '${label} must be between ${min} and ${max}',
      },
    },
  },
};

