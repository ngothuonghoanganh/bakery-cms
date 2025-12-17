# Ant Design Customization Guide

Complete guide for customizing Ant Design components and theming in Bakery CMS.

## 📋 Table of Contents

- [Theme Configuration](#theme-configuration)
- [Component Customization](#component-customization)
- [Dark/Light Theme](#darklight-theme)
- [Custom Components](#custom-components)
- [LESS Variables](#less-variables)
- [Best Practices](#best-practices)

## 🎨 Theme Configuration

### Basic Theme Setup

The theme is configured in `src/config/theme.config.ts`:

```typescript
import type { ThemeConfig } from 'antd';

export const lightTheme: ThemeConfig = {
  token: {
    // Primary colors
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    
    // Text colors
    colorText: 'rgba(0, 0, 0, 0.88)',
    colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
    colorTextTertiary: 'rgba(0, 0, 0, 0.45)',
    
    // Background colors
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f5f5f5',
    colorBgElevated: '#ffffff',
    
    // Border
    colorBorder: '#d9d9d9',
    borderRadius: 6,
    
    // Font
    fontSize: 14,
    fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial`,
  },
  
  components: {
    // Component-specific customization
    Button: {
      controlHeight: 32,
      borderRadius: 6,
    },
    Table: {
      headerBg: '#fafafa',
      rowHoverBg: '#f5f5f5',
    },
  },
};

export const darkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#1890ff',
    // ... dark theme tokens
  },
};
```

### Using the Theme

Apply theme in `App.tsx`:

```typescript
import { ConfigProvider } from 'antd';
import { lightTheme, darkTheme } from './config/theme.config';
import { useThemeStore } from './stores/themeStore';

export const App = () => {
  const { mode } = useThemeStore();
  const theme = mode === 'light' ? lightTheme : darkTheme;
  
  return (
    <ConfigProvider theme={theme}>
      {/* Your app */}
    </ConfigProvider>
  );
};
```

## 🧩 Component Customization

### Button Variants

```typescript
// Primary button
<Button type="primary">Primary</Button>

// Ghost button (for dark backgrounds)
<Button ghost>Ghost</Button>

// Danger button
<Button danger>Delete</Button>

// Custom styled button
<Button 
  type="primary" 
  icon={<PlusOutlined />}
  style={{ borderRadius: 8 }}
>
  Create
</Button>
```

### Table Customization

```typescript
<Table
  dataSource={data}
  columns={columns}
  pagination={{
    pageSize: 10,
    showSizeChanger: true,
    showTotal: (total) => `Total ${total} items`,
  }}
  scroll={{ x: 1200 }}
  rowClassName={(record, index) => 
    index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
  }
/>
```

### Form Styling

```typescript
<Form
  layout="vertical"
  form={form}
  onFinish={onSubmit}
  labelCol={{ span: 24 }}
  wrapperCol={{ span: 24 }}
>
  <Form.Item
    label="Product Name"
    name="name"
    rules={[{ required: true, message: 'Name is required' }]}
  >
    <Input placeholder="Enter product name" />
  </Form.Item>
</Form>
```

### Modal Customization

```typescript
<Modal
  title="Create Product"
  open={visible}
  onOk={handleOk}
  onCancel={handleCancel}
  width={800}
  centered
  destroyOnClose
  okButtonProps={{ loading: submitting }}
>
  {/* Modal content */}
</Modal>
```

## 🌓 Dark/Light Theme

### Theme Store (Zustand)

```typescript
// stores/themeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark';

type ThemeStore = {
  mode: ThemeMode;
  toggleTheme: () => void;
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      mode: 'light',
      toggleTheme: () =>
        set((state) => ({
          mode: state.mode === 'light' ? 'dark' : 'light',
        })),
    }),
    {
      name: 'theme-storage', // localStorage key
    }
  )
);
```

### Theme Toggle Component

```typescript
import { Switch } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useThemeStore } from '@/stores/themeStore';

export const ThemeToggle = () => {
  const { mode, toggleTheme } = useThemeStore();
  
  return (
    <Switch
      checked={mode === 'dark'}
      onChange={toggleTheme}
      checkedChildren={<MoonOutlined />}
      unCheckedChildren={<SunOutlined />}
    />
  );
};
```

### Dark Theme Configuration

```typescript
export const darkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#1890ff',
    colorBgContainer: '#141414',
    colorBgLayout: '#000000',
    colorText: 'rgba(255, 255, 255, 0.85)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
    colorBorder: '#434343',
  },
  components: {
    Table: {
      headerBg: '#1f1f1f',
      rowHoverBg: '#262626',
    },
    Card: {
      colorBgContainer: '#141414',
    },
  },
};
```

## 🎯 Custom Components

### Wrapper Pattern

Create wrappers for consistent styling:

```typescript
// components/core/Modal/AntModal.tsx
import { Modal } from 'antd';
import type { ModalProps } from 'antd';

export type AntModalProps = ModalProps & {
  // Add custom props if needed
};

export const AntModal: React.FC<AntModalProps> = (props) => {
  return (
    <Modal
      {...props}
      centered
      destroyOnClose
      // Default customizations
    />
  );
};
```

### Custom Status Badge

```typescript
// components/shared/StatusBadge/StatusBadge.tsx
import { Tag } from 'antd';

type StatusType = 'success' | 'processing' | 'error' | 'default' | 'warning';

export type StatusBadgeProps = {
  status: StatusType;
  text: string;
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, text }) => {
  return <Tag color={status}>{text}</Tag>;
};
```

## 🎨 LESS Variables

### Global Styles

Create `src/styles/antd-overrides.less`:

```less
// Override Ant Design variables
@primary-color: #1890ff;
@success-color: #52c41a;
@warning-color: #faad14;
@error-color: #ff4d4f;
@font-size-base: 14px;
@border-radius-base: 6px;

// Custom classes
.ant-table {
  .ant-table-thead > tr > th {
    font-weight: 600;
    background: #fafafa;
  }
}

.ant-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
}

.ant-btn-primary {
  &:hover {
    opacity: 0.8;
  }
}
```

### Import in Vite Config

```typescript
// vite.config.ts
export default defineConfig({
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {
          '@primary-color': '#1890ff',
          '@border-radius-base': '6px',
        },
      },
    },
  },
});
```

## ✨ Best Practices

### 1. Token-Based Customization (Preferred)

Use theme tokens in `theme.config.ts` instead of LESS variables:

```typescript
// ✅ Good - Token-based
export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
  },
};

// ❌ Avoid - LESS variables
@primary-color: #1890ff;
```

### 2. Component-Specific Overrides

```typescript
export const lightTheme: ThemeConfig = {
  token: {
    // Global tokens
  },
  components: {
    // Component-specific
    Button: {
      controlHeight: 36,
      borderRadius: 8,
    },
    Table: {
      headerBg: '#fafafa',
    },
  },
};
```

### 3. Consistent Spacing

Use Ant Design's spacing system:

```typescript
<div style={{ padding: '16px' }}>      // Small
<div style={{ padding: '24px' }}>      // Medium
<div style={{ padding: '32px' }}>      // Large
<div style={{ margin: '16px 0' }}>     // Vertical spacing
```

### 4. Responsive Design

Use Ant Design's Grid system:

```typescript
<Row gutter={[16, 16]}>
  <Col xs={24} sm={12} md={8} lg={6}>
    <Card>Content</Card>
  </Col>
</Row>
```

### 5. Icons

Always use @ant-design/icons:

```typescript
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined 
} from '@ant-design/icons';

<Button icon={<PlusOutlined />}>Create</Button>
```

### 6. Form Validation

Use Ant Design Form validation:

```typescript
<Form.Item
  label="Email"
  name="email"
  rules={[
    { required: true, message: 'Email is required' },
    { type: 'email', message: 'Invalid email format' },
  ]}
>
  <Input />
</Form.Item>
```

### 7. Loading States

Use Ant Design loading components:

```typescript
<Button loading={isSubmitting}>Submit</Button>
<Table loading={isLoading} dataSource={data} />
<Spin spinning={isLoading}><Content /></Spin>
```

## 🔧 Advanced Customization

### Custom Theme Algorithm

```typescript
import { theme } from 'antd';

export const customTheme: ThemeConfig = {
  algorithm: [
    theme.darkAlgorithm,
    theme.compactAlgorithm,
  ],
  token: {
    // Your tokens
  },
};
```

### CSS-in-JS with Ant Design

```typescript
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  container: css`
    background-color: ${token.colorBgContainer};
    border-radius: ${token.borderRadius}px;
    padding: ${token.padding}px;
  `,
}));

export const MyComponent = () => {
  const { styles } = useStyles();
  return <div className={styles.container}>Content</div>;
};
```

### Dynamic Theme Switching

```typescript
const [theme, setTheme] = useState(lightTheme);

const handleThemeChange = (newTheme: ThemeConfig) => {
  setTheme(newTheme);
};

<ConfigProvider theme={theme}>
  <App />
</ConfigProvider>
```

## 📚 Resources

- [Ant Design Theme Editor](https://ant.design/theme-editor)
- [Ant Design Tokens](https://ant.design/docs/react/customize-theme)
- [Component List](https://ant.design/components/overview)
- [Design Values](https://ant.design/docs/spec/values)

## 🎨 Theme Gallery

### Professional Blue (Current)
```typescript
colorPrimary: '#1890ff'
```

### Corporate Green
```typescript
colorPrimary: '#52c41a'
```

### Elegant Purple
```typescript
colorPrimary: '#722ed1'
```

### Warm Orange
```typescript
colorPrimary: '#fa8c16'
```

## 🤝 Contributing

When adding new components, follow these guidelines:

1. Use Ant Design components as base
2. Create wrappers in `src/components/core/`
3. Add theme tokens to `theme.config.ts`
4. Document customizations in this guide
5. Test in both light and dark modes

## 📝 Changelog

### v1.0.0
- Initial theme configuration
- Dark/Light theme support
- Custom component wrappers
- Responsive design system
