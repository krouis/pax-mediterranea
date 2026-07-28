import { beforeEach, describe, expect, it } from 'vitest';
import { isScenarioComplete, loadCampaignProgress, markScenarioComplete } from './campaign';

describe('campaign progress persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with no completed scenarios', () => {
    expect(loadCampaignProgress()).toEqual({ completedScenarios: [] });
    expect(isScenarioComplete('sicilian-question')).toBe(false);
  });

  it('records a scenario as complete without duplicating it', () => {
    markScenarioComplete('sicilian-question');
    markScenarioComplete('sicilian-question');
    expect(loadCampaignProgress()).toEqual({ completedScenarios: ['sicilian-question'] });
    expect(isScenarioComplete('sicilian-question')).toBe(true);
  });

  it('recovers from corrupted storage', () => {
    localStorage.setItem('pax.campaign.v1', 'not json');
    expect(loadCampaignProgress()).toEqual({ completedScenarios: [] });
  });
});
