const DELIVERABLE_TYPES = [
  "market_insight",
  "analysis_report",
  "dataset",
  "signal",
  "forecast",
  "strategy",
];

const deliverables = [];

export function getDeliverableTypes() {
  return [...DELIVERABLE_TYPES];
}

export function saveDeliverable(asset) {
  const type =
    asset.type && DELIVERABLE_TYPES.includes(asset.type)
      ? asset.type
      : "market_insight";

  const producedBy =
    asset.producedBy && typeof asset.producedBy === "object"
      ? asset.producedBy
      : { provider: asset.agents?.[0], executionAgent: asset.agents?.[0] };

  const deliverable = {
    id: `asset_${Date.now()}`,
    type,
    content: asset.content,
    producedBy,
    agents: asset.agents,
    cost: asset.cost,
    createdAt: Date.now(),
  };

  deliverables.push(deliverable);

  return deliverable;
}

export function getDeliverables() {
  return deliverables;
}
