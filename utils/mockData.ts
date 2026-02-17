import type { Bookmark, User, Session } from './types'

// Check if demo mode is enabled
export const isDemoMode = (): boolean => {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}

// Mock user for demo mode
export const mockUser: User = {
  id: 'demo-user-123',
  email: 'demo@example.com',
}

// Mock session for demo mode
export const mockSession: Session = {
  access_token: 'demo-access-token',
  user: mockUser,
}

// Mock bookmarks for demo mode
export const mockBookmarks: Bookmark[] = [
  {
    id: '1',
    user_id: 'demo-user-123',
    title: 'Next.js Documentation',
    url: 'https://nextjs.org/docs',
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  {
    id: '2',
    user_id: 'demo-user-123',
    title: 'Supabase - The Open Source Firebase Alternative',
    url: 'https://supabase.com',
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  },
  {
    id: '3',
    user_id: 'demo-user-123',
    title: 'shadcn/ui - Re-usable components',
    url: 'https://ui.shadcn.com',
    created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
  },
  {
    id: '4',
    user_id: 'demo-user-123',
    title: 'Tailwind CSS - Rapidly build modern websites',
    url: 'https://tailwindcss.com',
    created_at: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
  },
  {
    id: '5',
    user_id: 'demo-user-123',
    title: 'TypeScript Documentation',
    url: 'https://www.typescriptlang.org/docs',
    created_at: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
  },
  {
    id: '6',
    user_id: 'demo-user-123',
    title: 'React - The library for web and native user interfaces',
    url: 'https://react.dev',
    created_at: new Date(Date.now() - 518400000).toISOString(), // 6 days ago
  },
]

// Generate a new mock bookmark ID
let mockIdCounter = mockBookmarks.length + 1
export const generateMockId = (): string => {
  return String(mockIdCounter++)
}

// Simulate async delay for realistic demo
export const simulateDelay = (ms: number = 500): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
