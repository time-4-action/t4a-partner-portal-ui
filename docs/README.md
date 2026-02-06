# Documentation Index

Welcome to the Patrik Products UI documentation. This folder contains comprehensive technical documentation for developers, architects, and contributors.

## 📑 Documentation Files

### [ARCHITECTURE.md](./ARCHITECTURE.md)
**Detailed Technical Architecture**

Deep dive into the application's technical architecture:
- Application layers and technology stack
- Authentication flow with Auth0
- Routing strategy using Next.js App Router
- Data flow patterns (Server vs Client components)
- State management approaches
- Styling architecture with Tailwind CSS v4
- Performance optimization strategies
- Security considerations
- Build and deployment configuration

**Best for:** Architects, senior developers, anyone making architectural decisions

---

### [API.md](./API.md)
**API Integration & Data Structures**

Complete reference for all API integrations:
- Backend API endpoints (products, exports)
- Internal Next.js API routes
- Auth0 authentication routes
- Request/response formats with examples
- TypeScript interface definitions
- Error handling patterns
- Rate limiting and caching strategies

**Best for:** Backend developers, API consumers, integration work

---

### [COMPONENTS.md](./COMPONENTS.md)
**Component Library Documentation**

Comprehensive guide to all React components:
- Navigation components (Navbar, Profile)
- Product components (ProductGrid, ProductVariants, ProductImageGallery)
- Export components (ExportPage with all presets)
- Authentication components
- Page components
- Props, state, and features for each component
- Usage examples and code snippets
- Component relationship diagrams
- Best practices

**Best for:** Frontend developers, UI/UX work, component development

---

### [DEVELOPMENT.md](./DEVELOPMENT.md)
**Development Workflow & Best Practices**

Practical guide for day-to-day development:
- Getting started and initial setup
- Development workflow and Git strategy
- Common tasks (adding pages, components, API routes)
- Creating new export presets
- Styling patterns and color palette
- Testing checklist
- Debugging techniques
- Code quality tools (ESLint, Prettier)
- Deployment instructions
- Troubleshooting common issues
- Useful commands reference

**Best for:** New developers, daily development work, troubleshooting

---

## 🚀 Quick Navigation

**I want to...**

| Task | Documentation |
|------|---------------|
| Understand the overall architecture | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Learn how authentication works | [ARCHITECTURE.md](./ARCHITECTURE.md#authentication-flow) |
| See all API endpoints | [API.md](./API.md) |
| Understand product data structure | [API.md](./API.md#product-object) |
| Learn about a specific component | [COMPONENTS.md](./COMPONENTS.md) |
| Add a new page | [DEVELOPMENT.md](./DEVELOPMENT.md#adding-a-new-page) |
| Add a new component | [DEVELOPMENT.md](./DEVELOPMENT.md#adding-a-new-component) |
| Create a new export preset | [DEVELOPMENT.md](./DEVELOPMENT.md#adding-a-new-export-preset) |
| Set up my development environment | [DEVELOPMENT.md](./DEVELOPMENT.md#getting-started) |
| Deploy to production | [DEVELOPMENT.md](./DEVELOPMENT.md#deployment) |
| Troubleshoot an issue | [DEVELOPMENT.md](./DEVELOPMENT.md#troubleshooting) |
| Understand state management | [ARCHITECTURE.md](./ARCHITECTURE.md#state-management) |
| See styling patterns | [DEVELOPMENT.md](./DEVELOPMENT.md#styling-components) |

---

## 📖 Reading Order

### For New Developers
1. Start with [README.md](../README.md) in the root folder
2. Read [DEVELOPMENT.md](./DEVELOPMENT.md) - Getting Started section
3. Skim [COMPONENTS.md](./COMPONENTS.md) to familiarize with components
4. Reference [ARCHITECTURE.md](./ARCHITECTURE.md) and [API.md](./API.md) as needed

### For Experienced Developers
1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) for design decisions
2. Review [API.md](./API.md) for data structures
3. Reference [COMPONENTS.md](./COMPONENTS.md) and [DEVELOPMENT.md](./DEVELOPMENT.md) as needed

### For Architects/Tech Leads
1. [ARCHITECTURE.md](./ARCHITECTURE.md) - Complete read
2. [API.md](./API.md) - Data structures and integration patterns
3. [DEVELOPMENT.md](./DEVELOPMENT.md) - Deployment and code quality sections

---

## 🎯 Documentation Coverage

This documentation covers:

✅ **Architecture**
- Next.js 16 App Router architecture
- Server vs Client components
- Route protection with Auth0
- State management with React hooks

✅ **Features**
- Product catalog with grid/list views
- Product variants and pricing
- 4 export presets (Shopify, Simple, Detailed, Inventory)
- Advanced filtering and field selection
- Contact form with email integration

✅ **Technical Details**
- All API endpoints with examples
- Complete component library
- Performance optimizations (useMemo, useCallback)
- Security best practices
- Docker deployment

✅ **Development**
- Setup instructions
- Git workflow
- Common development tasks
- Debugging techniques
- Troubleshooting guide

---

## 💡 Tips

- **Use search (Ctrl+F)**: All files are searchable
- **Follow links**: Documents are interconnected with hyperlinks
- **Code examples**: Most documentation includes code snippets
- **Keep updated**: When making changes, update relevant documentation

---

## 🔗 Additional Resources

- **[Main README](../README.md)** - Project overview and quick start
- **[CLAUDE.md](../CLAUDE.md)** - Guidelines for Claude Code
- **[Next.js Docs](https://nextjs.org/docs)** - Official Next.js documentation
- **[React Docs](https://react.dev)** - Official React documentation
- **[Tailwind CSS](https://tailwindcss.com/docs)** - Tailwind documentation
- **[Auth0 Docs](https://auth0.com/docs)** - Auth0 documentation

---

**Last Updated:** 2026-02-06

**Documentation Version:** 1.0

**Application Version:** See [package.json](../package.json)
