# Bakery CMS - Frontend# Bakery CMS - Frontend# React + TypeScript + Vite



A modern, production-ready Content Management System built with **React 19**, **TypeScript**, **Ant Design 5**, and **Vite**.



## 🚀 Quick StartReact + TypeScript frontend for Bakery Cookie Sales Management System.This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.



```bash

# Install dependencies

yarn install## Quick StartCurrently, two official plugins are available:



# Start development server

yarn dev  # http://localhost:5173

```bash- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh

# Build for production

yarn buildyarn install- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

```

yarn dev  # http://localhost:5173

## 📋 Features

```## React Compiler

- ✅ **Products Management** - CRUD operations with filtering & sorting

- ✅ **Orders Management** - Order processing with items & status workflow  

- ✅ **Payments Management** - Payment tracking with VietQR integration

- ✅ **Dashboard** - Overview with navigation## FeaturesThe React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

- ✅ **Dark/Light Theme** - Persistent theme switching

- ✅ **Fully Responsive** - Mobile, tablet, desktop support

- ⚡ **Optimized** - Lazy loading, code splitting, memoization

- 🛡️ **Type-Safe** - Strict TypeScript✅ Functional React components with TypeScript## Expanding the ESLint configuration

- 🎯 **Error Boundaries** - Graceful error handling

✅ Result type pattern for error handling  

## 🛠️ Tech Stack

✅ Component architecture: core/shared/featuresIf you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

- **React 19.2.0** + **TypeScript 5.9.3**

- **Vite 5.4.21** - Build tool✅ Type-safe API services with Axios

- **Ant Design 5.29.2** - UI components

- **Zustand 4.5.7** - State management✅ Domain models with mappers```js

- **React Router 6.30.2** - Routing

- **Axios 1.13.2** - HTTP clientexport default defineConfig([

- **Zod 3.25.76** - Validation

- **dayjs 1.11.19** - Date handling## Structure  globalIgnores(['dist']),

- **Vitest** - Testing

  {

## 📁 Structure

```    files: ['**/*.{ts,tsx}'],

```

src/src/    extends: [

├── components/

│   ├── core/       # Ant Design wrappers├── components/     # UI components (core/shared/features)      // Other configs...

│   ├── features/   # Products, Orders, Payments

│   └── shared/     # Reusable components├── services/       # API services  

├── config/         # Theme, routes

├── hooks/          # Custom hooks├── types/          # Types (api/models/mappers/common)      // Remove tseslint.configs.recommended and replace with this

├── pages/          # Page components

├── services/       # API layer├── hooks/          # Custom hooks      tseslint.configs.recommendedTypeChecked,

├── stores/         # Zustand stores

├── types/          # TypeScript types└── pages/          # Page components      // Alternatively, use this for stricter rules

└── utils/          # Utilities

``````      tseslint.configs.strictTypeChecked,



## 🎨 Key Patterns      // Optionally, add this for stylistic rules



### Result<T, E> Pattern## Scripts      tseslint.configs.stylisticTypeChecked,

```typescript

const result = await productService.getAll();

if (result.success) {

  setProducts(result.data);```bash      // Other configs...

} else {

  showError(result.error.message);yarn dev            # Start dev server    ],

}

```yarn build          # Build for production    languageOptions: {



### Container/Presenteryarn test           # Run tests      parserOptions: {

- **Pages**: Handle state, API calls, routing

- **Components**: Pure presentation, receive propsyarn test:coverage  # Coverage report (target: 80%)        project: ['./tsconfig.node.json', './tsconfig.app.json'],



### Performanceyarn lint           # Lint code        tsconfigRootDir: import.meta.dirname,

- Lazy loading all pages

- React.memo for expensive componentsyarn type-check     # TypeScript check      },

- useMemo for column configurations

- Error boundaries for crash prevention```      // other options...



## 🧪 Testing    },



```bash## Environment  },

yarn test              # Run tests

yarn test:coverage    # With coverage])

yarn lint             # ESLint

yarn tsc --noEmit     # Type checkCreate `.env`:```

```

```

## 📝 Development

VITE_API_BASE_URL=http://localhost:3000/api/v1You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

### Prerequisites

- Node.js 18.18.0+VITE_API_TIMEOUT=10000

- Yarn 1.22.0+

- Backend API running on http://localhost:3000``````js



### Environment// eslint.config.js

Create `.env`:

```env## Statusimport reactX from 'eslint-plugin-react-x'

VITE_API_BASE_URL=http://localhost:3000/api

VITE_APP_NAME=Bakery CMSimport reactDom from 'eslint-plugin-react-dom'

```

✅ Frontend infrastructure complete

### Commands

```bash- Core components (Button, Input, Card, Modal, Spinner, ErrorMessage)export default defineConfig([

yarn dev        # Dev server (port 5173)

yarn build      # Production build- API services (Product, Order, Payment)  globalIgnores(['dist']),

yarn preview    # Preview production build

yarn lint       # Check linting- Type system with Result pattern  {

yarn lint:fix   # Fix linting errors

```- Basic routing and pages    files: ['**/*.{ts,tsx}'],



## 🚀 Deployment    extends: [

      // Other configs...

```bash      // Enable lint rules for React

# Build      reactX.configs['recommended-typescript'],

yarn build      // Enable lint rules for React DOM

      reactDom.configs.recommended,

# Output: dist/ directory    ],

# Deploy to: Vercel, Netlify, AWS S3, etc.    languageOptions: {

```      parserOptions: {

        project: ['./tsconfig.node.json', './tsconfig.app.json'],

## 📚 Documentation        tsconfigRootDir: import.meta.dirname,

      },

- See `/docs/ANTD_CUSTOMIZATION.md` for theming guide      // other options...

- See `/specs/003-antd-cms-frontend/` for full specification    },

  },

## 🐛 Troubleshooting])

```

**Module errors**: `rm -rf node_modules yarn.lock && yarn install`  
**Port in use**: `lsof -ti:5173 | xargs kill -9`  
**API connection**: Check backend is running on port 3000

## 📄 License

MIT License

## 👥 Author

Ngo Thuong Hoang Anh - [@ngothuonghoanganh](https://github.com/ngothuonghoanganh)
