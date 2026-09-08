/** ID pro čistě klientské položky (pole v akci, období nedostupnosti) —
 * není to Firestore doc ID, jen unikátní klíč v poli/seznamu. */
export function newId(): string {
  return typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}
