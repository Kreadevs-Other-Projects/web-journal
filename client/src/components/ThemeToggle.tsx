import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        padding: "6px 6px 6px 12px",
        borderRadius: "999px",
        border: isDark ? "1px solid #1F2937" : "1px solid #D1D5DB",
        background: isDark
          ? "linear-gradient(135deg, #0f172a, #1e293b)"
          : "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
        cursor: "pointer",
        outline: "none",
        transition: "all 0.3s ease",
        boxShadow: isDark
          ? "0 0 0 1px #1e3a5f, inset 0 1px 0 rgba(255,255,255,0.04)"
          : "0 0 0 1px #bae6fd, inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
    >
      <span
        style={{
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: isDark ? "#94a3b8" : "#64748b",
          transition: "color 0.3s ease",
          userSelect: "none",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {isDark ? "Dark" : "Light"}
      </span>

      <div
        style={{
          position: "relative",
          width: "52px",
          height: "28px",
          borderRadius: "999px",
          background: isDark
            ? "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)"
            : "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)",
          transition: "background 0.4s ease",
          boxShadow: isDark
            ? "inset 0 2px 4px rgba(0,0,0,0.4), 0 0 12px rgba(37,99,235,0.3)"
            : "inset 0 2px 4px rgba(0,0,0,0.1), 0 0 12px rgba(56,189,248,0.4)",
          flexShrink: 0,
        }}
      >
        {isDark && (
          <>
            <span
              style={{
                position: "absolute",
                top: 5,
                left: 8,
                width: 2,
                height: 2,
                borderRadius: "50%",
                background: "white",
                opacity: 0.7,
              }}
            />
            <span
              style={{
                position: "absolute",
                top: 10,
                left: 14,
                width: 1.5,
                height: 1.5,
                borderRadius: "50%",
                background: "white",
                opacity: 0.5,
              }}
            />
            <span
              style={{
                position: "absolute",
                top: 6,
                left: 20,
                width: 1.5,
                height: 1.5,
                borderRadius: "50%",
                background: "white",
                opacity: 0.6,
              }}
            />
          </>
        )}

        <div
          style={{
            position: "absolute",
            top: "3px",
            left: isDark ? "26px" : "3px",
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            background: isDark
              ? "linear-gradient(145deg, #e2e8f0, #cbd5e1)"
              : "linear-gradient(145deg, #fef9c3, #fde68a)",
            transition: "left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
            boxShadow: isDark
              ? "0 2px 6px rgba(0,0,0,0.5), inset -2px -1px 0px rgba(0,0,0,0.15)"
              : "0 2px 6px rgba(0,0,0,0.2), inset -2px -1px 0px rgba(251,191,36,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
          }}
        >
          <span style={{ lineHeight: 1 }}>{isDark ? "🌙" : "☀️"}</span>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;600&display=swap');
        button:focus-visible {
          box-shadow: 0 0 0 3px rgba(37,99,235,0.5) !important;
        }
      `}</style>
    </button>
  );
}
