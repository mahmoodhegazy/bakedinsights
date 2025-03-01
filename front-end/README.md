# Baked Insights Frontend

## Tech Stack

- **React**: Frontend library for building user interfaces
- **TypeScript**: Static typing for JavaScript
- **Vite**: Modern build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Mantine**: React components library
- **React Query**: Data-fetching and state management
- **Zustand**: Simple state management
- **React Router**: Client-side routing
- **Axios**: HTTP client

## Project Structure

```
├── src
│   ├── App.tsx
│   ├── api
│   │   └── axios.ts
│   ├── assets
│   │   └── images
│   │       ├── B-logo.png
│   │       ├── B-logo.svg
│   │       └── logo.svg
│   ├── components
│   │   ├── Sidebar.tsx
│   │   ├── Table.tsx
│   │   ├── TableRow.tsx
│   │   ├── TableSelectCell.tsx
│   │   └── TableTextCell.tsx
│   ├── hooks
│   │   ├── unsetAuth.ts
│   │   └── useAuth.ts
│   ├── index.css
│   ├── layouts
│   │   ├── AdminLayout.tsx
│   │   ├── MainLayout.tsx
│   │   └── PrivateLayout.tsx
│   ├── main.tsx
│   ├── pages
│   │   ├── Dashbaord.tsx
│   │   ├── Login.tsx
│   │   ├── admin
│   │   │   ├── SKUAdminConsole.tsx
│   │   │   └── UserAdminConsole.tsx
│   │   ├── checklists
│   │   │   └── Checklists.tsx
│   │   └── tables
│   │       └── Tables.tsx
│   ├── types
│   │   └── index.ts
│   └── vite-env.d.ts
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.tsation
└── vite.config.ts           # Vite configuration

```

## Key Components and Their Purposes

### Components (`src/components/`)

- **Layout Components**: Base structural components used across the application
  - `Header.tsx`: Navigation and user information
  - `MainLayout.tsx`: Common layout wrapper with navigation
- **Feature Components**: Organized by feature (Checklists, Users, Tables)
  - Each component follows single responsibility principle
  - Components are modular and reusable

### Configuration (`src/config/`)

- **API Configuration**: Axios setup and interceptors
  - Handles authentication headers
  - Manages API error responses
  - Provides base URL configuration

### Custom Hooks (`src/hooks/`)

- **useAuth**: Authentication state management
  - User login/logout functionality
  - Token management
  - Role-based access control
- **useApi**: API integration hooks
  - Data fetching utilities
  - Error handling
  - Loading states

### Pages (`src/pages/`)

- **Feature-based Organization**: Each major feature has its own directory
- **Modular Structure**: Pages compose smaller components
- **Route Integration**: Each page corresponds to a route

### Types (`src/types/`)

- **Shared Interfaces**: Common TypeScript interfaces
- **API Types**: Types for API requests and responses
- **Component Props**: Type definitions for component properties

## Authentication and Authorization

### Authentication Flow

1. User submits login credentials
2. Backend validates and returns JWT token
3. Token stored in localStorage
4. Axios interceptor adds token to requests
5. Protected routes check for valid token

### Role-Based Access

- **Super Admin**: Full system access
- **Admin**: Checklist and user management
- **Manager**: View and acknowledge checklists
- **Operator**: Submit checklists
- **Office Staff**: Manage production records

## Development Setup

1. **Installation**

```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
npm install
```

2. **Environment Configuration**

```bash
# Create .env.development file
VITE_API_URL=http://localhost:5000/api
```

3. **Development Server**

```bash
npm run dev
```

4. **Build for Production**

```bash
npm run build
```

## Best Practices

### Code Organization

- Components follow single responsibility principle
- Feature-based folder structure
- Consistent file naming conventions
- Type safety with TypeScript

### State Management

- Zustand for global state
- React Query for server state
- Local state with useState when appropriate
- Memoization with useMemo and useCallback

### Styling

- Tailwind CSS for utility-first styling
- Consistent component styling patterns
- Responsive design principles
- Mantine components for complex UI elements

### Performance

- Code splitting with React.lazy
- Memoization of expensive computations
- Optimized re-renders
- Proper dependency management in useEffect

## Testing

- Unit tests with Jest
- Component tests with React Testing Library
- Integration tests for critical paths
- E2E tests with Cypress (planned)

## Security

- JWT token management
- XSS prevention
- CSRF protection
- Secure HTTP headers
- Input validation

## Contributing

1. Create feature branch from development
2. Follow TypeScript best practices
3. Maintain consistent code style
4. Write tests for new features
5. Submit PR with detailed description

This documentation is maintained by the Baked Insights team and should be updated as the project evolves.
