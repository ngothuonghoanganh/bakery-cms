# Bakery CMS - Frontend# React + TypeScript + Vite



React + TypeScript frontend for Bakery Cookie Sales Management System.This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.



## Quick StartCurrently, two official plugins are available:



```bash- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh

yarn install- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

yarn dev  # http://localhost:5173

```## React Compiler



## FeaturesThe React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).



✅ Functional React components with TypeScript## Expanding the ESLint configuration

✅ Result type pattern for error handling  

✅ Component architecture: core/shared/featuresIf you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

✅ Type-safe API services with Axios

✅ Domain models with mappers```js

export default defineConfig([

## Structure  globalIgnores(['dist']),

  {

```    files: ['**/*.{ts,tsx}'],

src/    extends: [

├── components/     # UI components (core/shared/features)      // Other configs...

├── services/       # API services  

├── types/          # Types (api/models/mappers/common)      // Remove tseslint.configs.recommended and replace with this

├── hooks/          # Custom hooks      tseslint.configs.recommendedTypeChecked,

└── pages/          # Page components      // Alternatively, use this for stricter rules

```      tseslint.configs.strictTypeChecked,

      // Optionally, add this for stylistic rules

## Scripts      tseslint.configs.stylisticTypeChecked,



```bash      // Other configs...

yarn dev            # Start dev server    ],

yarn build          # Build for production    languageOptions: {

yarn test           # Run tests      parserOptions: {

yarn test:coverage  # Coverage report (target: 80%)        project: ['./tsconfig.node.json', './tsconfig.app.json'],

yarn lint           # Lint code        tsconfigRootDir: import.meta.dirname,

yarn type-check     # TypeScript check      },

```      // other options...

    },

## Environment  },

])

Create `.env`:```

```

VITE_API_BASE_URL=http://localhost:3000/api/v1You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

VITE_API_TIMEOUT=10000

``````js

// eslint.config.js

## Statusimport reactX from 'eslint-plugin-react-x'

import reactDom from 'eslint-plugin-react-dom'

✅ Frontend infrastructure complete

- Core components (Button, Input, Card, Modal, Spinner, ErrorMessage)export default defineConfig([

- API services (Product, Order, Payment)  globalIgnores(['dist']),

- Type system with Result pattern  {

- Basic routing and pages    files: ['**/*.{ts,tsx}'],

    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
