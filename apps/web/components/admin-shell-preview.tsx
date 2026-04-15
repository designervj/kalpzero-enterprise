import type { CSSProperties } from "react";
import type { BusinessBlueprintDto } from "@kalpzero/contracts";

function previewVariables(blueprint: any): CSSProperties {
  return {
    ["--admin-primary" as string]: blueprint.admin_theme.primary_color,
    ["--admin-accent" as string]: blueprint.admin_theme.accent_color,
    ["--admin-surface" as string]: blueprint.admin_theme.surface_color,
    ["--admin-ink" as string]: blueprint.admin_theme.ink_color,
    ["--admin-muted" as string]: blueprint.admin_theme.muted_color,
  };
}

export function AdminShellPreview({ blueprint }: { blueprint: any }) {
  return (
    <main className="kz-admin-preview" style={previewVariables(blueprint)}>
      <aside className="kz-admin-preview__sidebar">
        <p className="kz-admin-preview__brand">
          {blueprint.admin_theme.brand_name}
        </p>
        <nav className="kz-admin-preview__nav">
          {blueprint.admin_navigation.map((item: any) => (
            <span key={`${item.label}:${item.href}`}>{item.label}</span>
          ))}
        </nav>
      </aside>
      <section className="kz-admin-preview__main">
        <header className="kz-admin-preview__hero">
          <p className="kz-site__eyebrow">Admin Blueprint</p>
          <h1>{blueprint.businessLabel} operator shell</h1>
          <p>
            Admin layout, navigation, widgets, and vocabulary can vary per
            tenant while the backend and module boundaries remain shared.
          </p>
        </header>
        <div className="kz-admin-preview__widgets">
          {blueprint.dashboard_widgets.map((widget: any) => (
            <article key={widget.key} className="kz-admin-preview__widget">
              <span>{widget.title}</span>
              <strong>{widget.metric}</strong>
              <p>{widget.description}</p>
            </article>
          ))}
        </div>
        <section className="kz-admin-preview__panel">
          <h2>Vocabulary</h2>
          <div className="kz-admin-preview__vocab">
            {Object.entries(blueprint.vocabulary).map(([key, value]: any) => (
              <article key={key}>
                <small>{key}</small>
                <strong>{value}</strong>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
