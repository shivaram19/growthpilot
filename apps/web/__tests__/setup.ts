import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Next.js modules
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/headers", () => ({
  cookies: () => ({ get: vi.fn(), set: vi.fn() }),
  headers: () => new Headers(),
}));

// Mock Clerk
vi.mock("@clerk/nextjs", () => ({
  auth: vi.fn(() => ({ userId: "test-user-id", orgId: null })),
  UserButton: () => null,
  SignIn: () => null,
  SignUp: () => null,
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: "test-user-id", orgId: null })),
  clerkMiddleware: vi.fn(() => vi.fn()),
  createRouteMatcher: vi.fn(() => vi.fn()),
}));

// Mock Prisma
vi.mock("@/lib/prisma/client", () => ({
  db: {
    organization: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    member: { findFirst: vi.fn() },
    shopifyStore: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    product: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), upsert: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
    order: { findMany: vi.fn(), upsert: vi.fn() },
    orderItem: { create: vi.fn() },
    shopifyCustomer: { findFirst: vi.fn(), upsert: vi.fn() },
    metaAdAccount: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    metaAdCampaign: { findMany: vi.fn(), upsert: vi.fn() },
    campaign: { findMany: vi.fn(), create: vi.fn(), count: vi.fn() },
    audience: { findMany: vi.fn() },
    aIInsight: { create: vi.fn() },
    syncLog: { create: vi.fn(), update: vi.fn() },
  },
}));

// Mock OpenAI
vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
}));

// Global fetch mock
global.fetch = vi.fn();
