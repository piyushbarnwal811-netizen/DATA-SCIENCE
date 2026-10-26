"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import SuperAdminDashboardView from "../components/hierarchy/SuperAdminDashboardView.jsx";
import TpoDashboardView from "../components/hierarchy/TpoDashboardView.jsx";
import DirectorDashboardView from "../components/hierarchy/DirectorDashboardView.jsx";
import HodDashboardView from "../components/hierarchy/HodDashboardView.jsx";
import TeacherDashboardView from "../components/hierarchy/TeacherDashboardView.jsx";
import HierarchyVisualizer from "../components/hierarchy/HierarchyVisualizer.jsx";
import api, { errorMessage } from "../services/api.js";
import { Layers, X, Shield, RefreshCw } from "lucide-react";

export default function HierarchyDashboard() {
  const { user } = useAuth();
  const [showTreeModal, setShowTreeModal] = useState(false);
  const [treeData, setTreeData] = useState(null);
  const [loadingTree, setLoadingTree] = useState(false);
  const [treeError, setTreeError] = useState("");

  const currentRole = user?.role === "admin" ? "super_admin" : (user?.role || "super_admin");

  const openTreeModal = async () => {
    setShowTreeModal(true);
    setLoadingTree(true);
    setTreeError("");
    try {
      const { data } = await api.get("/hierarchy/tree");
      setTreeData(data.tree);
    } catch (err) {
      setTreeError(errorMessage(err));
    } finally {
      setLoadingTree(false);
    }
  };

  return (
    <div className="hierarchy-page-root space-y-6">
      {/* Verified Role Status Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-500">Active Verified Session:</span>
          <strong className="text-slate-800 font-extrabold">{user?.name}</strong>
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-50 text-red-700 border border-red-200">
            {currentRole.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-500 text-[11px]">
          <span>Email: <strong className="text-slate-700 font-mono">{user?.email}</strong></span>
          {(currentRole === "super_admin" || currentRole === "admin") && (
            <button
              type="button"
              onClick={openTreeModal}
              className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-bold underline cursor-pointer"
            >
              <Layers size={13} />
              <span>Inspect University Tree</span>
            </button>
          )}
        </div>
      </div>

      {/* Role-Specific Scoped View */}
      {(currentRole === "super_admin" || currentRole === "admin") && (
        <SuperAdminDashboardView onInspectTree={openTreeModal} />
      )}

      {currentRole === "tpo" && (
        <TpoDashboardView />
      )}

      {currentRole === "director" && (
        <DirectorDashboardView />
      )}

      {currentRole === "hod" && (
        <HodDashboardView />
      )}

      {currentRole === "teacher" && (
        <TeacherDashboardView />
      )}

      {/* Hierarchy Tree Inspection Modal */}
      {showTreeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-red-600" />
                <h3 className="font-extrabold text-slate-800 text-sm">
                  Live University Organizational Hierarchy Tree
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTreeModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loadingTree ? (
                <div className="p-12 text-center text-slate-500 text-xs">
                  <RefreshCw size={24} className="animate-spin text-indigo-600 mx-auto mb-2" />
                  <span>Loading live database tree...</span>
                </div>
              ) : treeError ? (
                <div className="p-4 bg-rose-50 text-rose-800 rounded-xl text-xs">
                  {treeError}
                </div>
              ) : (
                <HierarchyVisualizer treeData={treeData} />
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTreeModal(false)}
                className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-lg cursor-pointer"
              >
                Close Visualizer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
