import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShieldCheck,
  TriangleAlert,
  OctagonX,
  Wrench,
  X,
  Calendar,
  Clock,
  Activity,
  Thermometer,
  Package,
  CheckCircle2,
  AlertTriangle,
  CircleAlert,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";

/* =========================================================
   DESIGN
========================================================= */

const C = {
  bg: "#0A0D12",
  panel: "#12161D",
  panelAlt: "#161B23",
  border: "#242C38",
  borderSoft: "#1B212B",

  text: "#E7EBEF",
  textMute: "#8792A0",
  textFaint: "#5A6473",

  ready: "#7DA872",
  readyBg: "rgba(125,168,114,0.12)",

  watch: "#D9A441",
  watchBg: "rgba(217,164,65,0.12)",

  critical: "#C1493D",
  criticalBg: "rgba(193,73,61,0.14)",

  predicted: "#5C8FBE",
  predictedBg: "rgba(92,143,190,0.12)",
};

const FONT_SANS =
  "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";

const FONT_MONO =
  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

/* =========================================================
   SMALL SEEDED RANDOM FUNCTION
========================================================= */

function rand(seed) {
  let x = seed;

  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

/* =========================================================
   DEMO ASSETS
========================================================= */

function genAssets() {
  const r = rand(42);

  const names = [
    ["AH-64D", "Aircraft", "Apache"],
    ["UH-60M", "Aircraft", "Black Hawk"],
    ["CH-47F", "Aircraft", "Chinook"],
    ["F-16CM", "Aircraft", "Fighting Falcon"],
    ["C-130J", "Aircraft", "Super Hercules"],
    ["MQ-9A", "Aircraft", "Reaper"],

    ["M1A2 SEPv3", "Ground Vehicle", "Abrams MBT"],
    ["M2A3", "Ground Vehicle", "Bradley IFV"],
    ["JLTV-A2", "Ground Vehicle", "Light Tactical"],
    ["M977 HEMTT", "Ground Vehicle", "Heavy Tactical"],
    ["M109A7", "Ground Vehicle", "Paladin SPH"],
    ["LAV-25", "Ground Vehicle", "Light Armored"],

    ["MEP-806B", "Equipment", "Tactical Generator"],
    ["RQ-7B GCS", "Equipment", "Ground Control Station"],
    ["AN/TPQ-53", "Equipment", "Radar System"],
    ["PLS Trailer", "Equipment", "Load System"],
  ];

  const components = [
    "Hydraulic pump seal",
    "Main rotor gearbox bearing",
    "Turbine blade coating",
    "Torsion bar suspension",
    "Track tension assembly",
    "Fuel injector array",
    "APU starter generator",
    "Brake actuator",
    "Coolant pump",
    "Alternator bearing",
    "Transmission clutch pack",
    "Radar cooling fan",
    "Battery management unit",
  ];

  const bases = [
    "Fort Liberty",
    "Ramstein AB",
    "Camp Humphreys",
    "Nellis AFB",
  ];

  const items = [];

  for (let i = 0; i < 28; i++) {
    const [tail, type, model] = names[i % names.length];

    const roll = r();

    let status;
    let window;
    let confidence;

    if (roll < 0.18) {
      status = "Critical";
      window = Math.round(2 + r() * 6);
      confidence = Math.round(82 + r() * 15);
    } else if (roll < 0.46) {
      status = "Watch";
      window = Math.round(10 + r() * 18);
      confidence = Math.round(60 + r() * 25);
    } else {
      status = "Ready";
      window = Math.round(35 + r() * 60);
      confidence = Math.round(40 + r() * 30);
    }

    const component =
      components[Math.floor(r() * components.length)];

    const lastServiceDays = Math.round(r() * 120) + 5;

    const d = new Date(
      2026,
      8,
      13 - lastServiceDays
    );

    items.push({
      id: `${tail}-${String(100 + i).padStart(3, "0")}`,
      unitNumber: (i % 100) + 1,
      aiCycle: 112,

      tail,
      type,
      model,
      status,

      component:
        status === "Ready" ? "—" : component,

      window,
      confidence,

      lastService: d
        .toISOString()
        .slice(0, 10),

      base: bases[i % bases.length],

      hours: Math.round(
        800 + r() * 4200
      ),

      sensors: {
        vibration: Array.from(
          { length: 12 },
          (_, k) => ({
            t: `W${k + 1}`,
            value: Math.round(
              (
                status === "Critical"
                  ? 40 + k * 4
                  : status === "Watch"
                  ? 20 + k * 1.6
                  : 12 + r() * 4
              ) +
                r() * 5
            ),
          })
        ),

        temp: Array.from(
          { length: 12 },
          (_, k) => ({
            t: `W${k + 1}`,
            value: Math.round(
              (
                status === "Critical"
                  ? 180 + k * 3
                  : status === "Watch"
                  ? 150 + k * 1.2
                  : 140 + r() * 6
              ) +
                r() * 4
            ),
          })
        ),
      },

      history: [
        {
          date: "2026-06-02",
          action: "Scheduled 90-day inspection",
          tech: "SSG Ruiz",
        },
        {
          date: "2026-04-14",
          action:
            "Component replacement — hydraulic line",
          tech: "SGT Okoye",
        },
        {
          date: "2026-02-28",
          action: "Routine calibration check",
          tech: "SPC Vance",
        },
      ],

      explanation:
        status === "Critical"
          ? `${component} is showing sensor drift consistent with early-stage wear. Similar signatures across the fleet have historically preceded failure within ${window} days.`
          : status === "Watch"
          ? `${component} readings trending outside nominal band. Not yet urgent, but worth scheduling inspection ahead of the next mission window.`
          : "All monitored components within nominal operating range. No action needed.",

      parts:
        status !== "Ready"
          ? [
              {
                part:
                  component.split(" ")[0] +
                  " kit",

                leadTime: `${
                  3 + Math.round(r() * 10)
                } days`,

                stock:
                  r() > 0.5
                    ? "In stock"
                    : "Order required",
              },
            ]
          : [],
    });
  }

  return items;
}

const ASSETS = genAssets();

/* =========================================================
   STATUS META
========================================================= */

const STATUS_META = {
  Ready: {
    color: C.ready,
    bg: C.readyBg,
    icon: ShieldCheck,
    label: "Ready",
  },

  Watch: {
    color: C.watch,
    bg: C.watchBg,
    icon: TriangleAlert,
    label: "Watch",
  },

  Critical: {
    color: C.critical,
    bg: C.criticalBg,
    icon: OctagonX,
    label: "Not Ready",
  },
};

/* =========================================================
   CLASS SUMMARY
========================================================= */

const CLASS_SUMMARY = [
  "Aircraft",
  "Ground Vehicle",
  "Equipment",
].map((type) => {
  const list = ASSETS.filter(
    (a) => a.type === type
  );

  const readyPct = Math.round(
    (
      list.filter(
        (a) => a.status === "Ready"
      ).length /
      list.length
    ) * 100
  );

  const predictedPct = Math.max(
    readyPct -
      Math.round(6 + Math.random() * 10),
    20
  );

  return {
    type,
    current: readyPct,
    predicted: predictedPct,
  };
});

/* =========================================================
   MAINTENANCE QUEUE
========================================================= */

const MAINTENANCE_QUEUE = ASSETS
  .filter((a) => a.status !== "Ready")
  .sort((a, b) => a.window - b.window)
  .slice(0, 8)
  .map((a, i) => ({
    rank: i + 1,
    id: a.id,
    tail: a.tail,
    component: a.component,
    window: a.window,
    status: a.status,
    base: a.base,

    reason:
      a.status === "Critical"
        ? "High failure risk before next mission window"
        : "Preventive window to avoid future readiness gap",
  }));

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {
  const meta = STATUS_META[status];

  if (!meta) return null;

  const Icon = meta.icon;

  return (
    <span
      style={{
        color: meta.color,
        background: meta.bg,
      }}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[11px]"
    >
      <Icon size={12} />

      {meta.label}
    </span>
  );
}

/* =========================================================
   SECTION LABEL
========================================================= */

function SectionLabel({ children }) {
  return (
    <div
      style={{
        color: C.textFaint,
      }}
      className="text-[11px] uppercase tracking-wide"
    >
      {children}
    </div>
  );
}

/* =========================================================
   ASSET DRAWER
========================================================= */

function AssetDrawer({
  asset,
  onClose,
  onScheduleMaintenance,
  aiPrediction,
  aiLoading,
  aiError,
}) {
  if (!asset) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      style={{
        background: "rgba(0,0,0,0.65)",
      }}
    >
      <div
        className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto"
        style={{
          background: C.panel,
          borderLeft: `1px solid ${C.border}`,
        }}
      >
        {/* DRAWER HEADER */}

        <div
          style={{
            borderColor: C.border,
            background: C.bg,
          }}
          className="sticky top-0 z-10 border-b px-5 py-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <div
                style={{
                  color: C.textFaint,
                }}
                className="text-[11px] uppercase tracking-wide"
              >
                Asset details
              </div>

              <div
                style={{
                  color: C.text,
                }}
                className="text-lg font-semibold mt-1"
              >
                {asset.tail}
              </div>

              <div
                style={{
                  color: C.textMute,
                }}
                className="text-xs mt-1"
              >
                {asset.id} • {asset.model}
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                color: C.textMute,
              }}
              className="p-1.5 hover:opacity-70"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-3">
            <StatusBadge status={asset.status} />
          </div>
        </div>

        {/* DRAWER BODY */}

        <div className="p-5 flex flex-col gap-6">

          {/* WHY FLAGGED */}

          <div>
            <SectionLabel>
              Why this asset is flagged
            </SectionLabel>

            <div
              style={{
                color: C.text,
              }}
              className="mt-2 text-sm leading-6"
            >
              {asset.explanation}
            </div>
          </div>

          {/* PREDICTION */}

          <div className="grid grid-cols-3 gap-3">

            <div
              style={{
                background: C.panelAlt,
                borderColor: C.border,
              }}
              className="border rounded-sm p-3"
            >
              <div
                style={{
                  color: C.textFaint,
                }}
                className="text-[10px] uppercase"
              >
                Failure window
              </div>

              <div
                style={{
                  color:
                    asset.status === "Critical"
                      ? C.critical
                      : asset.status === "Watch"
                      ? C.watch
                      : C.ready,
                  fontFamily: FONT_MONO,
                }}
                className="text-lg font-semibold mt-1"
              >
                {asset.window}d
              </div>
            </div>

            <div
              style={{
                background: C.panelAlt,
                borderColor: C.border,
              }}
              className="border rounded-sm p-3"
            >
              <div
                style={{
                  color: C.textFaint,
                }}
                className="text-[10px] uppercase"
              >
                Confidence
              </div>

              <div
                style={{
                  color: C.text,
                  fontFamily: FONT_MONO,
                }}
                className="text-lg font-semibold mt-1"
              >
                {asset.confidence}%
              </div>
            </div>

            <div
              style={{
                background: C.panelAlt,
                borderColor: C.border,
              }}
              className="border rounded-sm p-3"
            >
              <div
                style={{
                  color: C.textFaint,
                }}
                className="text-[10px] uppercase"
              >
                Operating hours
              </div>

              <div
                style={{
                  color: C.text,
                  fontFamily: FONT_MONO,
                }}
                className="text-lg font-semibold mt-1"
              >
                {asset.hours.toLocaleString()}
              </div>
            </div>
          </div>

          {/* REAL AI PREDICTION */}

          <div
            style={{
              background: C.panelAlt,
              borderColor: C.border,
            }}
            className="rounded-sm border p-3"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} style={{ color: C.predicted }} />
                <span
                  style={{ color: C.text }}
                  className="text-sm font-medium"
                >
                  AI Prediction
                </span>
              </div>

              <span
                style={{
                  color: C.predicted,
                  background: C.predictedBg,
                }}
                className="px-2 py-1 rounded-sm text-[10px] uppercase"
              >
                Live model
              </span>
            </div>

            {aiLoading && (
              <div
                style={{ color: C.textMute }}
                className="text-xs"
              >
                Running AI prediction...
              </div>
            )}

            {aiError && !aiLoading && (
              <div
                style={{ color: C.critical }}
                className="text-xs leading-5"
              >
                {aiError}
              </div>
            )}

            {aiPrediction && !aiLoading && !aiError && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div style={{ color: C.textFaint }} className="text-[10px] uppercase">
                    Predicted RUL
                  </div>
                  <div
                    style={{ color: C.text, fontFamily: FONT_MONO }}
                    className="text-base font-semibold mt-1"
                  >
                    {Number(aiPrediction.predicted_rul).toFixed(1)} cycles
                  </div>
                </div>

                <div>
                  <div style={{ color: C.textFaint }} className="text-[10px] uppercase">
                    AI Status
                  </div>
                  <div
                    style={{
                      color:
                        aiPrediction.final_status === "READY"
                          ? C.ready
                          : aiPrediction.final_status === "WATCH"
                          ? C.watch
                          : C.critical,
                      fontFamily: FONT_MONO,
                    }}
                    className="text-base font-semibold mt-1"
                  >
                    {aiPrediction.final_status}
                  </div>
                </div>

                <div>
                  <div style={{ color: C.textFaint }} className="text-[10px] uppercase">
                    Confidence
                  </div>
                  <div
                    style={{ color: C.text, fontFamily: FONT_MONO }}
                    className="text-base font-semibold mt-1"
                  >
                    {Number(aiPrediction.confidence).toFixed(0)}%
                  </div>
                </div>

                <div>
                  <div style={{ color: C.textFaint }} className="text-[10px] uppercase">
                    Risk
                  </div>
                  <div
                    style={{
                      color:
                        aiPrediction.risk === "Low"
                          ? C.ready
                          : aiPrediction.risk === "Medium"
                          ? C.watch
                          : C.critical,
                    }}
                    className="text-sm font-medium mt-1"
                  >
                    {aiPrediction.risk}
                  </div>
                </div>

                <div className="col-span-2 border-t pt-2" style={{ borderColor: C.borderSoft }}>
                  <div style={{ color: C.textFaint }} className="text-[10px] uppercase mb-1">
                    Recommended action
                  </div>
                  <div style={{ color: C.text }} className="text-xs leading-5">
                    {aiPrediction.action}
                  </div>
                </div>

                {aiPrediction.safety_override && (
                  <div
                    className="col-span-2 rounded-sm border p-2 text-[11px]"
                    style={{
                      color: C.watch,
                      background: C.watchBg,
                      borderColor: C.watch + "55",
                    }}
                  >
                    Safety override applied: low-confidence READY prediction was moved to WATCH.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* VIBRATION */}

          <div>
            <div className="flex items-center gap-2">
              <Activity
                size={14}
                style={{ color: C.predicted }}
              />

              <SectionLabel>
                Vibration trend
              </SectionLabel>
            </div>

            <div className="h-48 mt-3">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={asset.sensors.vibration}
                >
                  <CartesianGrid
                    stroke={C.borderSoft}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="t"
                    tick={{
                      fontSize: 10,
                      fill: C.textFaint,
                    }}
                    axisLine={{
                      stroke: C.border,
                    }}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{
                      fontSize: 10,
                      fill: C.textFaint,
                    }}
                    axisLine={false}
                    tickLine={false}
                    width={26}
                  />

                  <Tooltip
                    contentStyle={{
                      background: C.panelAlt,
                      border: `1px solid ${C.border}`,
                      fontSize: 12,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={C.predicted}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TEMPERATURE */}

          <div>
            <div className="flex items-center gap-2">
              <Thermometer
                size={14}
                style={{ color: C.watch }}
              />

              <SectionLabel>
                Temperature trend
              </SectionLabel>
            </div>

            <div className="h-48 mt-3">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={asset.sensors.temp}
                >
                  <CartesianGrid
                    stroke={C.borderSoft}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="t"
                    tick={{
                      fontSize: 10,
                      fill: C.textFaint,
                    }}
                    axisLine={{
                      stroke: C.border,
                    }}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{
                      fontSize: 10,
                      fill: C.textFaint,
                    }}
                    axisLine={false}
                    tickLine={false}
                    width={26}
                  />

                  <Tooltip
                    contentStyle={{
                      background: C.panelAlt,
                      border: `1px solid ${C.border}`,
                      fontSize: 12,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={C.watch}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PARTS */}

          {asset.parts.length > 0 && (
            <div>
              <SectionLabel>
                Recommended parts / actions
              </SectionLabel>

              <div className="mt-2 flex flex-col gap-2">
                {asset.parts.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      borderColor: C.borderSoft,
                    }}
                    className="flex items-center justify-between border rounded-sm px-3 py-2"
                  >
                    <span
                      style={{
                        color: C.text,
                      }}
                      className="text-[13px]"
                    >
                      {p.part}
                    </span>

                    <div className="flex items-center gap-3">
                      <span
                        style={{
                          color:
                            p.stock === "In stock"
                              ? C.ready
                              : C.watch,
                        }}
                        className="text-[11px]"
                      >
                        {p.stock}
                      </span>

                      <span
                        style={{
                          color: C.textFaint,
                          fontFamily: FONT_MONO,
                        }}
                        className="text-[11px]"
                      >
                        {p.leadTime}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SERVICE HISTORY */}

          <div>
            <SectionLabel>
              Service history
            </SectionLabel>

            <div className="mt-2 flex flex-col">
              {asset.history.map((h, i) => (
                <div
                  key={i}
                  style={{
                    borderColor: C.borderSoft,
                  }}
                  className="flex items-start gap-3 py-2 border-b last:border-b-0"
                >
                  <span
                    style={{
                      fontFamily: FONT_MONO,
                      color: C.textFaint,
                    }}
                    className="text-[11px] w-20 shrink-0 pt-0.5"
                  >
                    {h.date}
                  </span>

                  <div>
                    <div
                      style={{
                        color: C.text,
                      }}
                      className="text-[13px]"
                    >
                      {h.action}
                    </div>

                    <div
                      style={{
                        color: C.textFaint,
                      }}
                      className="text-[11px]"
                    >
                      {h.tech}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FOOTER INFO */}

          <div className="flex items-center gap-2">
            <span
              style={{
                color: C.textMute,
              }}
              className="text-[11px]"
            >
              Last service {asset.lastService}
            </span>

            <span
              style={{
                color: C.borderSoft,
              }}
            >
              •
            </span>

            <span
              style={{
                color: C.textMute,
              }}
              className="text-[11px]"
            >
              {asset.hours.toLocaleString()} operating hours
            </span>
          </div>

          {/* SCHEDULE BUTTON */}

          <button
            onClick={() =>
              onScheduleMaintenance(asset)
            }
            style={{
              background: C.text,
              color: C.bg,
            }}
            className="w-full py-2.5 rounded-sm text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90"
          >
            <Wrench size={14} />

            Schedule maintenance
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAINTENANCE MODAL
========================================================= */

function MaintenanceModal({
  asset,
  type,
  setType,
  priority,
  setPriority,
  date,
  setDate,
  notes,
  setNotes,
  onCancel,
  onConfirm,
}) {
  if (!asset) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{
        background: "rgba(0,0,0,0.72)",
      }}
    >
      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.border}`,
        }}
        className="w-full max-w-lg rounded-sm shadow-2xl"
      >
        {/* HEADER */}

        <div
          style={{
            borderColor: C.border,
          }}
          className="flex items-center justify-between px-5 py-4 border-b"
        >
          <div>
            <div
              style={{
                color: C.textFaint,
              }}
              className="text-[11px] uppercase tracking-wide"
            >
              Maintenance scheduling
            </div>

            <div
              style={{
                color: C.text,
              }}
              className="text-base font-semibold mt-1"
            >
              Schedule maintenance
            </div>
          </div>

          <button
            onClick={onCancel}
            style={{
              color: C.textMute,
            }}
            className="p-1 hover:opacity-70"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}

        <div className="p-5 flex flex-col gap-4">

          {/* ASSET */}

          <div
            style={{
              background: C.panelAlt,
              borderColor: C.border,
            }}
            className="border rounded-sm p-3"
          >
            <div
              style={{
                color: C.textFaint,
              }}
              className="text-[10px] uppercase"
            >
              Asset
            </div>

            <div
              style={{
                color: C.text,
              }}
              className="text-sm font-semibold mt-1"
            >
              {asset.tail}
            </div>

            <div
              style={{
                color: C.textMute,
              }}
              className="text-[11px] mt-1"
            >
              {asset.id} • {asset.model}
            </div>
          </div>

          {/* MAINTENANCE TYPE */}

          <div>
            <label
              style={{
                color: C.textMute,
              }}
              className="text-[11px] block mb-1.5"
            >
              Maintenance Type
            </label>

            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value)
              }
              style={{
                background: C.panelAlt,
                borderColor: C.border,
                color: C.text,
              }}
              className="w-full border rounded-sm px-3 py-2 text-sm outline-none"
            >
              <option>
                Preventive Inspection
              </option>

              <option>
                Component Replacement
              </option>

              <option>
                Sensor Inspection
              </option>

              <option>
                Full Maintenance
              </option>
            </select>
          </div>

          {/* COMPONENT */}

          <div>
            <label
              style={{
                color: C.textMute,
              }}
              className="text-[11px] block mb-1.5"
            >
              Component / Action
            </label>

            <div
              style={{
                background: C.panelAlt,
                borderColor: C.border,
                color: C.text,
              }}
              className="w-full border rounded-sm px-3 py-2 text-sm"
            >
              {asset.component === "—"
                ? "General inspection"
                : asset.component}
            </div>
          </div>

          {/* PRIORITY */}

          <div>
            <label
              style={{
                color: C.textMute,
              }}
              className="text-[11px] block mb-1.5"
            >
              Priority
            </label>

            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value)
              }
              style={{
                background: C.panelAlt,
                borderColor: C.border,
                color: C.text,
              }}
              className="w-full border rounded-sm px-3 py-2 text-sm outline-none"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>

          {/* DATE */}

          <div>
            <label
              style={{
                color: C.textMute,
              }}
              className="text-[11px] block mb-1.5"
            >
              Maintenance Date
            </label>

            <div className="relative">
              <Calendar
                size={15}
                style={{
                  color: C.textFaint,
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2"
              />

              <input
                type="date"
                value={date}
                onChange={(e) =>
                  setDate(e.target.value)
                }
                style={{
                  background: C.panelAlt,
                  borderColor: C.border,
                  color: C.text,
                }}
                className="w-full border rounded-sm pl-9 pr-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          {/* NOTES */}

          <div>
            <label
              style={{
                color: C.textMute,
              }}
              className="text-[11px] block mb-1.5"
            >
              Notes
            </label>

            <textarea
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              placeholder="Add maintenance instructions or notes..."
              rows={4}
              style={{
                background: C.panelAlt,
                borderColor: C.border,
                color: C.text,
              }}
              className="w-full border rounded-sm px-3 py-2 text-sm outline-none resize-none"
            />
          </div>
        </div>

        {/* FOOTER */}

        <div
          style={{
            borderColor: C.border,
          }}
          className="px-5 py-4 border-t flex items-center justify-end gap-2"
        >
          <button
            onClick={onCancel}
            style={{
              color: C.textMute,
              borderColor: C.border,
            }}
            className="px-4 py-2 border rounded-sm text-sm hover:opacity-80"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            style={{
              background: C.text,
              color: C.bg,
            }}
            className="px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2 hover:opacity-90"
          >
            <CheckCircle2 size={14} />

            Confirm Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN APP
========================================================= */

export default function ReadinessCopilot() {

  const [tab, setTab] =
    useState("overview");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [typeFilter, setTypeFilter] =
    useState("All");

  const [query, setQuery] =
    useState("");

  const [chartMode, setChartMode] =
    useState("current");

  const [selected, setSelected] =
    useState(null);

  /* =======================================================
     MAINTENANCE STATE
  ======================================================= */

  const [maintenanceMessage, setMaintenanceMessage] =
    useState("");

  const [maintenanceAsset, setMaintenanceAsset] =
    useState(null);

  const [maintenanceType, setMaintenanceType] =
    useState("Preventive Inspection");

  const [maintenancePriority, setMaintenancePriority] =
    useState("Medium");

  const [maintenanceDate, setMaintenanceDate] =
    useState("");

  const [maintenanceNotes, setMaintenanceNotes] =
    useState("");

  const [scheduledMaintenance, setScheduledMaintenance] =
    useState([]);

  /* =======================================================
     AI PREDICTION STATE
  ======================================================= */

  const [aiPrediction, setAiPrediction] =
    useState(null);

  const [aiLoading, setAiLoading] =
    useState(false);

  const [aiError, setAiError] =
    useState("");

  useEffect(() => {
  loadMaintenance();
}, []);

const loadMaintenance = async () => {
  try {
    const response = await fetch("/api/maintenance");

    if (!response.ok) {
      throw new Error("Failed to load maintenance");
    }

    const data = await response.json();
    setScheduledMaintenance(data);
  } catch (error) {
    console.error("Database loading error:", error);
  }
};

  /* =======================================================
     AI PREDICTION
  ======================================================= */

  useEffect(() => {
    if (!selected) {
      setAiPrediction(null);
      setAiError("");
      setAiLoading(false);
      return;
    }

    const fetchAIPrediction = async () => {
      setAiLoading(true);
      setAiError("");
      setAiPrediction(null);

      try {
        const unitNumber = selected.unitNumber;
        const cycle = selected.aiCycle || 112;

        const response = await fetch(
          `http://localhost:8000/predict?unit=${unitNumber}&cycle=${cycle}`
        );

        if (!response.ok) {
          throw new Error("AI API request failed");
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "AI prediction failed");
        }

        setAiPrediction(data);
      } catch (error) {
        console.error("AI prediction error:", error);
        setAiError(
          "Unable to load AI prediction. Make sure the Python AI server is running on port 8000."
        );
      } finally {
        setAiLoading(false);
      }
    };

    fetchAIPrediction();
  }, [selected]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filtered = useMemo(() => {

    const normalizedQuery =
      query
        .toLowerCase()
        .trim()
        .replace(/[\s-]/g, "");

    return ASSETS
      .filter((a) => {

        if (
          statusFilter !== "All" &&
          a.status !== statusFilter
        ) {
          return false;
        }

        if (
          typeFilter !== "All" &&
          a.type !== typeFilter
        ) {
          return false;
        }

        if (normalizedQuery) {

          const searchableText =
            `${a.tail} ${a.id} ${a.model}`
              .toLowerCase()
              .replace(/[\s-]/g, "");

          if (
            !searchableText.includes(
              normalizedQuery
            )
          ) {
            return false;
          }
        }

        return true;
      })

      .sort((a, b) => {

        const order = {
          Critical: 0,
          Watch: 1,
          Ready: 2,
        };

        return (
          order[a.status] -
            order[b.status] ||
          a.window - b.window
        );
      });

  }, [
    statusFilter,
    typeFilter,
    query,
  ]);

  /* =======================================================
     KPI DATA
  ======================================================= */

  const readyCount =
    ASSETS.filter(
      (a) => a.status === "Ready"
    ).length;

  const criticalCount =
    ASSETS.filter(
      (a) => a.status === "Critical"
    ).length;

  const watchCount =
    ASSETS.filter(
      (a) => a.status === "Watch"
    ).length;

  const overallPct =
    Math.round(
      (readyCount / ASSETS.length) * 100
    );

  const backlogHrs =
    ASSETS
      .filter(
        (a) => a.status !== "Ready"
      )
      .reduce(
        (s, a) =>
          s + Math.round(a.hours * 0.01),
        0
      );

  const chartData =
    CLASS_SUMMARY.map((c) => ({
      type: c.type,
      value:
        chartMode === "current"
          ? c.current
          : c.predicted,
    }));

  /* =======================================================
     OPEN MAINTENANCE
  ======================================================= */

  const handleScheduleMaintenance =
    (asset) => {

      setMaintenanceAsset(asset);

      setSelected(null);

      setMaintenanceType(
        "Preventive Inspection"
      );

      setMaintenancePriority(
        asset.status === "Critical"
          ? "High"
          : "Medium"
      );

      setMaintenanceDate("");

      setMaintenanceNotes("");
    };

  /* =======================================================
     CONFIRM MAINTENANCE
  ======================================================= */

  const confirmMaintenance = async () => {
  if (!maintenanceDate) {
    alert("Please select a maintenance date.");
    return;
  }

  if (!maintenanceAsset) {
    return;
  }

  const maintenanceData = {
    assetId: maintenanceAsset.id,
    tail: maintenanceAsset.tail,
    model: maintenanceAsset.model,
    component: maintenanceAsset.component,
    type: maintenanceType,
    priority: maintenancePriority,
    date: maintenanceDate,
    notes: maintenanceNotes,
  };

  try {
    const response = await fetch("/api/maintenance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(maintenanceData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to schedule maintenance");
    }

    // Add newly saved database record to the UI
    setScheduledMaintenance((prev) => [
      data,
      ...prev,
    ]);

    setMaintenanceMessage(
      `Maintenance scheduled for ${maintenanceAsset.tail} (${maintenanceAsset.id})`
    );

    // Close modal
    setMaintenanceAsset(null);
    setMaintenanceNotes("");

    setTimeout(() => {
      setMaintenanceMessage("");
    }, 4000);

  } catch (error) {
    console.error("Maintenance save error:", error);

    alert(
      "Could not save maintenance. Please make sure the backend server is running."
    );
  }
};

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      style={{
        background: C.bg,
        fontFamily: FONT_SANS,
        minHeight: "100%",
      }}
      className="w-full min-h-screen"
    >

      {/* =================================================
          TOP BAR
      ================================================= */}

      <div
        style={{
          borderColor: C.borderSoft,
          background: C.bg,
        }}
        className="border-b sticky top-0 z-30"
      >
        <div className="flex items-center gap-4 px-5 py-3 flex-wrap">

          {/* LOGO */}

          <div className="flex items-center gap-2">

            <div
              style={{
                background: C.ready,
              }}
              className="w-2 h-2 rounded-full"
            />

            <span
              style={{
                color: C.text,
              }}
              className="font-semibold text-[15px] tracking-tight"
            >
              Readiness Copilot
            </span>

          </div>

          {/* SEARCH */}

          <div className="flex-1 min-w-[160px] max-w-sm relative">

            <Search
              size={13}
              style={{
                color: C.textFaint,
              }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2"
            />

            <input
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
              placeholder="Search tail number, asset ID..."
              style={{
                background: C.panel,
                borderColor: C.border,
                color: C.text,
              }}
              className="w-full border rounded-sm pl-8 pr-3 py-1.5 text-xs outline-none"
            />
          </div>

        </div>
      </div>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="p-5 max-w-[1600px] mx-auto">

        {/* PAGE TITLE */}

        <div className="mb-5">

          <div
            style={{
              color: C.text,
            }}
            className="text-xl font-semibold"
          >
            Mission Readiness
          </div>

          <div
            style={{
              color: C.textMute,
            }}
            className="text-xs mt-1"
          >
            Predictive maintenance intelligence
            across your fleet
          </div>

        </div>

        {/* =================================================
            KPI CARDS
        ================================================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">

          {/* READINESS */}

          <div
            style={{
              background: C.panel,
              borderColor: C.border,
            }}
            className="border rounded-sm p-4"
          >
            <div
              style={{
                color: C.textFaint,
              }}
              className="text-[10px] uppercase tracking-wide"
            >
              Mission Readiness
            </div>

            <div
              style={{
                color: C.text,
              }}
              className="text-3xl font-semibold mt-2"
            >
              {overallPct}%
            </div>

            <div
              style={{
                color: C.ready,
              }}
              className="text-[11px] mt-1"
            >
              Fleet currently ready
            </div>
          </div>

          {/* READY */}

          <div
            style={{
              background: C.panel,
              borderColor: C.border,
            }}
            className="border rounded-sm p-4"
          >
            <div
              style={{
                color: C.textFaint,
              }}
              className="text-[10px] uppercase tracking-wide"
            >
              Ready Now
            </div>

            <div
              style={{
                color: C.ready,
              }}
              className="text-3xl font-semibold mt-2"
            >
              {readyCount}
            </div>

            <div
              style={{
                color: C.textMute,
              }}
              className="text-[11px] mt-1"
            >
              of {ASSETS.length} assets
            </div>
          </div>

          {/* FAILURES */}

          <div
            style={{
              background: C.panel,
              borderColor: C.border,
            }}
            className="border rounded-sm p-4"
          >
            <div
              style={{
                color: C.textFaint,
              }}
              className="text-[10px] uppercase tracking-wide"
            >
              Predicted Failures
            </div>

            <div
              style={{
                color: C.critical,
              }}
              className="text-3xl font-semibold mt-2"
            >
              {criticalCount}
            </div>

            <div
              style={{
                color: C.textMute,
              }}
              className="text-[11px] mt-1"
            >
              immediate attention
            </div>
          </div>

          {/* BACKLOG */}

          <div
            style={{
              background: C.panel,
              borderColor: C.border,
            }}
            className="border rounded-sm p-4"
          >
            <div
              style={{
                color: C.textFaint,
              }}
              className="text-[10px] uppercase tracking-wide"
            >
              Maintenance Backlog
            </div>

            <div
              style={{
                color: C.watch,
              }}
              className="text-3xl font-semibold mt-2"
            >
              {backlogHrs}h
            </div>

            <div
              style={{
                color: C.textMute,
              }}
              className="text-[11px] mt-1"
            >
              estimated workload
            </div>
          </div>

          {/* COST */}

          <div
            style={{
              background: C.panel,
              borderColor: C.border,
            }}
            className="border rounded-sm p-4"
          >
            <div
              style={{
                color: C.textFaint,
              }}
              className="text-[10px] uppercase tracking-wide"
            >
              Cost Avoided
            </div>

            <div
              style={{
                color: C.predicted,
              }}
              className="text-3xl font-semibold mt-2"
            >
              $1.2M
            </div>

            <div
              style={{
                color: C.textMute,
              }}
              className="text-[11px] mt-1"
            >
              estimated
            </div>
          </div>

        </div>

        {/* =================================================
            TABS
        ================================================= */}

        <div
          style={{
            borderColor: C.border,
          }}
          className="flex items-center gap-5 border-b mb-5"
        >

          <button
            onClick={() =>
              setTab("overview")
            }
            style={{
              color:
                tab === "overview"
                  ? C.text
                  : C.textMute,

              borderColor:
                tab === "overview"
                  ? C.ready
                  : "transparent",
            }}
            className="pb-2.5 text-xs font-medium border-b-2"
          >
            Fleet Overview
          </button>

          <button
            onClick={() =>
              setTab("maintenance")
            }
            style={{
              color:
                tab === "maintenance"
                  ? C.text
                  : C.textMute,

              borderColor:
                tab === "maintenance"
                  ? C.ready
                  : "transparent",
            }}
            className="pb-2.5 text-xs font-medium border-b-2"
          >
            Maintenance Plan
          </button>

        </div>

        {/* =================================================
            FLEET OVERVIEW
        ================================================= */}

        {tab === "overview" && (
          <>

            {/* CHART + ALERTS */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">

              {/* CHART */}

              <div
                style={{
                  background: C.panel,
                  borderColor: C.border,
                }}
                className="lg:col-span-2 border rounded-sm p-4"
              >

                <div className="flex items-center justify-between mb-4">

                  <div>
                    <div
                      style={{
                        color: C.text,
                      }}
                      className="text-sm font-semibold"
                    >
                      Readiness by asset class
                    </div>

                    <div
                      style={{
                        color: C.textFaint,
                      }}
                      className="text-[11px] mt-1"
                    >
                      Current readiness vs predicted
                    </div>
                  </div>

                  <div className="flex gap-1">

                    <button
                      onClick={() =>
                        setChartMode("current")
                      }
                      style={{
                        background:
                          chartMode === "current"
                            ? C.panelAlt
                            : "transparent",

                        color:
                          chartMode === "current"
                            ? C.text
                            : C.textFaint,

                        borderColor:
                          C.border,
                      }}
                      className="px-2 py-1 border rounded-sm text-[10px]"
                    >
                      Current
                    </button>

                    <button
                      onClick={() =>
                        setChartMode("predicted")
                      }
                      style={{
                        background:
                          chartMode === "predicted"
                            ? C.panelAlt
                            : "transparent",

                        color:
                          chartMode === "predicted"
                            ? C.text
                            : C.textFaint,

                        borderColor:
                          C.border,
                      }}
                      className="px-2 py-1 border rounded-sm text-[10px]"
                    >
                      Predicted
                    </button>

                  </div>
                </div>

                <div className="h-64">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={chartData}
                      margin={{
                        top: 5,
                        right: 10,
                        left: 0,
                        bottom: 5,
                      }}
                    >

                      <CartesianGrid
                        stroke={C.borderSoft}
                        vertical={false}
                      />

                      <XAxis
                        dataKey="type"
                        tick={{
                          fontSize: 10,
                          fill: C.textFaint,
                        }}
                        axisLine={{
                          stroke: C.border,
                        }}
                        tickLine={false}
                      />

                      <YAxis
                        domain={[0, 100]}
                        tick={{
                          fontSize: 10,
                          fill: C.textFaint,
                        }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                      />

                      <Tooltip
                        contentStyle={{
                          background: C.panelAlt,
                          border: `1px solid ${C.border}`,
                          fontSize: 12,
                        }}
                      />

                      <Bar
                        dataKey="value"
                        fill={C.ready}
                        radius={[2, 2, 0, 0]}
                      />

                    </BarChart>
                  </ResponsiveContainer>

                </div>
              </div>

              {/* ALERTS */}

              <div
                style={{
                  background: C.panel,
                  borderColor: C.border,
                }}
                className="border rounded-sm p-4"
              >

                <div className="flex items-center justify-between">

                  <div>
                    <div
                      style={{
                        color: C.text,
                      }}
                      className="text-sm font-semibold"
                    >
                      Critical alerts
                    </div>

                    <div
                      style={{
                        color: C.textFaint,
                      }}
                      className="text-[11px] mt-1"
                    >
                      Requires maintenance attention
                    </div>
                  </div>

                  <CircleAlert
                    size={17}
                    style={{
                      color: C.critical,
                    }}
                  />

                </div>

                <div className="mt-4 flex flex-col gap-2">

                  {ASSETS
                    .filter(
                      (a) =>
                        a.status === "Critical"
                    )
                    .slice(0, 5)
                    .map((a) => (
                      <button
                        key={a.id}
                        onClick={() =>
                          setSelected(a)
                        }
                        style={{
                          background: C.criticalBg,
                          borderColor:
                            "rgba(193,73,61,0.25)",
                        }}
                        className="border rounded-sm p-3 text-left hover:opacity-80"
                      >

                        <div className="flex items-center justify-between">

                          <span
                            style={{
                              color: C.text,
                            }}
                            className="text-xs font-semibold"
                          >
                            {a.tail}
                          </span>

                          <span
                            style={{
                              color: C.critical,
                              fontFamily: FONT_MONO,
                            }}
                            className="text-[10px]"
                          >
                            {a.window}d
                          </span>

                        </div>

                        <div
                          style={{
                            color: C.textMute,
                          }}
                          className="text-[11px] mt-1"
                        >
                          {a.component}
                        </div>

                      </button>
                    ))}

                </div>
              </div>

            </div>

            {/* =================================================
                ASSET LIST
            ================================================= */}

            <div
              style={{
                background: C.panel,
                borderColor: C.border,
              }}
              className="border rounded-sm"
            >

              <div className="p-4">

                <div className="flex flex-wrap items-center justify-between gap-3">

                  <div>
                    <div
                      style={{
                        color: C.text,
                      }}
                      className="text-sm font-semibold"
                    >
                      Asset list
                    </div>

                    <div
                      style={{
                        color: C.textFaint,
                      }}
                      className="text-[11px] mt-1"
                    >
                      {filtered.length} assets shown
                    </div>
                  </div>

                  {/* STATUS FILTERS */}

                  <div className="flex flex-wrap gap-1">

                    {[
                      "All",
                      "Ready",
                      "Watch",
                      "Critical",
                    ].map((status) => (
                      <button
                        key={status}
                        onClick={() =>
                          setStatusFilter(status)
                        }
                        style={{
                          background:
                            statusFilter === status
                              ? C.panelAlt
                              : "transparent",

                          color:
                            statusFilter === status
                              ? C.text
                              : C.textFaint,

                          borderColor:
                            C.border,
                        }}
                        className="px-2.5 py-1 border rounded-sm text-[10px]"
                      >
                        {status}
                      </button>
                    ))}

                  </div>

                </div>

                {/* TYPE FILTER */}

                <div className="flex gap-1 mt-3">

                  {[
                    "All",
                    "Aircraft",
                    "Ground Vehicle",
                    "Equipment",
                  ].map((type) => (
                    <button
                      key={type}
                      onClick={() =>
                        setTypeFilter(type)
                      }
                      style={{
                        color:
                          typeFilter === type
                            ? C.text
                            : C.textFaint,

                        borderColor:
                          typeFilter === type
                            ? C.border
                            : "transparent",
                      }}
                      className="px-2 py-1 border rounded-sm text-[10px]"
                    >
                      {type}
                    </button>
                  ))}

                </div>

              </div>

              {/* TABLE */}

              <div className="overflow-x-auto">

                <table className="w-full min-w-[850px]">

                  <thead>

                    <tr
                      style={{
                        background: C.panelAlt,
                        borderColor: C.border,
                      }}
                      className="border-y"
                    >

                      <th
                        style={{
                          color: C.textFaint,
                        }}
                        className="text-left px-4 py-2 text-[10px] uppercase font-medium"
                      >
                        Asset
                      </th>

                      <th
                        style={{
                          color: C.textFaint,
                        }}
                        className="text-left px-4 py-2 text-[10px] uppercase font-medium"
                      >
                        Type
                      </th>

                      <th
                        style={{
                          color: C.textFaint,
                        }}
                        className="text-left px-4 py-2 text-[10px] uppercase font-medium"
                      >
                        Status
                      </th>

                      <th
                        style={{
                          color: C.textFaint,
                        }}
                        className="text-left px-4 py-2 text-[10px] uppercase font-medium"
                      >
                        Component
                      </th>

                      <th
                        style={{
                          color: C.textFaint,
                        }}
                        className="text-left px-4 py-2 text-[10px] uppercase font-medium"
                      >
                        Failure Window
                      </th>

                      <th
                        style={{
                          color: C.textFaint,
                        }}
                        className="text-left px-4 py-2 text-[10px] uppercase font-medium"
                      >
                        Confidence
                      </th>

                      <th
                        style={{
                          color: C.textFaint,
                        }}
                        className="text-left px-4 py-2 text-[10px] uppercase font-medium"
                      >
                        Base
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filtered.map((a) => (
                      <tr
                        key={a.id}
                        onClick={() =>
                          setSelected(a)
                        }
                        style={{
                          borderColor:
                            C.borderSoft,
                        }}
                        className="border-b cursor-pointer hover:bg-[#161B23]"
                      >

                        <td className="px-4 py-3">

                          <div
                            style={{
                              color: C.text,
                            }}
                            className="text-xs font-semibold"
                          >
                            {a.tail}
                          </div>

                          <div
                            style={{
                              color: C.textFaint,
                              fontFamily: FONT_MONO,
                            }}
                            className="text-[10px] mt-1"
                          >
                            {a.id}
                          </div>

                        </td>

                        <td
                          style={{
                            color: C.textMute,
                          }}
                          className="px-4 py-3 text-xs"
                        >
                          {a.type}
                        </td>

                        <td className="px-4 py-3">

                          <StatusBadge
                            status={a.status}
                          />

                        </td>

                        <td
                          style={{
                            color: C.textMute,
                          }}
                          className="px-4 py-3 text-xs"
                        >
                          {a.component}
                        </td>

                        <td
                          style={{
                            color:
                              a.status ===
                              "Critical"
                                ? C.critical
                                : a.status ===
                                  "Watch"
                                ? C.watch
                                : C.ready,

                            fontFamily:
                              FONT_MONO,
                          }}
                          className="px-4 py-3 text-xs"
                        >
                          {a.window} days
                        </td>

                        <td
                          style={{
                            color: C.text,
                            fontFamily: FONT_MONO,
                          }}
                          className="px-4 py-3 text-xs"
                        >
                          {a.confidence}%
                        </td>

                        <td
                          style={{
                            color: C.textMute,
                          }}
                          className="px-4 py-3 text-xs"
                        >
                          {a.base}
                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>

            </div>

          </>
        )}

        {/* =================================================
            MAINTENANCE PLAN
        ================================================= */}

        {tab === "maintenance" && (
          <>

            {/* EXISTING MAINTENANCE QUEUE */}

            <div
              style={{
                background: C.panel,
                borderColor: C.border,
              }}
              className="border rounded-sm mb-5"
            >

              <div className="p-4">

                <div>
                  <div
                    style={{
                      color: C.text,
                    }}
                    className="text-sm font-semibold"
                  >
                    Maintenance Plan
                  </div>

                  <div
                    style={{
                      color: C.textFaint,
                    }}
                    className="text-[11px] mt-1"
                  >
                    Prioritized maintenance actions based on predicted failure risk
                  </div>
                </div>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full min-w-[850px]">

                  <thead>

                    <tr
                      style={{
                        background: C.panelAlt,
                        borderColor: C.border,
                      }}
                      className="border-y"
                    >

                      <th
                        style={{
                          color: C.textFaint,
                        }}
                        className="text-left px-4 py-2 text-[10px] uppercase font-medium"
                      >
                        #
                      </th>

                      <th
                        style={{
                          color: C.textFaint,
                        }}
                        className="text-left px-4 py-2 text-[10px] uppercase font-medium"
                      >
                        Asset
                      </th>

                      <th
                        style={{
                          color: C.textFaint,
                        }}
                        className="text-left px-4 py-2 text-[10px] uppercase font-medium"
                      >
                        Component
                      </th>

                      <th
                        style={{
                          color: C.textFaint,
                        }}
                        className="text-left px-4 py-2 text-[10px] uppercase font-medium"
                      >
                        Window
                      </th>

                      <th
                        style={{
                          color: C.textFaint,
                        }}
                        className="text-left px-4 py-2 text-[10px] uppercase font-medium"
                      >
                        Priority
                      </th>

                      <th
                        style={{
                          color: C.textFaint,
                        }}
                        className="text-left px-4 py-2 text-[10px] uppercase font-medium"
                      >
                        Reason
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {MAINTENANCE_QUEUE.map(
                      (item) => (
                        <tr
                          key={item.id}
                          style={{
                            borderColor:
                              C.borderSoft,
                          }}
                          className="border-b"
                        >

                          <td
                            style={{
                              color:
                                C.textFaint,
                              fontFamily:
                                FONT_MONO,
                            }}
                            className="px-4 py-3 text-xs"
                          >
                            {item.rank}
                          </td>

                          <td className="px-4 py-3">

                            <div
                              style={{
                                color: C.text,
                              }}
                              className="text-xs font-semibold"
                            >
                              {item.tail}
                            </div>

                            <div
                              style={{
                                color:
                                  C.textFaint,
                              }}
                              className="text-[10px] mt-1"
                            >
                              {item.base}
                            </div>

                          </td>

                          <td
                            style={{
                              color:
                                C.textMute,
                            }}
                            className="px-4 py-3 text-xs"
                          >
                            {item.component}
                          </td>

                          <td
                            style={{
                              color:
                                item.status ===
                                "Critical"
                                  ? C.critical
                                  : C.watch,

                              fontFamily:
                                FONT_MONO,
                            }}
                            className="px-4 py-3 text-xs"
                          >
                            {item.window} days
                          </td>

                          <td className="px-4 py-3">

                            <StatusBadge
                              status={
                                item.status
                              }
                            />

                          </td>

                          <td
                            style={{
                              color:
                                C.textMute,
                            }}
                            className="px-4 py-3 text-xs"
                          >
                            {item.reason}
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>

            {/* =================================================
                NEWLY SCHEDULED MAINTENANCE
            ================================================= */}

            {scheduledMaintenance.length > 0 && (
              <div
                style={{
                  background: C.panel,
                  borderColor: C.border,
                }}
                className="rounded-sm border p-4 mb-5"
              >

                <div className="flex items-center justify-between mb-4">

                  <div>

                    <div
                      style={{
                        color: C.text,
                      }}
                      className="text-sm font-semibold"
                    >
                      Scheduled Maintenance
                    </div>

                    <div
                      style={{
                        color: C.textFaint,
                      }}
                      className="text-[11px] mt-1"
                    >
                      Maintenance actions scheduled from the readiness dashboard
                    </div>

                  </div>

                  <div
                    style={{
                      color: C.ready,
                      background: C.readyBg,
                    }}
                    className="px-2 py-1 rounded-sm text-[11px]"
                  >
                    {scheduledMaintenance.length} scheduled
                  </div>

                </div>

                <div className="flex flex-col">

                  {scheduledMaintenance.map(
                    (item) => (
                      <div
                        key={item.id}
                        style={{
                          borderColor:
                            C.borderSoft,
                        }}
                        className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center py-3 border-b last:border-b-0"
                      >

                        {/* ASSET */}

                        <div>

                          <div
                            style={{
                              color: C.text,
                            }}
                            className="text-[13px] font-medium"
                          >
                            {item.tail}
                          </div>

                          <div
                            style={{
                              color:
                                C.textFaint,
                            }}
                            className="text-[11px]"
                          >
                            {item.model}
                          </div>

                        </div>

                        {/* TYPE */}

                        <div>

                          <div
                            style={{
                              color:
                                C.textMute,
                            }}
                            className="text-[11px]"
                          >
                            Maintenance
                          </div>

                          <div
                            style={{
                              color: C.text,
                            }}
                            className="text-[12px]"
                          >
                            {item.type}
                          </div>

                        </div>

                        {/* COMPONENT */}

                        <div>

                          <div
                            style={{
                              color:
                                C.textMute,
                            }}
                            className="text-[11px]"
                          >
                            Component
                          </div>

                          <div
                            style={{
                              color: C.text,
                            }}
                            className="text-[12px]"
                          >
                            {item.component}
                          </div>

                        </div>

                        {/* PRIORITY */}

                        <div>

                          <div
                            style={{
                              color:
                                C.textMute,
                            }}
                            className="text-[11px]"
                          >
                            Priority
                          </div>

                          <div
                            style={{
                              color:
                                item.priority ===
                                  "High" ||
                                item.priority ===
                                  "Critical"
                                  ? C.critical
                                  : item.priority ===
                                    "Medium"
                                  ? C.watch
                                  : C.text,
                            }}
                            className="text-[12px]"
                          >
                            {item.priority}
                          </div>

                        </div>

                        {/* DATE */}

                        <div>

                          <div
                            style={{
                              color:
                                C.textMute,
                            }}
                            className="text-[11px]"
                          >
                            Date
                          </div>

                          <div
                            style={{
                              color: C.text,
                              fontFamily:
                                FONT_MONO,
                            }}
                            className="text-[12px]"
                          >
                            {item.date}
                          </div>

                        </div>

                        {/* STATUS */}

                        <div>

                          <span
                            style={{
                              color:
                                C.predicted,
                              background:
                                C.predictedBg,
                            }}
                            className="inline-flex px-2 py-1 rounded-sm text-[11px]"
                          >
                            {item.status}
                          </span>

                        </div>

                      </div>
                    )
                  )}

                </div>

              </div>
            )}

            {/* EMPTY STATE */}

            {scheduledMaintenance.length === 0 && (
              <div
                style={{
                  background: C.panel,
                  borderColor: C.border,
                }}
                className="border rounded-sm p-8 text-center"
              >

                <Calendar
                  size={24}
                  style={{
                    color: C.textFaint,
                  }}
                  className="mx-auto"
                />

                <div
                  style={{
                    color: C.text,
                  }}
                  className="text-sm font-semibold mt-3"
                >
                  No maintenance scheduled yet
                </div>

                <div
                  style={{
                    color: C.textFaint,
                  }}
                  className="text-[11px] mt-1"
                >
                  Open an asset and use
                  "Schedule maintenance" to add
                  a maintenance action.
                </div>

              </div>
            )}

          </>
        )}

      </main>

      {/* =================================================
          ASSET DRAWER
      ================================================= */}

      <AssetDrawer
        asset={selected}
        onClose={() =>
          setSelected(null)
        }
        onScheduleMaintenance={
          handleScheduleMaintenance
        }
        aiPrediction={aiPrediction}
        aiLoading={aiLoading}
        aiError={aiError}
      />

      {/* =================================================
          MAINTENANCE MODAL
      ================================================= */}

      <MaintenanceModal
        asset={maintenanceAsset}

        type={maintenanceType}
        setType={setMaintenanceType}

        priority={maintenancePriority}
        setPriority={setMaintenancePriority}

        date={maintenanceDate}
        setDate={setMaintenanceDate}

        notes={maintenanceNotes}
        setNotes={setMaintenanceNotes}

        onCancel={() =>
          setMaintenanceAsset(null)
        }

        onConfirm={confirmMaintenance}
      />

      {/* =================================================
          SUCCESS MESSAGE
      ================================================= */}

      {maintenanceMessage && (
        <div
          style={{
            position: "fixed",
            right: "20px",
            bottom: "20px",
            zIndex: 100,

            background: C.panel,

            border: `1px solid ${C.ready}`,

            color: C.text,

            padding: "12px 16px",

            borderRadius: "4px",

            fontSize: "13px",

            boxShadow:
              "0 10px 30px rgba(0,0,0,0.4)",
          }}
        >

          <div
            style={{
              color: C.ready,
              fontWeight: 600,
            }}
          >
            ✓ Maintenance scheduled
          </div>

          <div
            style={{
              marginTop: "4px",
              color: C.textMute,
            }}
          >
            {maintenanceMessage}
          </div>

        </div>
      )}

    </div>
  );
}