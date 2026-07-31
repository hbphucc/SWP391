/**
 * Score colouring, shared by the rankings table and the judge scoring form.
 *
 * Both screens used to hard-code an 80/60 scale, which was wrong in two ways:
 * a team on 45 had cleared the real pass bar of 40 but rendered red, and a
 * single criterion scored 10 out of 10 also rendered red because a raw 10 is
 * below 60. Colour now tracks the bar that actually applies.
 */

/** Backend fallback when a round sets no PassThreshold: 40% of a 100-point weight total. */
export const DEFAULT_PASS_THRESHOLD = 40;

const FAIL = "var(--color-rose)";
const PASS = "var(--color-amber)";
const STRONG = "var(--color-emerald)";

/**
 * For totals on the 0..(criteria weight total) scale — the ranking score and the
 * judge's weighted total. Below the bar fails; up to double the bar is a pass;
 * beyond that is a strong pass.
 */
export function scoreColor(score: number, passThreshold?: number): string {
  const bar = passThreshold ?? DEFAULT_PASS_THRESHOLD;
  if (score < bar) return FAIL;
  if (score < bar * 2) return PASS;
  return STRONG;
}

/**
 * For a single criterion, whose raw score runs 0..maxScore (often 0..10) and so
 * cannot be compared against a 0..100 bar. Judged on the fraction awarded.
 */
export function ratioColor(score: number, maxScore: number): string {
  if (!maxScore || maxScore <= 0) return PASS;
  const ratio = score / maxScore;
  if (ratio < 0.4) return FAIL;
  if (ratio < 0.8) return PASS;
  return STRONG;
}
