import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerCheck } from '@/app/actions/timeEntries';
import * as auth from '@/lib/auth';

const createBuilder = () => {
  const builder: any = {};
  builder.select = () => builder;
  builder.eq = () => builder;
  builder.is = () => builder;
  builder.order = () => builder;
  builder.limit = () => builder;
  builder.maybeSingle = () => Promise.resolve({ data: null, error: null });
  return builder;
};

vi.mock('@/lib/notifications', () => ({
  notifySlack: vi.fn(),
  notifyEmail: vi.fn(),
}));

describe('registerCheck action', () => {
  let mockSupabase: any;
  let timeEntriesClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = { from: vi.fn(), rpc: vi.fn() };

    const builder = createBuilder();
    timeEntriesClient = {
      select: vi.fn(() => builder),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => ({ eq: () => Promise.resolve({ error: null }) })),
    };

    const genericClient = {
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
      }),
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'time_entries') return timeEntriesClient;
      if (table === 'settings' || table === 'companies') return genericClient;
      throw new Error(`Unexpected table ${table}`);
    });

    vi.spyOn(auth, 'requireAuth').mockResolvedValue({
      supabase: mockSupabase,
      session: { user: { id: 'user-1' } },
      profile: { company_id: 'company-1', full_name: 'Tester' },
    } as any);
  });

  it('creates a new entry when there is no open check-in', async () => {
    const result = await registerCheck({ type: 'in', notes: 'Test note' });
    expect(result.success).toBe(true);
    expect(timeEntriesClient.insert).toHaveBeenCalled();
  });
});
