import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ─── Font options ────────────────────────────────────────────────────────────
const FONTS = [
  {
    id: "system",
    label: "System Default",
    value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif",
    preview: "The quick brown fox",
  },
  { id: "inter",      label: "Inter",             value: "'Inter', sans-serif",             preview: "The quick brown fox", google: "Inter:wght@400;500;600;700" },
  { id: "roboto",     label: "Roboto",            value: "'Roboto', sans-serif",            preview: "The quick brown fox", google: "Roboto:wght@400;500;700" },
  { id: "poppins",    label: "Poppins",           value: "'Poppins', sans-serif",           preview: "The quick brown fox", google: "Poppins:wght@400;500;600;700" },
  { id: "nunito",     label: "Nunito",            value: "'Nunito', sans-serif",            preview: "The quick brown fox", google: "Nunito:wght@400;500;600;700" },
  { id: "sourceCode", label: "Source Code Pro",   value: "'Source Code Pro', monospace",   preview: "The quick brown fox", google: "Source+Code+Pro:wght@400;500;600;700" },
  { id: "playfair",   label: "Playfair Display",  value: "'Playfair Display', serif",      preview: "The quick brown fox", google: "Playfair+Display:wght@400;600;700" },
];

const FONT_SIZES = [
  { id: "sm", label: "Small",   scale: 0.875 },
  { id: "md", label: "Medium",  scale: 1     },
  { id: "lg", label: "Large",   scale: 1.125 },
  { id: "xl", label: "X-Large", scale: 1.25  },
];

const ACCENT_PRESETS = [
  { id: "teal",    label: "Teal",    primary: "#109494", hover: "#0c7070" },
  { id: "blue",    label: "Blue",    primary: "#1976d2", hover: "#1565c0" },
  { id: "violet",  label: "Violet",  primary: "#7c3aed", hover: "#6d28d9" },
  { id: "rose",    label: "Rose",    primary: "#e11d48", hover: "#be123c" },
  { id: "emerald", label: "Emerald", primary: "#059669", hover: "#047857" },
  { id: "amber",   label: "Amber",   primary: "#d97706", hover: "#b45309" },
];

const DEFAULTS = { theme: "dark", fontId: "system", fontSizeId: "md", accentId: "teal" };
const STORAGE_KEY = "siteSettings";

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveSettings(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

function applySettings(settings) {
  const root = document.documentElement;
  root.setAttribute("data-theme", settings.theme);

  const font = FONTS.find((f) => f.id === settings.fontId) || FONTS[0];
  root.style.setProperty("--font-family-body",   font.value);
  root.style.setProperty("--font-family-system", font.value);

  const size = FONT_SIZES.find((s) => s.id === settings.fontSizeId) || FONT_SIZES[1];
  const base = 14 * size.scale;
  root.style.setProperty("--font-size-xs",   `${Math.round(12 * size.scale)}px`);
  root.style.setProperty("--font-size-sm",   `${Math.round(13 * size.scale)}px`);
  root.style.setProperty("--font-size-base", `${Math.round(base)}px`);
  root.style.setProperty("--font-size-md",   `${Math.round(16 * size.scale)}px`);
  root.style.setProperty("--font-size-lg",   `${Math.round(18 * size.scale)}px`);
  root.style.setProperty("--font-size-xl",   `${Math.round(20 * size.scale)}px`);
  root.style.setProperty("--font-size-2xl",  `${Math.round(24 * size.scale)}px`);

  const accent = ACCENT_PRESETS.find((a) => a.id === settings.accentId) || ACCENT_PRESETS[0];
  root.style.setProperty("--color-primary",        accent.primary);
  root.style.setProperty("--color-primary-hover",  accent.hover);
  root.style.setProperty("--color-teal",           accent.primary);
  root.style.setProperty("--color-border-teal",    accent.primary);
}

function ensureGoogleFont(fontId) {
  const font = FONTS.find((f) => f.id === fontId);
  if (!font?.google) return;
  const id = `gfont-${fontId}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id   = id;
  link.rel  = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`;
  document.head.appendChild(link);
}

// ─── Main page component ─────────────────────────────────────────────────────
export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(loadSettings);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    ensureGoogleFont(settings.fontId);
    applySettings(settings);
  }, [settings]);

  const update = useCallback((key, val) => {
    setSaved(false);
    setSettings((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handleSave = useCallback(() => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, [settings]);

  const handleReset = useCallback(() => {
    setSaved(false);
    setSettings({ ...DEFAULTS });
  }, []);

  const currentFont   = FONTS.find((f) => f.id === settings.fontId)     || FONTS[0];
  const currentAccent = ACCENT_PRESETS.find((a) => a.id === settings.accentId) || ACCENT_PRESETS[0];

  return (
    <div style={styles.page}>

      <div style={styles.pageHeader}>
     

        <div style={styles.headerActions}>
          {saved && <span style={styles.savedBadge}>✓ Saved!</span>}
          <button style={styles.resetBtn} onClick={handleReset}>Reset to defaults</button>
          <button style={styles.saveBtn}  onClick={handleSave}>Save settings</button>
        </div>
      </div>

      {/* ── Content grid ──────────────────────────────────────── */}
      <div style={styles.grid}>

        {/* LEFT COLUMN */}
        <div style={styles.column}>

          {/* Theme */}
          <div style={styles.card}>
            <p style={styles.cardLabel}>Theme</p>
            <div style={styles.themeRow}>
              {[
                { id: "dark",  icon: "🌙", title: "Dark",  sub: "Easy on the eyes"   },
                { id: "light", icon: "☀️", title: "Light", sub: "Classic bright look" },
              ].map(({ id, icon, title, sub }) => (
                <div
                  key={id}
                  style={themeCard(settings.theme === id)}
                  onClick={() => update("theme", id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && update("theme", id)}
                >
                  <span style={{ fontSize: 24 }}>{icon}</span>
                  <div>
                    <p style={themeTitle(settings.theme === id)}>{title}</p>
                    <p style={styles.themeSub}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Accent colour */}
          <div style={styles.card}>
            <p style={styles.cardLabel}>Accent Colour</p>
            <div style={styles.accentGrid}>
              {ACCENT_PRESETS.map((a) => (
                <button
                  key={a.id}
                  style={accentDot(settings.accentId === a.id, a.primary)}
                  onClick={() => update("accentId", a.id)}
                  title={a.label}
                  aria-label={`Accent: ${a.label}`}
                />
              ))}
            </div>
            <p style={styles.accentNote}>
              Selected: <strong style={{ color: currentAccent.primary }}>{currentAccent.label}</strong>
            </p>
          </div>

          {/* Font size */}
          <div style={styles.card}>
            <p style={styles.cardLabel}>Font Size</p>
            <div style={styles.sizeRow}>
              {FONT_SIZES.map((s) => (
                <button
                  key={s.id}
                  style={sizeBtn(settings.fontSizeId === s.id)}
                  onClick={() => update("fontSizeId", s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live preview */}
          <div style={styles.card}>
            <p style={styles.cardLabel}>Live Preview</p>
            <div style={{ ...styles.preview, fontFamily: currentFont.value }}>
              <p style={{ margin: "0 0 6px", fontSize: "var(--font-size-lg)", fontWeight: 700, color: "var(--color-text-primary)" }}>
                Dashboard Overview
              </p>
              <p style={{ margin: "0 0 14px", fontSize: "var(--font-size-base)", color: "var(--color-text-secondary)" }}>
                This is how your text will appear across the application.
              </p>
              <button style={{ background: currentAccent.primary, color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: "var(--font-size-base)", fontWeight: 600, cursor: "default", fontFamily: currentFont.value }}>
                Primary Action
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN — font family */}
        <div style={styles.column}>
          <div style={styles.card}>
            <p style={styles.cardLabel}>Font Family</p>
            <div style={styles.fontGrid}>
              {FONTS.map((f) => (
                <div
                  key={f.id}
                  style={fontCard(settings.fontId === f.id, f.value)}
                  onClick={() => { ensureGoogleFont(f.id); update("fontId", f.id); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && update("fontId", f.id)}
                >
                  <p style={fontLabel(settings.fontId === f.id)}>{f.label}</p>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-primary)", fontFamily: f.value }}>
                    {f.preview}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useInitSettings() {
  useEffect(() => {
    const s = loadSettings();
    ensureGoogleFont(s.fontId);
    applySettings(s);
  }, []);
}

// ─── Style helpers (functions for dynamic styles) ────────────────────────────
const themeCard  = (active) => ({
  flex: 1, border: `2px solid ${active ? "var(--color-primary)" : "rgba(255,255,255,0.1)"}`,
  borderRadius: 10, padding: "16px", cursor: "pointer", display: "flex", alignItems: "center",
  gap: 14, background: active ? "rgba(16,148,148,0.12)" : "rgba(255,255,255,0.03)",
  transition: "all 0.2s", userSelect: "none",
});

const themeTitle = (active) => ({
  margin: 0, fontSize: 14, fontWeight: 600,
  color: active ? "var(--color-primary)" : "var(--color-text-primary)",
});

const accentDot  = (active, color) => ({
  width: 38, height: 38, borderRadius: "50%", background: color, cursor: "pointer",
  border: active ? "3px solid var(--color-text-primary)" : "3px solid transparent",
  outline: active ? `3px solid ${color}` : "none", outlineOffset: 2, transition: "all 0.2s", flexShrink: 0,
});

const sizeBtn    = (active) => ({
  flex: 1, border: `2px solid ${active ? "var(--color-primary)" : "rgba(255,255,255,0.1)"}`,
  borderRadius: 8, padding: "10px 0", cursor: "pointer", textAlign: "center",
  background: active ? "rgba(16,148,148,0.12)" : "rgba(255,255,255,0.03)",
  color: active ? "var(--color-primary)" : "var(--color-text-primary)",
  fontWeight: active ? 700 : 400, transition: "all 0.2s", fontSize: 13, userSelect: "none",
});

const fontCard   = (active, fontValue) => ({
  border: `2px solid ${active ? "var(--color-primary)" : "rgba(255,255,255,0.1)"}`,
  borderRadius: 8, padding: "12px 14px", cursor: "pointer",
  background: active ? "rgba(16,148,148,0.12)" : "rgba(255,255,255,0.03)",
  transition: "all 0.2s", userSelect: "none", fontFamily: fontValue,
});

const fontLabel  = (active) => ({
  margin: "0 0 4px", fontSize: 12, fontWeight: 700,
  color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
  fontFamily: "inherit",
});

// ─── Static styles ────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--color-bg-page)",
    padding: "32px 32px 48px",
    fontFamily: "var(--font-family-body)",
    color: "var(--color-text-primary)",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
    flexWrap: "wrap",
    gap: 16,
  },
  pageHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  backBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "var(--color-text-secondary)",
    borderRadius: 8,
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
  pageTitle: {
    margin: 0,
    fontSize: "var(--font-size-xl)",
    fontWeight: 700,
    color: "var(--color-text-primary)",
  },
  pageSubtitle: {
    margin: "4px 0 0",
    fontSize: "var(--font-size-sm)",
    color: "var(--color-text-secondary)",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  savedBadge: {
    fontSize: 13,
    color: "#22c55e",
    fontWeight: 600,
  },
  resetBtn: {
    padding: "9px 18px", borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "transparent", color: "var(--color-text-secondary)",
    fontSize: 13, fontWeight: 500, cursor: "pointer",
  },
  saveBtn: {
    padding: "9px 24px", borderRadius: 8, border: "none",
    background: "var(--color-primary)", color: "#fff",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
    alignItems: "start",
  },
  column: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  card: {
    background: "var(--color-bg-surface)",
    borderRadius: 12,
    padding: "22px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  cardLabel: {
    margin: 0, fontSize: 11, fontWeight: 700,
    letterSpacing: "0.09em", textTransform: "uppercase",
    color: "var(--color-text-secondary)",
  },
  themeRow: {
    display: "flex",
    gap: 10,
  },
  themeSub: {
    margin: "3px 0 0",
    fontSize: 11,
    color: "var(--color-text-secondary)",
  },
  accentGrid: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  accentNote: {
    margin: 0,
    fontSize: 12,
    color: "var(--color-text-secondary)",
  },
  sizeRow: {
    display: "flex",
    gap: 8,
  },
  fontGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  preview: {
    background: "var(--color-bg-page)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8,
    padding: 18,
  },
};