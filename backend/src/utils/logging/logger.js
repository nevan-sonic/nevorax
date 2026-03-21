export function logEconomy(event, payload) {
  console.log(
    `[NevoraX Economy] ${event}`,
    JSON.stringify(payload ?? {}, null, 2),
  );
}
