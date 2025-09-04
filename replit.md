# SmartPOS - Offline-First Point of Sale System

## Overview

SmartPOS is a comprehensive Point of Sale system designed for retail stores and restaurants with offline-first capabilities. The system ensures business continuity by allowing transactions to be processed even when internet connectivity is unavailable. Built as a full-stack TypeScript application, it provides inventory management, customer tracking, transaction processing, and reporting features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built with React using Vite as the build tool. It implements a component-based architecture with:
- **UI Framework**: shadcn/ui components built on top of Radix UI primitives for consistent design
- **Styling**: Tailwind CSS with custom design system variables for theming
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (@tanstack/react-query) for server state management and caching
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Offline Capabilities**: Custom IndexedDB service for local data storage and synchronization

The application features a modular page structure:
- Point of Sale interface for transaction processing
- Dashboard for business metrics and analytics
- Inventory management for product catalog
- Customer management system
- Reports and analytics
- Settings and configuration

### Backend Architecture
The server is built with Express.js and follows a clean architecture pattern:
- **API Layer**: RESTful endpoints organized by feature domains (products, customers, transactions)
- **Authentication**: Replit Auth integration with OpenID Connect for secure user authentication
- **Session Management**: PostgreSQL-backed session storage using connect-pg-simple
- **Data Access**: Centralized storage layer with interface-based design for testability
- **Database ORM**: Drizzle ORM with TypeScript-first schema definitions

### Data Storage Solutions
The system uses a hybrid storage approach:
- **Primary Database**: PostgreSQL via Neon serverless with connection pooling
- **Local Storage**: IndexedDB for offline data caching and pending synchronization
- **Session Storage**: PostgreSQL table for user session persistence
- **Schema Management**: Drizzle migrations with shared TypeScript schema definitions

Key database entities include:
- Users with role-based access (cashier, manager, admin)
- Products with inventory tracking and categorization
- Customers with contact information and credit balances
- Transactions with detailed line items and payment methods
- Inventory movements for stock tracking and auditing

### Authentication and Authorization
- **Identity Provider**: Replit Auth with OpenID Connect integration
- **Session Management**: Secure HTTP-only cookies with PostgreSQL persistence
- **Role-based Access**: User roles controlling feature access and permissions
- **Route Protection**: Middleware-based authentication checks on API endpoints

### Offline-First Design
The system implements a robust offline synchronization strategy:
- **Local Data Cache**: Complete product catalog and customer data stored in IndexedDB
- **Transaction Queuing**: Offline transactions queued for later synchronization
- **Connection Monitoring**: Real-time connection status with automatic sync triggers
- **Conflict Resolution**: Server-side validation and conflict handling during sync
- **Progressive Enhancement**: Full functionality available offline with enhanced features online

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations with migration support

### Authentication Services
- **Replit Auth**: OpenID Connect provider for user authentication and profile management

### Development and Build Tools
- **Vite**: Frontend build tool with hot module replacement and optimized bundling
- **TypeScript**: End-to-end type safety across client, server, and shared code
- **ESBuild**: Server-side bundling for production deployment

### UI and Styling
- **Radix UI**: Unstyled, accessible UI primitives for complex components
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide Icons**: Consistent icon library for UI elements

### Monitoring and Development
- **Replit Runtime**: Development environment integration with error overlay and cartographer
- **Browser APIs**: IndexedDB for offline storage, Service Worker support for background sync

The architecture prioritizes reliability and user experience by ensuring the POS system remains functional during network outages while providing seamless synchronization when connectivity is restored.