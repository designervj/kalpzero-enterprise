"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Menu as MenuIcon, X } from "lucide-react";
import { NavigationDocument, NavigationItem } from "@/lib/models/navigation";

interface NavigationRendererProps {
  navId: string;
  layout?: "horizontal" | "vertical";
  align?: "left" | "center" | "right";
  sticky?: boolean;
  mobileCollapse?: boolean;
}

export function NavigationRenderer({
  navId,
  layout = "horizontal",
  align = "left",
  sticky = false,
  mobileCollapse = true,
}: NavigationRendererProps) {
  const [nav, setNav] = useState<NavigationDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    if (!navId) return;

    const fetchNav = async () => {
      try {
        const res = await fetch(`/api/navigations/${navId}`);
        if (res.ok) {
          const data = await res.json();
          setNav(data);
        }
      } catch (error) {
        console.error("Failed to fetch navigation", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNav();
  }, [navId]);

  if (isLoading)
    return (
      <div className="h-10 w-full animate-pulse bg-slate-100 rounded-md" />
    );
  if (!nav) return null;

  const alignmentClass =
    align === "center"
      ? "justify-center"
      : align === "right"
        ? "justify-end"
        : "justify-start";
  const containerClass = `kalp-nav-container ${sticky ? "sticky top-0 z-50" : ""} ${layout === "vertical" ? "flex-col" : "flex-row"}`;

  return (
    <div className={containerClass}>
      {/* Desktop Navigation */}
      <nav
        className={`hidden md:flex items-center gap-6 ${alignmentClass} w-full`}
      >
        {nav.items.map((item) => (
          <NavItemView key={item.id} item={item} />
        ))}
      </nav>

      {/* Mobile Navigation Toggle */}
      <div className="md:hidden flex items-center justify-between w-full p-4">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2"
        >
          {isMobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-[100] p-6 animate-in slide-in-from-right duration-300">
          <div className="flex justify-between items-center mb-8">
            <span className="font-bold text-lg">{nav.name}</span>
            <button onClick={() => setIsMobileMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <ul className="space-y-4">
            {nav.items.map((item) => (
              <li key={item.id}>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <Link
                    href={item.url}
                    target={item.target}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-medium"
                  >
                    {item.label}
                  </Link>
                  {item.type !== "link" && (
                    <button
                      onClick={() =>
                        setActiveDropdown(
                          activeDropdown === item.id ? null : item.id,
                        )
                      }
                    >
                      <ChevronDown
                        size={18}
                        className={`transition-transform ${activeDropdown === item.id ? "rotate-180" : ""}`}
                      />
                    </button>
                  )}
                </div>
                {activeDropdown === item.id && item.children && (
                  <ul className="pl-4 mt-2 space-y-2">
                    {item.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={child.url}
                          target={child.target}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="text-slate-600 text-sm"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <style jsx>{`
        .kalp-nav-container {
          display: flex;
          width: 100%;
          background: inherit;
        }
        .nav-item-root {
          position: relative;
        }
        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          min-width: 200px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          padding: 8px 0;
          opacity: 0;
          visibility: hidden;
          transform: translateY(10px);
          transition: all 0.2s ease;
          z-index: 100;
        }
        .nav-item-root:hover .dropdown-menu {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        .mega-menu {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(10px);
          width: 100vw;
          max-width: 1000px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          padding: 24px;
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s ease;
          z-index: 100;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
        }
        .nav-item-root:hover .mega-menu {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          font-weight: 500;
          color: #334155;
          text-decoration: none;
          padding: 8px 0;
          transition: color 0.15s ease;
        }
        .nav-link:hover {
          color: #0ea5e9;
        }
      `}</style>
    </div>
  );
}

function NavItemView({ item }: { item: NavigationItem }) {
  return (
    <div className="nav-item-root group">
      <Link href={item.url} target={item.target} className="nav-link">
        {item.label}
        {item.type !== "link" && (
          <ChevronDown
            size={14}
            className="group-hover:rotate-180 transition-transform"
          />
        )}
      </Link>

      {item.type === "dropdown" && item.children && (
        <div className="dropdown-menu">
          {item.children.map((child) => (
            <Link
              key={child.id}
              href={child.url}
              target={child.target}
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-cyan-600 transition-colors"
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}

      {item.type === "mega" && item.megaMenuColumns && (
        <div className="mega-menu">
          {item.megaMenuColumns.map((col, idx) => (
            <div key={idx}>
              <h4 className="text-sm font-bold text-slate-900 mb-3 border-b pb-2">
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <Link
                      href={link.url}
                      target={link.target}
                      className="text-sm text-slate-600 hover:text-cyan-600 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
