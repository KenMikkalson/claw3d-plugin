/**
 * Claw3D — plugin worker.
 *
 * The worker is a thin data proxy: it exposes three `getData` keys backing the
 * UI's `usePluginData` hooks, and it streams host domain events onto a single
 * "activity" channel so the 3D scene can react in real time.
 *
 * All heavy rendering stays in the browser bundle. This process should be
 * essentially CPU-idle.
 */

import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";
import type { PluginContext } from "@paperclipai/plugin-sdk";
import { DATA_KEYS, DEFAULT_CONFIG, STREAM_CHANNELS } from "./constants.js";

// Shape returned to the UI — intentionally narrow, no raw host records.
interface AgentListItem {
  id: string;
  name: string;
  status: string;
  lastActivityAt: string | null;
}

interface ActivityItem {
  id: string;
  actorType: string | null;
  actorId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  occurredAt: string;
  summary?: string;
}

interface OfficeLayout {
  deskIds: string[];
  /** Operator overrides from config (agentId → deskId). */
  deskMap: Record<string, { deskId: string }>;
}

// The set of core host events we forward onto the "activity" stream. Keep this
// list tight — the widget only animates a handful of event classes.
const STREAMED_EVENTS = [
  "issue.created",
  "issue.updated",
  "agent.status_changed",
  "agent.run.started",
  "agent.run.finished",
] as const;

// The current scene version publishes this desk list. Keep it in sync with
// `src/ui/scene/`. Treated as static config for now.
const SCENE_DESK_IDS = [
  "desk-odin",
  "desk-fenrir",
  "desk-huginn",
  "desk-tyr",
  "desk-brokkr",
  "desk-sindri",
  "desk-spare-1",
  "desk-spare-2",
];

async function readCompanyId(ctx: PluginContext): Promise<string | null> {
  const companies = await ctx.companies.list({ limit: 1 });
  return companies[0]?.id ?? null;
}

const plugin = definePlugin({
  async setup(ctx) {
    ctx.logger.info("claw3d plugin worker starting", { version: ctx.manifest.version });

    // ── Data handlers ────────────────────────────────────────────────────────
    ctx.data.register(DATA_KEYS.agents, async (params) => {
      const companyId =
        (typeof params.companyId === "string" && params.companyId) ||
        (await readCompanyId(ctx));
      if (!companyId) return { agents: [] as AgentListItem[] };

      const agents = await ctx.agents.list({ companyId, limit: 100 });
      const items: AgentListItem[] = agents.map((a) => ({
        id: a.id,
        name: a.name,
        // Agent.status is a string union on the host; widen for transport.
        status: String((a as unknown as { status?: string }).status ?? "unknown"),
        lastActivityAt:
          (a as unknown as { lastActivityAt?: string | null }).lastActivityAt ?? null,
      }));
      return { agents: items };
    });

    ctx.data.register(DATA_KEYS.recentActivity, async (params) => {
      // We don't have a direct "activity log read" API on the typed client yet;
      // instead we summarise the most recent issues as a proxy for "something
      // happened". When ctx.issues.list is unavailable or throws we just return
      // an empty list — the UI handles that gracefully.
      const companyId =
        (typeof params.companyId === "string" && params.companyId) ||
        (await readCompanyId(ctx));
      if (!companyId) return { items: [] as ActivityItem[] };

      try {
        const issues = await ctx.issues.list({ companyId, limit: 25 });
        const items: ActivityItem[] = issues.map((i) => ({
          id: i.id,
          actorType: "agent",
          actorId:
            (i as unknown as { assigneeAgentId?: string | null }).assigneeAgentId ?? null,
          action: `issue.${String((i as unknown as { status?: string }).status ?? "touched")}`,
          entityType: "issue",
          entityId: i.id,
          occurredAt:
            (i as unknown as { updatedAt?: string }).updatedAt ??
            new Date().toISOString(),
          summary: i.title,
        }));
        return { items };
      } catch (err) {
        ctx.logger.warn("recent-activity: issues.list failed", { error: String(err) });
        return { items: [] as ActivityItem[] };
      }
    });

    ctx.data.register(DATA_KEYS.config, async () => {
      // Expose operator config to the UI. Merged on top of DEFAULT_CONFIG so
      // that brand-new installs return a complete shape instead of {}. Writes
      // go through the host's config endpoint directly from the SettingsPage —
      // ctx.config is read-only from the worker's side.
      const raw = (await ctx.config.get()) ?? {};
      return { ...DEFAULT_CONFIG, ...(raw as Record<string, unknown>) };
    });

    ctx.data.register(DATA_KEYS.officeLayout, async () => {
      const config = await ctx.config.get();
      const raw = config?.agentDeskMap;
      const deskMap =
        raw && typeof raw === "object" ? (raw as OfficeLayout["deskMap"]) : {};
      return {
        deskIds: SCENE_DESK_IDS,
        deskMap,
      } satisfies OfficeLayout;
    });

    // ── Stream host events onto the activity channel ─────────────────────────
    const companyId = await readCompanyId(ctx);
    if (companyId) {
      ctx.streams.open(STREAM_CHANNELS.activity, companyId);
      for (const eventType of STREAMED_EVENTS) {
        ctx.events.on(eventType, async (event) => {
          ctx.streams.emit(STREAM_CHANNELS.activity, {
            eventId: event.eventId,
            eventType: event.eventType,
            actorId: event.actorId ?? null,
            actorType: event.actorType ?? null,
            entityId: event.entityId ?? null,
            entityType: event.entityType ?? null,
            occurredAt: event.occurredAt,
          });
        });
      }
      ctx.logger.info("claw3d event stream attached", {
        events: STREAMED_EVENTS,
      });
    } else {
      ctx.logger.warn("claw3d: no company visible — event stream not attached");
    }
  },

  async onHealth() {
    return { status: "ok", message: "claw3d ready" };
  },
});

export default plugin;
runWorker(plugin, import.meta.url);
