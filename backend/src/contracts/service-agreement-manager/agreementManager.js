import crypto from "crypto";

const agreements = new Map();

export const AGREEMENT_STATES = [
  "pending",
  "negotiating",
  "executing",
  "completed",
  "settled",
  "failed",
];

export function createAgreement({
  taskId,
  provider,
  providerAgent,
  service,
  price,
}) {
  const agreement = {
    agreementId: crypto.randomUUID(),
    taskId,
    provider: providerAgent || provider,
    service,
    price: price.toString(),
    status: "pending",
    signatures: {}, // { agentId: signature }
    createdAt: Date.now(),
  };
  agreements.set(agreement.agreementId, agreement);
  return agreement;
}

export function signAgreement(agreementId, agentId, signature) {
  const agreement = agreements.get(agreementId);
  if (!agreement) return null;
  agreement.signatures[agentId] = signature;
  return agreement;
}

export function updateAgreementStatus(agreementId, status) {
  const agreement = agreements.get(agreementId);
  if (!agreement) return null;
  if (AGREEMENT_STATES.includes(status)) {
    agreement.status = status;
    if (
      status === "executing" ||
      status === "completed" ||
      status === "settled"
    ) {
      agreement.updatedAt = Date.now();
    }
  }
  return agreement;
}

function resolveAgreement(agreementOrId) {
  if (typeof agreementOrId === "string") {
    return agreements.get(agreementOrId);
  }
  return agreementOrId;
}

export function completeAgreement(agreementOrId) {
  const agreement = resolveAgreement(agreementOrId);
  if (!agreement) return null;
  agreement.status = "completed";
  agreement.completedAt = Date.now();
  return agreement;
}

export function failAgreement(agreementOrId) {
  const agreement = resolveAgreement(agreementOrId);
  if (!agreement) return null;
  agreement.status = "failed";
  agreement.failedAt = Date.now();
  return agreement;
}

export function settleAgreement(agreementOrId) {
  const agreement = resolveAgreement(agreementOrId);
  if (!agreement) return null;
  agreement.status = "settled";
  agreement.settledAt = Date.now();
  return agreement;
}

export function getAgreement(agreementId) {
  return agreements.get(agreementId) || null;
}

export function getAllAgreements() {
  return Array.from(agreements.values());
}
