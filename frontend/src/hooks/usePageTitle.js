import { useEffect } from "react";

export function usePageTitle(title, notificationCount = 0) {
  useEffect(() => {
    const badge = notificationCount > 0 ? `(${notificationCount}) ` : "";
    document.title = `${badge}${title} | Otokwikk`;
  }, [title, notificationCount]);
}