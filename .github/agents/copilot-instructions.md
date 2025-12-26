# Bakery-CMS Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-16

## Active Technologies
- TypeScript with Node.js 18+ + Express.js, Sequelize ORM 6.x, MySQL 8.0+ (002-soft-delete-implementation)
- MySQL with Sequelize ORM (existing infrastructure) (002-soft-delete-implementation)
- TypeScript 5.9.3 with React 19.2.0 + Ant Design 5.12.0, Zustand 4.4.7, Axios 1.6.2, React Router DOM 6.20.1, Zod 3.22.4 (003-antd-cms-frontend)
- N/A (frontend only - API communication with bakery-cms-api backend) (003-antd-cms-frontend)
- TypeScript with Node.js 18+ (Backend), React 18 with TypeScript (Frontend) + Express.js, Sequelize, MySQL, JWT, bcrypt, OAuth2, Axios (Frontend), Zustand (Frontend) (004-authentication-authorization)
- MySQL with Sequelize ORM, Redis for session storage (004-authentication-authorization)
- TypeScript 5.3+ (Node.js 16+) + Express.js, Sequelize ORM, neverthrow (Result type), Joi (validation) (005-stock-management)
- MySQL (via Sequelize) (005-stock-management)
- TypeScript 5.9+, React 19, Node.js 18+ + React, Ant Design 5.x, Zustand, Axios, dayjs (006-i18n)
- Local Storage (anonymous), User API (authenticated users) (006-i18n)

- TypeScript 5.0+ with Node.js 18+ (Backend), TypeScript 5.0+ with React 18 (Frontend) (001-base-infrastructure-setup)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.0+ with Node.js 18+ (Backend), TypeScript 5.0+ with React 18 (Frontend): Follow standard conventions

## Recent Changes
- 006-i18n: Added TypeScript 5.9+, React 19, Node.js 18+ + React, Ant Design 5.x, Zustand, Axios, dayjs
- 005-stock-management: Added TypeScript 5.3+ (Node.js 16+) + Express.js, Sequelize ORM, neverthrow (Result type), Joi (validation)
- 004-authentication-authorization: Added TypeScript with Node.js 18+ (Backend), React 18 with TypeScript (Frontend) + Express.js, Sequelize, MySQL, JWT, bcrypt, OAuth2, Axios (Frontend), Zustand (Frontend)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
