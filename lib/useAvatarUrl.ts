import { useEffect, useState } from "react";
import { getSignedUrl } from "./storage";

/** Resolves a profiles.avatar_url storage path into a displayable signed URL. */
export function useAvatarUrl(path: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!path) {
      setUrl(null);
      return;
    }
    getSignedUrl("avatars", path).then((signed) => {
      if (!cancelled) setUrl(signed);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return url;
}
