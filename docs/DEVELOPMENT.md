# Development Guide

> Practical guide for day-to-day development — setup, workflow, common tasks, and troubleshooting.
>
> **See also:** [Architecture](./ARCHITECTURE.md) | [Components](./COMPONENTS.md) | [API Reference](./API.md)

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Common Tasks](#common-tasks)
4. [Testing](#testing)
5. [Debugging](#debugging)
6. [Code Quality](#code-quality)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

1. **Node.js 18+**
   ```bash
   node --version  # Should be v18 or higher
   ```

2. **Package Manager**
   - npm (comes with Node.js)
   - or yarn: `npm install -g yarn`

3. **Git**
   ```bash
   git --version
   ```

4. **Auth0 Account**
   - Sign up at https://auth0.com
   - Create a new application (Regular Web Application)
   - Note down: Domain, Client ID, Client Secret

5. **Gmail Account** (for contact form)
   - Enable 2FA
   - Generate App Password: https://myaccount.google.com/apppasswords

### Initial Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd patrik-products-ui
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**

   Create `.env` file:
   ```env
   # Backend API
   EXPORT_API_URL=http://localhost:4000

   # Email Configuration
   GMAIL_EMAIL=your-email@gmail.com
   GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

   # Auth0 Configuration
   AUTH0_DOMAIN=your-tenant.auth0.com
   AUTH0_CLIENT_ID=your-client-id
   AUTH0_CLIENT_SECRET=your-client-secret
   AUTH0_SECRET=$(openssl rand -hex 32)
   AUTH0_BASE_URL=http://localhost:3000
   APP_BASE_URL=http://localhost:3000
   ```

4. **Auth0 Configuration**

   In Auth0 Dashboard:
   - Application Settings > Application URIs:
     - Allowed Callback URLs: `http://localhost:3000/auth/callback`
     - Allowed Logout URLs: `http://localhost:3000`
     - Allowed Web Origins: `http://localhost:3000`

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   Open http://localhost:3000

---

## Development Workflow

### Branch Strategy

```
main
├── feature/product-export
├── feature/contact-form
├── bugfix/auth-redirect
└── hotfix/critical-bug
```

**Branch Naming**:
- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

**Types**:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting, missing semicolons
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance

**Examples**:
```bash
feat(export): add Shopify CSV export preset
fix(auth): redirect to product page after login
docs(readme): update installation instructions
refactor(product-grid): optimize price calculations with useMemo
```

### Code Review Checklist

- [ ] Code follows project conventions
- [ ] No console.logs in production code
- [ ] Components are properly typed (JSDoc or TypeScript)
- [ ] Responsive design tested (mobile, tablet, desktop)
- [ ] Auth flows tested
- [ ] Error handling implemented
- [ ] No hardcoded values (use env vars)
- [ ] Performance optimizations applied (useMemo, useCallback)
- [ ] Accessibility considered
- [ ] Tests added/updated (if applicable)

---

## Common Tasks

### Adding a New Page

1. **Create Page File**
   ```bash
   # For public page
   touch src/app/new-page/page.js

   # For protected page
   touch src/app/(protected)/new-page/page.js
   ```

2. **Server Component Template**
   ```javascript
   // src/app/new-page/page.js
   export const metadata = {
     title: "New Page - Patrik Products",
     description: "Description for SEO",
   };

   export default async function NewPage() {
     return (
       <div className="container mx-auto px-4 py-8">
         <h1 className="text-3xl font-bold mb-6">New Page</h1>
         <p>Content goes here</p>
       </div>
     );
   }
   ```

3. **Client Component Template**
   ```javascript
   // src/app/new-page/page.js
   "use client";

   import { useState } from "react";

   export default function NewPage() {
     const [state, setState] = useState(null);

     return (
       <div className="container mx-auto px-4 py-8">
         <h1 className="text-3xl font-bold mb-6">New Page</h1>
         {/* Interactive content */}
       </div>
     );
   }
   ```

4. **Add Navigation Link**
   ```javascript
   // src/components/Navbar.js
   <Link href="/new-page" className="...">
     New Page
   </Link>
   ```

---

### Adding a New Component

1. **Create Component File**
   ```bash
   touch src/components/MyComponent.js
   ```

2. **Component Template**
   ```javascript
   "use client"; // Only if needed

   import { useState } from "react";

   /**
    * MyComponent description
    * @param {Object} props
    * @param {string} props.title - Component title
    * @param {Function} props.onAction - Callback function
    */
   export default function MyComponent({ title, onAction }) {
     const [state, setState] = useState(null);

     const handleClick = () => {
       onAction();
     };

     return (
       <div className="p-4 bg-neutral-900 rounded-xl">
         <h2 className="text-xl font-bold mb-4">{title}</h2>
         <button
           onClick={handleClick}
           className="px-4 py-2 bg-[#01a0be] rounded-lg hover:bg-[#018a9f]"
         >
           Action
         </button>
       </div>
     );
   }
   ```

3. **Import and Use**
   ```javascript
   import MyComponent from "@/components/MyComponent";

   <MyComponent
     title="My Title"
     onAction={() => console.log("Action!")}
   />
   ```

---

### Adding an API Route

1. **Create Route Handler**
   ```bash
   mkdir -p src/app/nextapi/my-endpoint
   touch src/app/nextapi/my-endpoint/route.js
   ```

2. **Route Template**
   ```javascript
   import { NextResponse } from "next/server";

   // GET handler
   export async function GET(request) {
     try {
       const data = { message: "Success" };
       return NextResponse.json(data);
     } catch (error) {
       return NextResponse.json(
         { error: "Internal server error" },
         { status: 500 }
       );
     }
   }

   // POST handler
   export async function POST(request) {
     try {
       const body = await request.json();

       // Validate input
       if (!body.required_field) {
         return NextResponse.json(
           { error: "Missing required field" },
           { status: 400 }
         );
       }

       // Process request
       const result = processData(body);

       return NextResponse.json(result);
     } catch (error) {
       return NextResponse.json(
         { error: "Internal server error" },
         { status: 500 }
       );
     }
   }
   ```

3. **Call from Client**
   ```javascript
   const response = await fetch("/nextapi/my-endpoint", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ required_field: "value" }),
   });

   const data = await response.json();
   ```

---

### Adding a New Export Preset

1. **Define Preset Fields**
   ```javascript
   // In src/components/ExportPage.js

   const presets = {
     // ... existing presets
     custom: {
       name: "custom",
       description: "My custom export format",
       fields: [
         "Product Code",
         "Product Name",
         "Custom Field 1",
         "Custom Field 2",
       ],
     },
   };
   ```

2. **Add Field Mapping**
   ```javascript
   const getFieldValue = (product, variant, field, isFirstVariant) => {
     switch (field) {
       case "Custom Field 1":
         return customCalculation(product);
       case "Custom Field 2":
         return variant.custom_property || "";
       // ... other fields
       default:
         return "";
     }
   };
   ```

3. **Add Preset Button**
   ```javascript
   <button
     onClick={() => handlePresetChange("custom")}
     className={selectedPreset === "custom" ? "active" : ""}
   >
     Custom Format
   </button>
   ```

---

### Styling Components

**Color Palette**:
```javascript
// Primary
bg-[#01a0be]      // Cyan
hover:bg-[#018a9f] // Darker cyan

// Backgrounds
bg-black           // Page background
bg-neutral-900     // Card background
bg-neutral-800     // Elevated surface

// Borders
border-neutral-700 // Standard border
border-neutral-600 // Hover border

// Text
text-neutral-100   // Primary text
text-neutral-300   // Secondary text
text-neutral-500   // Muted text
```

**Common Patterns**:
```javascript
// Card
<div className="bg-neutral-900 border border-neutral-700/50 rounded-xl p-6">
  {/* Content */}
</div>

// Button
<button className="px-4 py-2 bg-[#01a0be] text-white rounded-lg hover:bg-[#018a9f] transition">
  Click Me
</button>

// Input
<input className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:border-[#01a0be] outline-none" />

// Grid Layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Items */}
</div>
```

---

## Testing

### Manual Testing Checklist

**Authentication**:
- [ ] Login flow works
- [ ] Logout flow works
- [ ] Protected routes redirect to login
- [ ] Session persists across page refreshes
- [ ] Social login works (if enabled)

**Product Catalog**:
- [ ] Products load correctly
- [ ] Grid/List toggle works
- [ ] Product selection persists
- [ ] Images load and carousel works
- [ ] Prices display correctly
- [ ] Stock status accurate
- [ ] Responsive on mobile/tablet/desktop

**Export**:
- [ ] All presets generate correct CSV
- [ ] Filters work as expected
- [ ] Field selection updates preview
- [ ] Pricelist priority affects pricing
- [ ] Save/load configurations work
- [ ] CSV downloads successfully
- [ ] Preview shows correct data

**Contact Form**:
- [ ] Form validation works
- [ ] Email sends successfully
- [ ] Confirmation email received
- [ ] Error handling displays properly

### Browser Testing

Test in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Debugging

### Next.js Debugging

**Enable Verbose Logging**:
```bash
NODE_OPTIONS='--inspect' npm run dev
```

**Chrome DevTools**:
1. Open Chrome
2. Navigate to `chrome://inspect`
3. Click "Open dedicated DevTools for Node"

### Common Debug Techniques

**Server Component Debugging**:
```javascript
export default async function Page() {
  const data = await fetchData();

  // Log in terminal (server-side)
  console.log("Server data:", data);

  return <Component data={data} />;
}
```

**Client Component Debugging**:
```javascript
"use client";

export default function Component() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Log in browser console
    console.log("Client data:", data);
  }, [data]);

  return <div>...</div>;
}
```

**API Route Debugging**:
```javascript
export async function POST(request) {
  const body = await request.json();
  console.log("API received:", body);

  try {
    const result = await processData(body);
    console.log("API result:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### React DevTools

Install browser extension:
- Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi
- Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/

**Inspect Component State**:
1. Open DevTools
2. Click "Components" tab
3. Select component
4. View props, state, hooks

---

## Code Quality

### ESLint

**Run Linter**:
```bash
npm run lint
```

**Fix Auto-fixable Issues**:
```bash
npm run lint -- --fix
```

**Common Rules**:
- No unused variables
- No console.log (use console.error for errors)
- Prefer const over let
- No var declarations
- React hooks dependency arrays

### Code Formatting

**Prettier** (recommended):
```bash
npm install --save-dev prettier
```

`.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80
}
```

**Format on Save**:
- VS Code: Install Prettier extension, enable "Format on Save"
- WebStorm: Settings > Languages & Frameworks > JavaScript > Prettier

### Performance Monitoring

**React Developer Tools Profiler**:
1. Open DevTools > Profiler tab
2. Click "Record"
3. Interact with app
4. Click "Stop"
5. Analyze render times

**Identify Issues**:
- Components rendering too frequently
- Expensive calculations not memoized
- Unnecessary re-renders

---

## Deployment

### Production Build

```bash
# Build application
npm run build

# Test production build locally
npm start
```

### Docker Deployment

**Build Image**:
```bash
docker build -t patrik-products-ui:latest .
```

**Run Container**:
```bash
docker run -p 3000:3000 \
  --env-file .env \
  patrik-products-ui:latest
```

**Docker Compose** (recommended):

`docker-compose.yml`:
```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
```

Run:
```bash
docker-compose up -d
```

### Environment-Specific Builds

**Staging**:
```env
EXPORT_API_URL=https://staging-api.patrikinternational.com
AUTH0_BASE_URL=https://staging.patrikinternational.com
```

**Production**:
```env
EXPORT_API_URL=https://api.patrikinternational.com
AUTH0_BASE_URL=https://partners.patrikinternational.com
```

---

## Troubleshooting

### Build Fails

**Clear Cache**:
```bash
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

**Check Node Version**:
```bash
node --version  # Must be 18+
```

### Auth0 Issues

**Invalid Callback URL**:
- Verify callback URLs in Auth0 dashboard match your environment
- Check `AUTH0_BASE_URL` matches your domain

**Session Not Persisting**:
- Verify `AUTH0_SECRET` is set (32+ characters)
- Check browser cookies are enabled
- Clear browser cache and cookies

### API Connection Errors

**CORS Issues**:
```javascript
// Backend should have:
app.use(cors({
  origin: ['http://localhost:3000', 'https://partners.patrikinternational.com'],
  credentials: true,
}));
```

**Network Error**:
- Verify `EXPORT_API_URL` is correct
- Check backend is running
- Test API endpoint directly (Postman, curl)

### Image Loading Fails

**Remote Images Not Loading**:
- Check `next.config.mjs` has correct `remotePatterns`
- Verify image URLs are HTTPS (not HTTP)
- Check image source allows cross-origin requests

**Example Fix**:
```javascript
// next.config.mjs
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'imgs.pnvnet.si',
      pathname: '/**',
    },
  ],
}
```

### localStorage Not Working

**Private Browsing**:
- localStorage disabled in private/incognito mode
- Add fallback to in-memory storage

**Quota Exceeded**:
```javascript
try {
  localStorage.setItem(key, value);
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    // Clear old data or use alternative storage
    console.error('localStorage quota exceeded');
  }
}
```

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint

# Dependencies
npm install              # Install dependencies
npm update               # Update dependencies
npm outdated             # Check outdated packages

# Git
git status               # Check file status
git add .                # Stage all changes
git commit -m "message"  # Commit changes
git push                 # Push to remote
git pull                 # Pull from remote

# Docker
docker build -t app .    # Build image
docker run -p 3000:3000 app  # Run container
docker ps                # List running containers
docker logs <container>  # View logs
docker stop <container>  # Stop container
```

---

## Resources

- **Next.js**: https://nextjs.org/docs
- **React**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Auth0**: https://auth0.com/docs
- **Node.js**: https://nodejs.org/docs

---

---

<div align="center">

[Back to Documentation Index](./README.md)

</div>
