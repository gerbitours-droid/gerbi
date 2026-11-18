// The trip builder's funnel (owner 18.11.2026): where people drop out of "plan → prices → conversation → send to agent".
// Counts per day only – no ids, no IP, no text (same rules as search-stats). One KV document per day, kept 120 days.
export const FUNNEL_STEPS = ['view', 'submit', 'plan_shown', 'abandon_thinking', 'followup', 'chip', 'option_continue', 'poll_answer', 'poll_apply',
  'notify_request', 'resume_shown', 'resume_used', 'exit_prompt', 'exit_save', 'exit_send', 'lead_open', 'lead_sent', 'save', 'share', 'print'];
// The main path, in order, for the drop-off view.
export const FUNNEL_PATH = ['view', 'submit', 'plan_shown', 'followup', 'lead_open', 'lead_sent'];
const TTL = 120 * 86400;

export function createFunnelStats(store, { now = () => Date.now() } = {}) {
  let queue = Promise.resolve();
  const dayOf = (t) => new Date(t).toISOString().slice(0, 10);
  function record(step) {
    if (!FUNNEL_STEPS.includes(step) || !store) return queue;
    const day = dayOf(now());
    queue = queue.then(async () => {
      const doc = (await store.get(`funnel:${day}`).catch(() => null)) || { day, steps: {} };
      doc.steps[step] = (doc.steps[step] || 0) + 1;
      await store.set(`funnel:${day}`, doc, TTL);
    }).catch(() => {});
    return queue;
  }
  async function summary(days = 7) {
    const steps = Object.fromEntries(FUNNEL_STEPS.map((s) => [s, 0]));
    for (let i = 0; i < Math.min(days, 60); i++) {
      const doc = await store?.get(`funnel:${dayOf(now() - i * 86400000)}`).catch(() => null);
      for (const [k, n] of Object.entries(doc?.steps || {})) if (k in steps) steps[k] += n;
    }
    // Each step of the main path as a share of the one before it (where people leave).
    const path = FUNNEL_PATH.map((s, i) => ({ step: s, count: steps[s], ofPrevious: i && steps[FUNNEL_PATH[i - 1]] ? Math.round((100 * steps[s]) / steps[FUNNEL_PATH[i - 1]]) : null }));
    return { days, steps, path };
  }
  return { record, summary, flush: () => queue };
}
