const campaignKey = 'pax.campaign.v1';

export interface CampaignProgress {
  completedScenarios: string[];
}

export function loadCampaignProgress(): CampaignProgress {
  try {
    const raw = JSON.parse(localStorage.getItem(campaignKey) ?? '{}');
    return { completedScenarios: Array.isArray(raw.completedScenarios) ? raw.completedScenarios : [] };
  } catch {
    return { completedScenarios: [] };
  }
}

export function markScenarioComplete(scenarioId: string): CampaignProgress {
  const progress = loadCampaignProgress();
  if (!progress.completedScenarios.includes(scenarioId))
    progress.completedScenarios.push(scenarioId);
  localStorage.setItem(campaignKey, JSON.stringify(progress));
  return progress;
}

export function isScenarioComplete(scenarioId: string): boolean {
  return loadCampaignProgress().completedScenarios.includes(scenarioId);
}
