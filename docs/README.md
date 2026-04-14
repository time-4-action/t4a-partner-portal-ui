# Documentation

> Technical documentation for the Patrik Products UI partner portal.

---

## Documents

| Document | Description |
|----------|-------------|
| **[Architecture](./ARCHITECTURE.md)** | Application layers, auth flow, routing, data flow, state management, styling, performance, security |
| **[API Reference](./API.md)** | Backend endpoints, internal routes, Auth0 routes, data structures, error handling |
| **[Components](./COMPONENTS.md)** | Full component library — props, state, features, usage examples, relationships |
| **[Development Guide](./DEVELOPMENT.md)** | Setup, Git workflow, common tasks, testing, debugging, deployment |
| **[Roles & Auth](./ROLES_AUTH.md)** | Auth0 integration, JWT claims, role definitions, middleware gate, token flow |
| **[Design System](./DESIGN_SYSTEM.md)** | Colors, typography, component patterns, animations, page layouts |

---

## Where to Start

### New to the project?

1. Read the [main README](../README.md) for an overview
2. Follow the [Development Guide](./DEVELOPMENT.md) to get set up
3. Browse [Components](./COMPONENTS.md) to understand the UI
4. Reference [Architecture](./ARCHITECTURE.md) and [API](./API.md) as needed

### Building a new feature?

1. [Architecture](./ARCHITECTURE.md) — understand the patterns
2. [Components](./COMPONENTS.md) — see what already exists
3. [Design System](./DESIGN_SYSTEM.md) — match the visual language
4. [Development Guide](./DEVELOPMENT.md) — follow the workflow

### Working on auth or access control?

1. [Roles & Auth](./ROLES_AUTH.md) — the full auth flow
2. [Architecture](./ARCHITECTURE.md#authentication-flow) — how it fits into the app
3. [API Reference](./API.md#auth0-api-routes) — auth-related endpoints

### Integrating with the API?

1. [API Reference](./API.md) — all endpoints and data structures
2. [Architecture](./ARCHITECTURE.md#data-flow-patterns) — how data moves through the app

---

## Quick Reference

### Key Paths

| What | Where |
|------|-------|
| Pages | `src/app/` |
| Protected pages | `src/app/(protected)/` |
| Components | `src/components/` |
| API proxy routes | `src/app/nextapi/` |
| Auth0 config | `src/lib/auth0.js` |
| Middleware | `src/proxy.js` |

### Commands

```bash
npm run dev      # Development server (port 3000)
npm run build    # Production build
npm start        # Production server
npm run lint     # ESLint
```

---

## External Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Auth0 Next.js SDK](https://auth0.com/docs/quickstart/webapp/nextjs)
