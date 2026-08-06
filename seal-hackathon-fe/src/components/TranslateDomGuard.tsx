"use client";

/**
 * Google Translate rewrites the page's text nodes into its own <font> wrappers,
 * directly under React. React still holds references to the original nodes, so
 * the next update throws:
 *
 *   NotFoundError: Failed to execute 'removeChild' on 'Node':
 *   The node to be removed is not a child of this node.
 *
 * There is no way to make React and Translate agree on who owns those nodes, so
 * we make the two DOM calls React uses tolerant of the mismatch instead: if the
 * node has already been moved, treat the removal as done rather than throwing.
 *
 * The patch is installed at module scope — before React renders anything — and
 * is idempotent so Fast Refresh cannot stack it.
 */

declare global {
  interface Window {
    __sealTranslateDomGuard?: true;
  }
}

/** Google's widget stamps these on <html> once a translation is applied. */
function translationLooksActive(): boolean {
  const root = document.documentElement;
  return (
    root.classList.contains("translated-ltr") ||
    root.classList.contains("translated-rtl") ||
    document.querySelector(".goog-te-combo") !== null
  );
}

function warnIfProbablyOurBug(method: string): void {
  // A mismatch with no translation in sight is more likely a real bug in our
  // own render logic, so surface it in development rather than hiding it.
  if (process.env.NODE_ENV !== "production" && !translationLooksActive()) {
    console.warn(
      `[TranslateDomGuard] Suppressed a ${method} mismatch, but Google Translate does not appear active. ` +
        "If this repeats, it may be a genuine rendering bug rather than translation interference.",
    );
  }
}

if (typeof window !== "undefined" && !window.__sealTranslateDomGuard) {
  window.__sealTranslateDomGuard = true;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function removeChild<T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      warnIfProbablyOurBug("removeChild");
      // Already detached (or re-parented by Translate) — the caller's intent is
      // satisfied, so report success instead of throwing.
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function insertBefore<T extends Node>(
    this: Node,
    newNode: T,
    referenceNode: Node | null,
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      warnIfProbablyOurBug("insertBefore");
      // The anchor is gone; appending keeps the node in the tree, which is the
      // closest thing to what React asked for.
      return originalInsertBefore.call(this, newNode, null) as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

/** Renders nothing; exists so the layout can pull the patch into the client bundle. */
export default function TranslateDomGuard() {
  return null;
}
