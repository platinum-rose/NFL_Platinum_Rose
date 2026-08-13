import { describe, it, expect } from 'vitest';
import { classifyEmailRuleBased, processEmailItem } from '../../agents/gmail-intake-agent.js';

describe('gmail-intake-agent', () => {
  it('classifies sharp pick emails correctly using rule-based fallback', () => {
    const email = {
      subject: 'Week 1 Sharp Pick: KC Chiefs -3 vs BAL',
      body: 'Recommended play: KC Chiefs -3 (-110). Heavy sharp money in early betting.'
    };
    const result = classifyEmailRuleBased(email);
    expect(result.category).toBe('official_picks');
    expect(result.urgency).toBe('high');
    expect(result.teams).toContain('KC');
    expect(result.teams).toContain('BAL');
  });

  it('classifies emergency injury emails correctly', () => {
    const email = {
      subject: 'EMERGENCY LINE ALERT: Christian McCaffrey ruled OUT',
      body: 'SF RB McCaffrey is officially ruled OUT. Line moving from -4.5 to -3.5.'
    };
    const result = classifyEmailRuleBased(email);
    expect(result.category).toBe('injury_reports');
    expect(result.urgency).toBe('emergency');
    expect(result.teams).toContain('SF');
  });

  it('processes sample email item into summary artifact payload', async () => {
    const sampleMsg = {
      id: 'test-msg-99',
      from: 'Test Sender <test@example.com>',
      subject: 'Test Injury Alert: Patrick Mahomes limited in practice',
      date: new Date().toISOString(),
      body: 'Patrick Mahomes (KC) was limited in Thursday practice with a minor ankle tweak.'
    };

    const res = await processEmailItem(sampleMsg);
    expect(res.id).toBe('test-msg-99');
    expect(res.subject).toContain('Patrick Mahomes');
    expect(res.category).toBeDefined();
    expect(res.local_path).toContain('.nfl');
    expect(res.vault_path).toContain('NFL/Newsletters/');
  });
});
