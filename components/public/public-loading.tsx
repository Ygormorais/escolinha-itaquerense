/**
 * Skeleton de carregamento no visual do site público (papel + vermelho).
 */
export function PublicLoading({ label = "Carregando…" }: { label?: string }) {
  return (
    <div
      className="pub-loading"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .pub-loading{
          min-height:100vh;background:#FAF8F5;color:#1C1412;
          font-family:var(--font-body),Inter,system-ui,sans-serif
        }
        .pub-loading-hdr{
          height:68px;border-bottom:1px solid #E8E2DA;background:rgba(255,252,249,.96);
          display:flex;align-items:center;padding:0 clamp(16px,4vw,28px);gap:12px
        }
        .pub-loading-logo{
          width:40px;height:40px;border-radius:10px;background:#F3EFE9;
          animation:pub-pulse 1.2s ease-in-out infinite
        }
        .pub-loading-brand{
          height:14px;width:140px;border-radius:6px;background:#F3EFE9;
          animation:pub-pulse 1.2s ease-in-out infinite
        }
        .pub-loading-hero{
          height:min(42vh,280px);background:linear-gradient(135deg,#4A0B0B 0%,#C62828 55%,#9F1D1D 100%);
          opacity:.92
        }
        .pub-loading-body{
          max-width:900px;margin:0 auto;padding:clamp(24px,5vw,48px) clamp(16px,4vw,28px);
          display:flex;flex-direction:column;gap:16px
        }
        .pub-loading-line{
          height:14px;border-radius:8px;background:#E8E2DA;
          animation:pub-pulse 1.2s ease-in-out infinite
        }
        .pub-loading-line.w60{width:60%}
        .pub-loading-line.w40{width:40%}
        .pub-loading-card{
          height:120px;border-radius:16px;background:#fff;border:1px solid #E8E2DA;
          box-shadow:0 2px 8px rgba(74,11,11,.06);
          animation:pub-pulse 1.2s ease-in-out infinite
        }
        @keyframes pub-pulse{
          0%,100%{opacity:1}
          50%{opacity:.55}
        }
        @media (prefers-reduced-motion:reduce){
          .pub-loading-logo,.pub-loading-brand,.pub-loading-line,.pub-loading-card{animation:none}
        }
      `,
        }}
      />
      <div className="pub-loading-hdr">
        <div className="pub-loading-logo" />
        <div className="pub-loading-brand" />
      </div>
      <div className="pub-loading-hero" />
      <div className="pub-loading-body">
        <div className="pub-loading-line w60" />
        <div className="pub-loading-line w40" />
        <div className="pub-loading-card" />
        <div className="pub-loading-card" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  )
}
