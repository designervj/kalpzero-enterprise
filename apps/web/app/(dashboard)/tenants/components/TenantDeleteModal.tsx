"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, X } from "lucide-react";

import {
  deriveTenantDatabaseLabel,
  type DeleteState,
} from "../tenantShared";
import { Button } from "./TenantUi";

type TenantDeleteModalProps = {
  deleteState: DeleteState | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onTogglePurge: (nextValue: boolean) => void;
};

const DANGER_MODAL_CLASSNAME =
  "w-full max-w-lg rounded-3xl border border-rose-500/20 bg-[#0b111d] " +
  "shadow-[0_40px_120px_rgba(0,0,0,0.65)]";

const PURGE_TOGGLE_CLASSNAME =
  "flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-800 " +
  "bg-black/20 p-4 text-sm text-slate-300";

export function TenantDeleteModal({
  deleteState,
  deleting,
  onClose,
  onConfirm,
  onTogglePurge,
}: TenantDeleteModalProps) {
  useEffect(() => {
    if (!deleteState) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [deleteState]);

  if (!deleteState || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className={DANGER_MODAL_CLASSNAME}>
        <div className="flex items-start gap-4 border-b border-slate-800 px-6 py-5">
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white">
              Delete Business
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              You are deleting{" "}
              <span className="font-semibold text-white">
                {deleteState.tenant.name}
              </span>
              . This removes the tenant record and business-admin users from
              the platform.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="rounded-2xl border border-slate-800 bg-black/20 p-4 text-sm text-slate-300">
            <div>
              <span className="text-slate-500">Tenant key:</span>{" "}
              <span className="font-mono text-white">
                {deleteState.tenant.key}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-slate-500">Database:</span>{" "}
              <span className="text-white">
                {deriveTenantDatabaseLabel(deleteState.tenant)}
              </span>
            </div>
          </div>

          {deleteState.tenant.provisioningMode !== "lite_profile" && (
            <label className={PURGE_TOGGLE_CLASSNAME}>
              <input
                type="checkbox"
                checked={deleteState.purgeTenantDb}
                onChange={(event) => onTogglePurge(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-950 text-rose-500"
              />
              <div>
                <div className="font-semibold text-white">
                  Also delete isolated tenant database
                </div>
                <div className="mt-1 text-xs leading-6 text-slate-500">
                  Turn this on only if you want to permanently drop{" "}
                  <code>{deriveTenantDatabaseLabel(deleteState.tenant)}</code>.
                </div>
              </div>
            </label>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={deleting}
              className="gap-2"
            >
              <Trash2 size={14} />
              {deleting ? "Deleting..." : "Delete Business"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
