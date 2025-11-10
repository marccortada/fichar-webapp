import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSession } from '@/lib/getSession';
import * as client from '@/lib/supabaseServerClient';

describe('getSession helper', () => {
  const mockSupabase = {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(client, 'createSupabaseServerClient').mockResolvedValue(mockSupabase);
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1', email: 'demo@gnerai.com', user_metadata: {} } } },
      error: null,
    });
  });

  it('returns null when there is no session', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });
    const result = await getSession();
    expect(result).toBeNull();
  });

  it('returns fallback profile if Supabase profile is missing', async () => {
    mockSupabase.from.mockReturnValue({
      select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
    });

    const result = await getSession();
    expect(result?.profile.full_name).toContain('demo');
    expect(result?.profile.role).toBe('employee');
  });
});
