import React from "react";

/**
 * PremiumGate
 * No blur. Shows preview content + CTA card below.
 * Rules: locked = show preview + CTA beneath. Unlocked = show children.
 */
export function PremiumGate({ locked, children, title = "Unlock Full Strategy", description, cta = "Unlock Full Strategy", onUnlock, badge = "Strategy Add-on", previewRows = 2 }) {
  if (!locked) return <>{children}</>;

  // Clone and show first previewRows children as preview
  const allChildren = React.Children.toArray(children);
  const preview = allChildren.slice(0, previewRows);
  const hiddenCount = allChildren.length - previewRows;

  return (
    <div className="space-y-3">
      {/* Preview content — no blur, fully visible */}
      {preview}

      {/* CTA unlock card */}
      <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/8 via-[#0f172a] to-orange-500/5 p-6 shadow-xl shadow-amber-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200 mb-2">
              {badge}
            </div>
            <p className="text-base font-black text-white">{title}</p>
            {description && <p className="mt-1 text-xs text-slate-400 leading-relaxed">{description}</p>}
            {hiddenCount > 0 && (
              <p className="mt-1.5 text-[11px] font-semibold text-amber-200/70">
                + {hiddenCount} more item{hiddenCount > 1 ? "s" : ""} hidden
              </p>
            )}
          </div>
          <button
            onClick={onUnlock}
            className="shrink-0 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:shadow-xl hover:shadow-amber-500/30"
          >
            {cta}
          </button>
        </div>
      </div>
    </div>
  );
}
