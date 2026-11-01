export const ENTITY_CONTEXT_STORAGE_KEY = "salary_manager.active_entity_id";

export function parseEntityIdFromPath(pathname: string): number | null {
  const match = pathname.match(/^\/entities\/(\d+)(?:\/|$)/);
  if (!match) {
    return null;
  }
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}

export function readStoredEntityId(
  storage: Pick<Storage, "getItem"> = sessionStorage,
): number | null {
  const raw = storage.getItem(ENTITY_CONTEXT_STORAGE_KEY);
  if (raw == null || raw === "") {
    return null;
  }
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export function writeStoredEntityId(
  id: number | null,
  storage: Pick<Storage, "setItem" | "removeItem"> = sessionStorage,
): void {
  if (id == null) {
    storage.removeItem(ENTITY_CONTEXT_STORAGE_KEY);
    return;
  }
  storage.setItem(ENTITY_CONTEXT_STORAGE_KEY, String(id));
}
