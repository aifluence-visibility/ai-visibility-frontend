import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { BASE_URL } from "../../api";

const WorkspaceContext = createContext(null);

const STORAGE_KEY = "ai-vis-workspace";

function loadWorkspace() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; }
}
function saveWorkspace(ws) {
  if (ws) localStorage.setItem(STORAGE_KEY, JSON.stringify(ws));
  else localStorage.removeItem(STORAGE_KEY);
}

export function WorkspaceProvider({ children }) {
  const [workspace, setWorkspaceState] = useState(loadWorkspace);
  const [planFeatures, setPlanFeatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const plan = workspace?.plan || "free";
  // Persist workspace changes
  const setWorkspace = useCallback((ws) => {
    setWorkspaceState(ws);
    saveWorkspace(ws);
  }, []);

  // Load plan features when plan changes
  useEffect(() => {
    fetch(`${BASE_URL}/plan-features/${plan}`)
      .then(r => r.json())
      .then(d => { if (d.features) setPlanFeatures(d.features); })
      .catch(() => {});
  }, [plan]);

  // Create workspace
  const createWorkspace = useCallback(async (name, ownerEmail, selectedPlan = "free") => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${BASE_URL}/workspace`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ownerEmail, plan: selectedPlan }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create workspace.");
      setWorkspace(json.workspace);
      return json.workspace;
    } catch (e) { setError(e.message); return null; }
    finally { setLoading(false); }
  }, [setWorkspace]);

  // Add member
  const addMember = useCallback(async (email, role) => {
    if (!workspace) return null;
    setLoading(true); setError("");
    try {
      const res = await fetch(`${BASE_URL}/workspace/${workspace.id}/members`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add member.");
      setWorkspace(json.workspace);
      return json.workspace;
    } catch (e) { setError(e.message); return null; }
    finally { setLoading(false); }
  }, [workspace, setWorkspace]);

  // Update member role
  const updateMemberRole = useCallback(async (email, role) => {
    if (!workspace) return null;
    setLoading(true); setError("");
    try {
      const res = await fetch(`${BASE_URL}/workspace/${workspace.id}/members/${encodeURIComponent(email)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update role.");
      setWorkspace(json.workspace);
      return json.workspace;
    } catch (e) { setError(e.message); return null; }
    finally { setLoading(false); }
  }, [workspace, setWorkspace]);

  // Remove member
  const removeMember = useCallback(async (email) => {
    if (!workspace) return null;
    setLoading(true); setError("");
    try {
      const res = await fetch(`${BASE_URL}/workspace/${workspace.id}/members/${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to remove member.");
      setWorkspace(json.workspace);
      return json.workspace;
    } catch (e) { setError(e.message); return null; }
    finally { setLoading(false); }
  }, [workspace, setWorkspace]);

  // Update plan
  const updatePlan = useCallback(async (newPlan) => {
    if (!workspace) return null;
    setLoading(true); setError("");
    try {
      const res = await fetch(`${BASE_URL}/workspace/${workspace.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update plan.");
      setWorkspace(json.workspace);
      return json.workspace;
    } catch (e) { setError(e.message); return null; }
    finally { setLoading(false); }
  }, [workspace, setWorkspace]);

  // Check if feature is allowed
  const hasFeature = useCallback((feature) => {
    return planFeatures.includes(feature);
  }, [planFeatures]);

  // Leave / destroy workspace
  const leaveWorkspace = useCallback(() => {
    setWorkspace(null);
    setPlanFeatures([]);
  }, [setWorkspace]);

  const value = useMemo(() => {
    const members = workspace?.members || [];
    const currentEmail = members[0]?.email || "";
    const currentRole = members.find(m => m.email === currentEmail)?.role || "owner";
    return {
      workspace, plan, members, currentEmail, currentRole, planFeatures,
      loading, error,
      createWorkspace, addMember, updateMemberRole, removeMember, updatePlan,
      hasFeature, leaveWorkspace, setWorkspace,
    };
  }, [workspace, plan, planFeatures, loading, error,
       createWorkspace, addMember, updateMemberRole, removeMember, updatePlan, hasFeature, leaveWorkspace, setWorkspace]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
