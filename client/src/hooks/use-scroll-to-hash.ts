import { useEffect } from "react";

// Arriving from another page at /page#section: the browser jumps before a lazy page renders,
// so scroll to the section once the page has mounted.
export function useScrollToHash() {
  useEffect(() => {
    if (window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
  }, []);
}
