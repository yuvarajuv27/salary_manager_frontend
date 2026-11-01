import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  parseEntityIdFromPath,
  readStoredEntityId,
  writeStoredEntityId,
} from "./entityContext";

export function useEntityContext() {
  const location = useLocation();
  const navigate = useNavigate();
  const urlEntityId = parseEntityIdFromPath(location.pathname);
  const [storedEntityId, setStoredEntityId] = useState<number | null>(() =>
    readStoredEntityId(),
  );

  useEffect(() => {
    if (urlEntityId == null) {
      return;
    }
    writeStoredEntityId(urlEntityId);
    setStoredEntityId(urlEntityId);
  }, [urlEntityId]);

  const activeEntityId = urlEntityId ?? storedEntityId;

  function selectEntity(id: number | null) {
    writeStoredEntityId(id);
    setStoredEntityId(id);
    if (id == null) {
      if (parseEntityIdFromPath(location.pathname) != null) {
        navigate("/entities");
      }
      return;
    }
    navigate(`/entities/${id}`);
  }

  return { activeEntityId, urlEntityId, selectEntity };
}
