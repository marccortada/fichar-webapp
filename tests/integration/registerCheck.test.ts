import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerCheck } from '@/app/actions/timeEntries';
import * as auth from '@/lib/auth';

vi.mock('@/lib/notifications', () => ({
  notifySlack: vi.fn(),
  notifyEmail: vi.fn(),
}));

describe('registerCheck action', () => {
  const createChain = () => {
    const builder: any = {};
    builder.eq = () => builder;
    builder.is = () => builder;
    builder.order = () => builder;
    builder.limit = () => builder;
    builder.maybeSingle = () => Promise.resolve({ data: null, error: null });
    builder.select = () => builder;
    return builder;
  };

  let timeEntriesClient: any;
  const settingsClient = {
    select: () => ({
      eq: () => ({ maybeSingle: () => Promise.resolve({ data: { lateness_threshold_minutes: null, timezone: 'UTC' }, error: null }) }),
    }),
  } as any;
  const companiesClient = {
    select: () => ({
      eq: () => ({ maybeSingle: () => Promise.resolve({ data: { name: 'Demo Corp', email: 'ops@demo.com' }, error: null }) }),
    }),
  } as any;

  const mockSupabase = {
    from: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    timeEntriesClient = {
      select: vi.fn(() => createChain()),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => ({ eq: () => Promise.resolve({ error: null }) })),
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'time_entries') return timeEntriesClient;
      if (table === 'settings') return settingsClient;
      if (table === 'companies') return companiesClient;
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
