import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSession } from '@/lib/getSession';
import * as client from '@/lib/supabaseServerClient';

describe('getSession', () => {
  const mockAuth = {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(client, 'createSupabaseServerClient').mockResolvedValue(mockAuth);
    mockAuth.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1', email: 'demo@gnerai.com', user_metadata: {} } } },
      error: null,
    });
  });

  it('returns null if no session', async () => {
    mockAuth.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });
    const result = await getSession();
    expect(result).toBeNull();
  });

  it('returns session with fallback profile', async () => {
    mockAuth.from.mockReturnValue({
      select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
    });

    const result = await getSession();
    expect(result?.profile.full_name).toContain('demo');
    expect(result?.profile.role).toBe('employee');
  });
});
