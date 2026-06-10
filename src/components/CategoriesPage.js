"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";

// ─── Icons ────────────────────────────────────────────────────────────────────

const Ic = {
    Tag: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2zM17 17h.01M17 13h-2a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2zM7 13H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2z" /></svg>,
    Cube: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" /></svg>,
    Settings: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" strokeWidth={1.5} /></svg>,
    Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
    Upload: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
    Pencil: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
    Trash: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    Check: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>,
    X: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
    Search: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    Spark: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
    Refresh: ({ spin }) => <svg className={`w-4 h-4 ${spin ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
    Chevron: ({ open }) => <svg className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
    Warning: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
    ChevronRight: () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>,
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const S = {
    card: "rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.08]",
    cardHover: "rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.08] hover:ring-white/[0.14] hover:bg-white/[0.05] transition-all duration-200",
    input: "w-full rounded-xl bg-white/[0.05] ring-1 ring-white/[0.08] px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-[#01a0be]/60 focus:bg-white/[0.07] transition-all",
    btnPrimary: "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#01a0be] hover:bg-[#02b5d8] text-white transition-all duration-150 shadow-lg shadow-[#01a0be]/20 hover:shadow-[#01a0be]/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none",
    btnGhost: "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-all duration-150",
    btnOutline: "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-neutral-400 ring-1 ring-white/[0.08] hover:text-white hover:ring-white/[0.18] hover:bg-white/[0.04] transition-all duration-150",
    btnDanger: "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-red-400 ring-1 ring-red-500/20 hover:ring-red-500/40 hover:bg-red-500/[0.06] transition-all duration-150",
    iconBtn: "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150",
    label: "text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.08em]",
};

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ toasts }) {
    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map(t => (
                <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium backdrop-blur-xl ring-1 shadow-2xl
                    ${t.type === "success" ? "bg-emerald-950/90 ring-emerald-500/20 text-emerald-300 shadow-emerald-900/30"
                    : t.type === "error" ? "bg-red-950/90 ring-red-500/20 text-red-300 shadow-red-900/30"
                    : "bg-neutral-900/95 ring-white/10 text-neutral-200"}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${t.type === "success" ? "bg-emerald-500/20 text-emerald-400" : t.type === "error" ? "bg-red-500/20 text-red-400" : "bg-neutral-700 text-neutral-300"}`}>
                        {t.type === "success" ? <Ic.Check /> : t.type === "error" ? <Ic.X /> : <Ic.Spark />}
                    </span>
                    {t.message}
                </div>
            ))}
        </div>
    );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

function Modal({ open, onClose, children, width = "max-w-lg" }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
            <div className={`relative w-full ${width} bg-neutral-950 ring-1 ring-white/[0.08] rounded-3xl shadow-2xl overflow-hidden`}>
                {children}
            </div>
        </div>
    );
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────

function ConfirmModal({ open, title, message, confirmLabel = "Confirm", danger = false, onConfirm, onCancel }) {
    return (
        <Modal open={open} onClose={onCancel} width="max-w-md">
            <div className="p-6">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${danger ? "bg-red-500/10 text-red-400" : "bg-[#01a0be]/10 text-[#01a0be]"}`}>
                    {danger ? <Ic.Warning /> : <Ic.Spark />}
                </div>
                <h3 className="text-base font-semibold text-white mb-1.5">{title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{message}</p>
            </div>
            <div className="flex gap-2 justify-end px-6 pb-6">
                <button onClick={onCancel} className={S.btnGhost}>Cancel</button>
                <button onClick={onConfirm} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all ${danger ? "bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/30" : S.btnPrimary}`}>
                    {confirmLabel}
                </button>
            </div>
        </Modal>
    );
}

// ─── ExportFormModal ──────────────────────────────────────────────────────────

function ExportFormModal({ open, initial, onClose, onSave }) {
    const [form, setForm] = useState({ name: "", description: "", aiCategorizationEnabled: false });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open) {
            setForm({ name: initial?.name ?? "", description: initial?.description ?? "", aiCategorizationEnabled: initial?.aiCategorizationEnabled ?? false });
            setError("");
        }
    }, [open, initial]);

    const handleSubmit = async () => {
        if (!form.name.trim()) { setError("Name is required."); return; }
        setSaving(true); setError("");
        try {
            const url = initial ? `/nextapi/exports/${initial._id}` : "/nextapi/exports";
            const res = await fetch(url, { method: initial ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, name: form.name.trim() }) });
            const data = await res.json();
            if (!data.success) throw new Error(data.message || "Failed to save");
            onSave(data.data, !!initial); onClose();
        } catch (e) { setError(e.message); }
        finally { setSaving(false); }
    };

    return (
        <Modal open={open} onClose={onClose}>
            {/* Gradient header strip */}
            <div className="h-1 w-full bg-gradient-to-r from-[#01a0be] to-cyan-400" />
            <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-white">{initial ? "Edit Export" : "New Export"}</h2>
                    <button onClick={onClose} className={`${S.iconBtn} text-neutral-500 hover:text-white hover:bg-white/[0.06]`}><Ic.X /></button>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className={`${S.label} block mb-1.5`}>Name *</label>
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Tris, Shopify…" className={S.input} />
                    </div>
                    <div>
                        <label className={`${S.label} block mb-1.5`}>Description</label>
                        <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description…" className={S.input} />
                    </div>
                    <button type="button" onClick={() => setForm(f => ({ ...f, aiCategorizationEnabled: !f.aiCategorizationEnabled }))}
                        className={`w-full flex items-center justify-between p-4 rounded-xl ring-1 transition-all ${form.aiCategorizationEnabled ? "ring-[#01a0be]/30 bg-[#01a0be]/[0.05]" : "ring-white/[0.06] bg-white/[0.02] hover:ring-white/[0.1]"}`}>
                        <div className="text-left">
                            <p className="text-sm font-medium text-white">AI Categorization</p>
                            <p className="text-xs text-neutral-500 mt-0.5">Auto-categorize products via Gemini</p>
                        </div>
                        <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${form.aiCategorizationEnabled ? "bg-[#01a0be]" : "bg-neutral-700"}`}>
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${form.aiCategorizationEnabled ? "translate-x-4" : "translate-x-1"}`} />
                        </div>
                    </button>
                </div>
                {error && <p className="text-xs text-red-400 flex items-center gap-1.5"><Ic.Warning />{error}</p>}
                <div className="flex gap-2 justify-end pt-1">
                    <button onClick={onClose} className={S.btnGhost}>Cancel</button>
                    <button onClick={handleSubmit} disabled={saving} className={S.btnPrimary}>
                        {saving ? <Ic.Refresh spin /> : <Ic.Check />}
                        {initial ? "Save Changes" : "Create Export"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// ─── ImportModal ──────────────────────────────────────────────────────────────

function ImportModal({ open, exportId, onClose, onSuccess }) {
    const [tab, setTab] = useState("json");
    const [input, setInput] = useState("");
    const [preview, setPreview] = useState([]);
    const [parseError, setParseError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => { if (!open) { setInput(""); setPreview([]); setParseError(""); } }, [open]);

    const parse = () => {
        setParseError("");
        try {
            if (tab === "json") {
                const arr = Array.isArray(JSON.parse(input.trim())) ? JSON.parse(input.trim()) : [JSON.parse(input.trim())];
                setPreview(arr.map((x, i) => {
                    if (typeof x === "string") return { label: x.trim() };
                    if (x?.label) return { label: x.label.trim() };
                    throw new Error(`Item ${i} has no "label" field`);
                }).filter(x => x.label));
            } else {
                const lines = input.split("\n").map(l => l.trim()).filter(Boolean);
                setPreview(lines.slice(lines[0]?.toLowerCase() === "label" ? 1 : 0).map(l => ({ label: l })));
            }
        } catch (e) { setParseError(e.message); setPreview([]); }
    };

    const handleImport = async () => {
        if (!preview.length) return;
        setLoading(true);
        try {
            const res = await fetch("/nextapi/categories/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exportId, categories: preview }) });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            onSuccess(data.inserted); onClose();
        } catch (e) { setParseError(e.message); }
        finally { setLoading(false); }
    };

    return (
        <Modal open={open} onClose={onClose} width="max-w-2xl">
            <div className="h-1 w-full bg-gradient-to-r from-[#01a0be] to-cyan-400" />
            <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-white">Import Categories</h2>
                    <button onClick={onClose} className={`${S.iconBtn} text-neutral-500 hover:text-white hover:bg-white/[0.06]`}><Ic.X /></button>
                </div>
                <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl w-fit">
                    {["json", "csv"].map(t => (
                        <button key={t} onClick={() => { setTab(t); setPreview([]); setParseError(""); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === t ? "bg-[#01a0be] text-white shadow-lg shadow-[#01a0be]/20" : "text-neutral-500 hover:text-white"}`}>
                            {t.toUpperCase()}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-neutral-600">
                    {tab === "json" ? '["Category A", "Category B"] or [{"label": "Category A"}, …]' : "One category per line. Optional \"label\" header row."}
                </p>
                <textarea rows={6} value={input} onChange={e => { setInput(e.target.value); setPreview([]); setParseError(""); }}
                    placeholder={tab === "json" ? '["Electronics", "Clothing", "Tools"]' : "Electronics\nClothing\nTools"}
                    className={`${S.input} font-mono resize-none`} />
                {parseError && <p className="text-xs text-red-400 flex items-center gap-1.5"><Ic.Warning />{parseError}</p>}
                {!preview.length ? (
                    <button onClick={parse} disabled={!input.trim()} className={`w-full py-2.5 rounded-xl text-sm font-medium text-neutral-400 ring-1 ring-white/[0.08] hover:ring-white/[0.16] hover:text-white transition-all disabled:opacity-30`}>
                        Parse &amp; Preview
                    </button>
                ) : (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-400"><span className="text-[#01a0be] font-semibold">{preview.length}</span> categories ready</span>
                            <button onClick={() => setPreview([])} className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">Clear</button>
                        </div>
                        <div className="max-h-44 overflow-y-auto rounded-xl bg-white/[0.02] ring-1 ring-white/[0.06] divide-y divide-white/[0.04]">
                            {preview.slice(0, 50).map((item, i) => (
                                <div key={i} className="flex items-center gap-3 px-3 py-2">
                                    <span className="text-xs text-neutral-700 w-5 tabular-nums">{i + 1}</span>
                                    <span className="text-xs text-neutral-300">{item.label}</span>
                                </div>
                            ))}
                            {preview.length > 50 && <div className="px-3 py-2 text-xs text-neutral-600 text-center">+{preview.length - 50} more</div>}
                        </div>
                    </div>
                )}
                <div className="flex gap-2 justify-end pt-1">
                    <button onClick={onClose} className={S.btnGhost}>Cancel</button>
                    <button onClick={handleImport} disabled={!preview.length || loading} className={S.btnPrimary}>
                        {loading ? <Ic.Refresh spin /> : <Ic.Upload />}
                        Import {preview.length > 0 ? preview.length : ""} Categories
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// ─── Tree helpers ─────────────────────────────────────────────────────────────

function buildTree(categories) {
    const map = new Map();
    for (const cat of categories) {
        const parts = cat.label.split(" / ").map(p => p.trim()).filter(Boolean);
        for (let i = 0; i < parts.length; i++) {
            const path = parts.slice(0, i + 1).join(" / ");
            if (!map.has(path)) map.set(path, { path, label: parts[i], depth: i, category: null, children: [] });
        }
        map.get(cat.label).category = cat;
    }
    const roots = [];
    for (const [path, node] of map) {
        const parts = path.split(" / ");
        if (parts.length === 1) { roots.push(node); continue; }
        const parent = map.get(parts.slice(0, -1).join(" / "));
        if (parent) parent.children.push(node); else roots.push(node);
    }
    const sort = ns => { ns.sort((a, b) => a.label.localeCompare(b.label)); ns.forEach(n => sort(n.children)); return ns; };
    return sort(roots);
}

function countLeaves(node) {
    return node.children.reduce((s, c) => s + countLeaves(c), node.category ? 1 : 0);
}

// ─── TreeNodeRow ──────────────────────────────────────────────────────────────

function TreeNodeRow({ node, onEdit, onDelete, depth = 0 }) {
    const [open, setOpen] = useState(true);
    const [editing, setEditing] = useState(false);
    const [label, setLabel] = useState(node.category?.label ?? "");
    const [saving, setSaving] = useState(false);
    const inputRef = useRef(null);
    const hasChildren = node.children.length > 0;
    const hasCategory = !!node.category;

    useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

    const save = async () => {
        if (!label.trim() || label.trim() === node.category.label) { setEditing(false); setLabel(node.category.label); return; }
        setSaving(true);
        await onEdit(node.category._id, label.trim());
        setSaving(false); setEditing(false);
    };

    return (
        <div>
            <div
                className="flex items-center gap-1 py-1.5 rounded-xl transition-all group hover:bg-neutral-700/40"
                style={{ paddingLeft: `${8 + depth * 20}px`, paddingRight: "10px" }}
                onClick={() => hasChildren && !editing && setOpen(v => !v)}
            >
                {hasChildren ? (
                    <span className="w-6 h-6 shrink-0 flex items-center justify-center text-neutral-500 group-hover:text-neutral-300" style={{ cursor: "pointer" }}>
                        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </span>
                ) : (
                    <span className="w-6 shrink-0" />
                )}

                <div className="flex-1 min-w-0" onClick={e => editing && e.stopPropagation()}>
                    {editing ? (
                        <input ref={inputRef} value={label} onChange={e => setLabel(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") { setEditing(false); setLabel(node.category.label); } }}
                            className="w-full bg-neutral-700/60 rounded-lg px-2.5 py-1 text-sm text-white ring-1 ring-[#01a0be]/40 focus:outline-none transition-all" />
                    ) : (
                        <span className={`text-sm truncate select-none ${hasCategory ? "text-neutral-300 group-hover:text-white" : "text-neutral-400 group-hover:text-neutral-200 font-medium"}`}
                            style={{ cursor: hasChildren ? "pointer" : "default" }}>
                            {node.label}
                        </span>
                    )}
                </div>

                {hasChildren && !editing && (
                    <span className="text-xs tabular-nums text-neutral-600 group-hover:text-neutral-500 shrink-0 ml-1.5">
                        {countLeaves(node)}
                    </span>
                )}

                {hasCategory && !editing && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setLabel(node.category.label); setEditing(true); }}
                            className={`${S.iconBtn} text-neutral-600 hover:text-[#01a0be] hover:bg-[#01a0be]/10`}><Ic.Pencil /></button>
                        <button onClick={() => onDelete(node.category._id, node.category.label)}
                            className={`${S.iconBtn} text-neutral-600 hover:text-red-400 hover:bg-red-500/10`}><Ic.Trash /></button>
                    </div>
                )}

                {editing && (
                    <div className="flex items-center gap-0.5 shrink-0 ml-1" onClick={e => e.stopPropagation()}>
                        <button onClick={save} disabled={saving} className={`${S.iconBtn} text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40`}>
                            {saving ? <Ic.Refresh spin /> : <Ic.Check />}
                        </button>
                        <button onClick={() => { setEditing(false); setLabel(node.category.label); }}
                            className={`${S.iconBtn} text-neutral-500 hover:text-white hover:bg-white/[0.06]`}><Ic.X /></button>
                    </div>
                )}
            </div>

            {hasChildren && open && node.children.map(child => (
                <TreeNodeRow key={child.path} node={child} onEdit={onEdit} onDelete={onDelete} depth={depth + 1} />
            ))}
        </div>
    );
}

// ─── CategoryRow (flat search mode) ──────────────────────────────────────────

function CategoryRow({ category, onEdit, onDelete }) {
    const [editing, setEditing] = useState(false);
    const [label, setLabel] = useState(category.label);
    const [saving, setSaving] = useState(false);
    const inputRef = useRef(null);
    useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
    const save = async () => {
        if (!label.trim() || label.trim() === category.label) { setEditing(false); setLabel(category.label); return; }
        setSaving(true); await onEdit(category._id, label.trim()); setSaving(false); setEditing(false);
    };
    const parts = category.label.split(" / ").map(p => p.trim()).filter(Boolean);
    const leaf = parts[parts.length - 1];
    const parent = parts.slice(0, -1).join(" / ");
    return (
        <div className="flex items-center gap-1 py-1.5 px-3 rounded-xl transition-all group hover:bg-neutral-700/40">
            <span className="w-6 shrink-0" />
            <div className="flex-1 min-w-0">
                {editing ? (
                    <input ref={inputRef} value={label} onChange={e => setLabel(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") { setEditing(false); setLabel(category.label); } }}
                        className="w-full bg-neutral-700/60 rounded-lg px-2.5 py-1 text-sm text-white ring-1 ring-[#01a0be]/40 focus:outline-none transition-all" />
                ) : (
                    <div className="min-w-0">
                        {parent && <p className="text-[10px] text-neutral-600 mb-0.5 truncate">{parent}</p>}
                        <span className="text-sm text-neutral-300 group-hover:text-white truncate select-none">{leaf}</span>
                    </div>
                )}
            </div>
            {!editing ? (
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => { setLabel(category.label); setEditing(true); }} className={`${S.iconBtn} text-neutral-600 hover:text-[#01a0be] hover:bg-[#01a0be]/10`}><Ic.Pencil /></button>
                    <button onClick={() => onDelete(category._id, category.label)} className={`${S.iconBtn} text-neutral-600 hover:text-red-400 hover:bg-red-500/10`}><Ic.Trash /></button>
                </div>
            ) : (
                <div className="flex gap-0.5 shrink-0">
                    <button onClick={save} disabled={saving} className={`${S.iconBtn} text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40`}>{saving ? <Ic.Refresh spin /> : <Ic.Check />}</button>
                    <button onClick={() => { setEditing(false); setLabel(category.label); }} className={`${S.iconBtn} text-neutral-500 hover:bg-white/[0.06]`}><Ic.X /></button>
                </div>
            )}
        </div>
    );
}

// ─── CategoriesTab ────────────────────────────────────────────────────────────

function CategoriesTab({ exportId, toast }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [newLabel, setNewLabel] = useState("");
    const [adding, setAdding] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [confirm, setConfirm] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try { const d = await (await fetch(`/nextapi/categories?exportId=${exportId}`)).json(); setCategories(d.data ?? []); }
        catch { toast("Failed to load categories", "error"); }
        finally { setLoading(false); }
    }, [exportId]);

    useEffect(() => { if (exportId) load(); }, [exportId, load]);

    const filtered = useMemo(() => { const q = search.toLowerCase(); return q ? categories.filter(c => c.label.toLowerCase().includes(q)) : categories; }, [categories, search]);
    const tree = useMemo(() => buildTree(categories), [categories]);

    const add = async () => {
        if (!newLabel.trim()) return;
        setAdding(true);
        try {
            const d = await (await fetch("/nextapi/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exportId, label: newLabel.trim() }) })).json();
            if (!d.success) throw new Error(d.message);
            setCategories(p => [...p, d.data].sort((a, b) => a.label.localeCompare(b.label)));
            setNewLabel(""); toast("Category added", "success");
        } catch (e) { toast(e.message, "error"); }
        finally { setAdding(false); }
    };

    const edit = async (id, label) => {
        try {
            const d = await (await fetch(`/nextapi/categories/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label }) })).json();
            if (!d.success) throw new Error(d.message);
            setCategories(p => p.map(c => c._id === id ? { ...c, label } : c).sort((a, b) => a.label.localeCompare(b.label)));
            toast("Category updated", "success");
        } catch (e) { toast(e.message, "error"); }
    };

    const del = (id, label) => setConfirm({
        title: "Delete Category", danger: true,
        message: `Delete "${label}"? Products with this category will lose it.`,
        onConfirm: async () => {
            setConfirm(null);
            try {
                const d = await (await fetch(`/nextapi/categories/${id}`, { method: "DELETE" })).json();
                if (!d.success) throw new Error(d.message);
                setCategories(p => p.filter(c => c._id !== id)); toast("Category deleted", "success");
            } catch (e) { toast(e.message, "error"); }
        }
    });

    const clearAll = () => setConfirm({
        title: "Clear All Categories", danger: true, confirmLabel: "Delete All",
        message: `Delete all ${categories.length} categories for this export?`,
        onConfirm: async () => {
            setConfirm(null);
            try {
                const d = await (await fetch(`/nextapi/categories/by-export/${exportId}`, { method: "DELETE" })).json();
                if (!d.success) throw new Error(d.message);
                setCategories([]); toast(`Deleted ${d.deleted} categories`, "success");
            } catch (e) { toast(e.message, "error"); }
        }
    });

    return (
        <>
            <ConfirmModal open={!!confirm} {...confirm} onCancel={() => setConfirm(null)} />
            <ImportModal open={importOpen} exportId={exportId} onClose={() => setImportOpen(false)} onSuccess={n => { toast(`Imported ${n} categories`, "success"); load(); }} />

            <div className="space-y-3">
                {/* Toolbar */}
                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-600"><Ic.Search /></div>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories…"
                            className={`${S.input} pl-9 pr-8`} />
                        {search && <button onClick={() => setSearch("")} className="absolute inset-y-0 right-3 flex items-center text-neutral-600 hover:text-neutral-400 transition-colors"><Ic.X /></button>}
                    </div>
                    <button onClick={() => setImportOpen(true)} className={S.btnOutline}><Ic.Upload />Import</button>
                    {categories.length > 0 && <button onClick={clearAll} className={S.btnDanger}><Ic.Trash /></button>}
                </div>

                {/* Stats strip */}
                {categories.length > 0 && (
                    <div className="flex items-center gap-2 px-1">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#01a0be]/60" />
                            <span className="text-xs text-neutral-500"><span className="text-neutral-300 font-medium">{categories.length}</span> categories</span>
                        </div>
                        {loading && <Ic.Refresh spin />}
                    </div>
                )}

                {/* Tree / flat list */}
                <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl border border-neutral-700/50 overflow-hidden">
                    {loading && categories.length === 0 ? (
                        <div className="py-20 flex flex-col items-center gap-3 text-neutral-600">
                            <Ic.Refresh spin /><p className="text-sm">Loading…</p>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="py-20 flex flex-col items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-neutral-700/50 flex items-center justify-center text-neutral-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2zM17 17h.01M17 13h-2a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2zM7 13H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2z" /></svg>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-neutral-300">No categories yet</p>
                                <p className="text-xs text-neutral-600 mt-1">Add one below or import a list</p>
                            </div>
                        </div>
                    ) : search && filtered.length === 0 ? (
                        <div className="py-16 flex flex-col items-center gap-3 text-neutral-600">
                            <Ic.Search />
                            <p className="text-sm text-neutral-500">No match for <span className="text-neutral-300">"{search}"</span></p>
                        </div>
                    ) : (
                        <div className="p-3 overflow-y-auto max-h-[520px]">
                            {search
                                ? filtered.map(cat => <CategoryRow key={cat._id} category={cat} onEdit={edit} onDelete={del} />)
                                : tree.map(node => <TreeNodeRow key={node.path} node={node} onEdit={edit} onDelete={del} />)
                            }
                        </div>
                    )}
                </div>

                {/* Add new */}
                <div className="flex gap-2">
                    <input value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => e.key === "Enter" && add()}
                        placeholder='New category — use " / " for subcategories, e.g. "Electronics / Phones"'
                        className={`${S.input} flex-1`} />
                    <button onClick={add} disabled={!newLabel.trim() || adding} className={`${S.btnPrimary} shrink-0`}>
                        {adding ? <Ic.Refresh spin /> : <Ic.Plus />}Add
                    </button>
                </div>
            </div>
        </>
    );
}

// ─── CategorySelect (products dropdown) ──────────────────────────────────────

function CategorySelect({ categories, currentCategoryId, onSelect, onClear }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const btnRef = useRef(null);
    const menuRef = useRef(null);

    const openDrop = () => {
        const r = btnRef.current?.getBoundingClientRect();
        if (r) setPos({ top: r.bottom + 4, left: r.right - 260 });
        setOpen(true);
    };

    useEffect(() => {
        if (!open) return;
        const h = e => { if (!btnRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) { setOpen(false); setSearch(""); } };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [open]);

    const current = categories.find(c => c._id === currentCategoryId);
    const filtered = search ? categories.filter(c => c.label.toLowerCase().includes(search.toLowerCase())) : categories;
    const leafLabel = current ? current.label.split(" / ").pop() : null;

    return (
        <>
            <button ref={btnRef} onClick={openDrop}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all max-w-[180px] ring-1
                    ${current ? "bg-[#01a0be]/10 ring-[#01a0be]/25 text-[#01a0be] hover:bg-[#01a0be]/15" : "bg-white/[0.04] ring-white/[0.06] text-neutral-500 hover:text-neutral-300 hover:ring-white/[0.12]"}`}>
                <span className="truncate">{leafLabel ?? "—"}</span>
                <Ic.Chevron open={open} />
            </button>

            {open && (
                <div ref={menuRef} style={{ position: "fixed", top: pos.top, left: pos.left, width: 260 }}
                    className="z-[9980] bg-neutral-950 ring-1 ring-white/[0.1] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden backdrop-blur-xl">
                    <div className="p-2 border-b border-white/[0.06]">
                        <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                            className="w-full bg-white/[0.04] rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none ring-1 ring-white/[0.06] focus:ring-[#01a0be]/40 transition-all" />
                    </div>
                    <div className="max-h-56 overflow-y-auto py-1.5 px-1.5 space-y-0.5">
                        {current && (
                            <button onClick={() => { onClear(); setOpen(false); setSearch(""); }}
                                className="w-full text-left px-2.5 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2">
                                <Ic.X /><span>Remove category</span>
                            </button>
                        )}
                        {filtered.length === 0 && <p className="py-4 text-xs text-neutral-600 text-center">No results</p>}
                        {filtered.map(cat => {
                            const parts = cat.label.split(" / ").map(p => p.trim()).filter(Boolean);
                            const depth = parts.length - 1;
                            const leaf = parts[parts.length - 1];
                            const parent = parts.slice(0, -1).join(" / ");
                            const sel = cat._id === currentCategoryId;
                            return (
                                <button key={cat._id} onClick={() => { onSelect(cat); setOpen(false); setSearch(""); }}
                                    style={{ paddingLeft: `${depth * 12 + 10}px` }}
                                    className={`w-full text-left pr-2.5 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between gap-2
                                        ${sel ? "bg-[#01a0be]/10 text-[#01a0be]" : "text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200"}`}>
                                    <div className="min-w-0">
                                        {parent && !search && <p className="text-[9px] text-neutral-700 truncate leading-tight mb-0.5">{parent}</p>}
                                        <span className="truncate block font-medium">{leaf}</span>
                                    </div>
                                    {sel && <span className="shrink-0 text-[#01a0be]"><Ic.Check /></span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
}

// ─── ProductsTab ──────────────────────────────────────────────────────────────

function ProductsTab({ exportId, toast }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [triggering, setTriggering] = useState(false);
    const [confirm, setConfirm] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [pd, cd] = await Promise.all([
                fetch(`/nextapi/products/ai-categories?exportId=${exportId}`).then(r => r.json()),
                fetch(`/nextapi/categories?exportId=${exportId}`).then(r => r.json()),
            ]);
            setProducts(pd.data ?? []); setCategories(cd.data ?? []);
        } catch { toast("Failed to load", "error"); }
        finally { setLoading(false); }
    }, [exportId]);

    useEffect(() => { if (exportId) load(); }, [exportId, load]);

    const stats = useMemo(() => {
        const total = products.length, categorized = products.filter(p => p.aiCategory).length;
        return { total, categorized, pct: total ? Math.round((categorized / total) * 100) : 0 };
    }, [products]);

    const filtered = useMemo(() => {
        let r = products;
        if (filter === "categorized") r = r.filter(p => p.aiCategory);
        if (filter === "uncategorized") r = r.filter(p => !p.aiCategory);
        if (search) { const q = search.toLowerCase(); r = r.filter(p => p.product_name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q) || p.aiCategory?.categoryName?.toLowerCase().includes(q)); }
        return r;
    }, [products, filter, search]);

    const setCategory = async (product, cat) => {
        try {
            const d = await (await fetch(`/nextapi/products/${product._id}/ai-category`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exportId, categoryId: cat._id, categoryName: cat.label }) })).json();
            if (!d.success) throw new Error(d.message);
            setProducts(p => p.map(x => x._id === product._id ? { ...x, aiCategory: { exportId, categoryId: cat._id, categoryName: cat.label } } : x));
            toast("Category updated", "success");
        } catch (e) { toast(e.message, "error"); }
    };

    const removeCategory = async (product) => {
        try {
            const d = await (await fetch(`/nextapi/products/${product._id}/ai-category?exportId=${exportId}`, { method: "DELETE" })).json();
            if (!d.success) throw new Error(d.message);
            setProducts(p => p.map(x => x._id === product._id ? { ...x, aiCategory: null } : x));
            toast("Removed", "success");
        } catch (e) { toast(e.message, "error"); }
    };

    const triggerAI = async () => {
        setTriggering(true);
        try {
            const r = await fetch("/nextapi/ai-categorization", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exportId }) });
            const d = await r.json();
            if (r.status === 202 || d.message) toast("AI categorization started", "success"); else throw new Error(d.error);
        } catch (e) { toast(e.message, "error"); }
        finally { setTriggering(false); }
    };

    const clearAll = () => setConfirm({
        title: "Clear All AI Categories", danger: true, confirmLabel: "Clear",
        message: `Remove AI categories from all ${stats.categorized} categorized products?`,
        onConfirm: async () => {
            setConfirm(null);
            try {
                const d = await (await fetch(`/nextapi/products/ai-categories?exportId=${exportId}`, { method: "DELETE" })).json();
                if (!d.success) throw new Error(d.message);
                setProducts(p => p.map(x => ({ ...x, aiCategory: null }))); toast(`Cleared ${d.modified}`, "success");
            } catch (e) { toast(e.message, "error"); }
        }
    });

    const pctColor = stats.pct >= 80 ? "#22c55e" : stats.pct >= 50 ? "#f59e0b" : "#ef4444";

    return (
        <>
            <ConfirmModal open={!!confirm} {...confirm} onCancel={() => setConfirm(null)} />
            <div className="space-y-4">

                {/* Stats + actions */}
                <div className={`${S.card} p-5`}>
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-6">
                            <div>
                                <p className={`${S.label} mb-1`}>Categorized</p>
                                <p className="text-2xl font-bold text-white tabular-nums">
                                    {stats.categorized}
                                    <span className="text-sm font-normal text-neutral-600 ml-1">/ {stats.total}</span>
                                </p>
                            </div>
                            <div className="w-px h-8 bg-white/[0.06]" />
                            <div>
                                <p className={`${S.label} mb-1`}>Coverage</p>
                                <p className="text-2xl font-bold tabular-nums" style={{ color: pctColor }}>{stats.pct}%</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={triggerAI} disabled={triggering} className={S.btnPrimary}>
                                {triggering ? <Ic.Refresh spin /> : <Ic.Spark />}Trigger AI
                            </button>
                            <button onClick={load} disabled={loading} className={`${S.btnOutline} w-9 px-0 justify-center`}><Ic.Refresh spin={loading} /></button>
                            {stats.categorized > 0 && <button onClick={clearAll} className={S.btnDanger}><Ic.Trash /></button>}
                        </div>
                    </div>
                    {/* Progress */}
                    <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${stats.pct}%`, backgroundColor: pctColor, boxShadow: `0 0 8px ${pctColor}60` }} />
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex gap-0.5 p-1 bg-white/[0.03] ring-1 ring-white/[0.06] rounded-xl">
                        {[["all","All"],[" categorized","Categorized"],["uncategorized","Uncategorized"]].map(([v,l]) => (
                            <button key={v} onClick={() => setFilter(v.trim())}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === v.trim() ? "bg-[#01a0be] text-white shadow-md shadow-[#01a0be]/20" : "text-neutral-500 hover:text-white"}`}>
                                {l}
                            </button>
                        ))}
                    </div>
                    <div className="relative flex-1 min-w-40">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-600"><Ic.Search /></div>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" className={`${S.input} pl-9`} />
                    </div>
                    <span className="text-xs text-neutral-600">{filtered.length} products</span>
                </div>

                {/* Table */}
                <div className={`${S.card} overflow-hidden`}>
                    <div className="grid grid-cols-[auto_1fr_2fr_auto] gap-x-4 px-4 py-2.5 border-b border-white/[0.05]">
                        {["#", "Code", "Product", "Category"].map(h => <span key={h} className={S.label}>{h}</span>)}
                    </div>
                    {loading ? (
                        <div className="py-20 flex flex-col items-center gap-3 text-neutral-600"><Ic.Refresh spin /><p className="text-sm">Loading…</p></div>
                    ) : filtered.length === 0 ? (
                        <div className="py-20 flex flex-col items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] flex items-center justify-center text-neutral-600"><Ic.Cube /></div>
                            <p className="text-sm text-neutral-500">No products found</p>
                        </div>
                    ) : (
                        <div className="max-h-[520px] overflow-y-auto">
                            {filtered.map((p, i) => (
                                <div key={p._id} className="group grid grid-cols-[auto_1fr_2fr_auto] gap-x-4 px-4 py-3 items-center hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] last:border-0">
                                    <span className="text-xs text-neutral-700 tabular-nums w-6">{i + 1}</span>
                                    <span className="text-xs text-neutral-600 font-mono truncate">{p.code}</span>
                                    <span className="text-sm text-neutral-300 truncate">{p.product_name}</span>
                                    <CategorySelect categories={categories} currentCategoryId={p.aiCategory?.categoryId}
                                        onSelect={cat => setCategory(p, cat)} onClear={() => removeCategory(p)} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

// ─── PlaygroundTab ───────────────────────────────────────────────────────────

function PlaygroundTab({ exportId, toast }) {
    const [input, setInput] = useState("");
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [elapsed, setElapsed] = useState(0);
    const [apiDocsOpen, setApiDocsOpen] = useState(false);
    const timerRef = useRef(null);

    const placeholder = JSON.stringify([
        { code: "SKU-001", name: "Wireless Bluetooth Headphones", description: "Over-ear noise cancelling" },
        { code: "SKU-002", name: "USB-C Charging Cable 2m" },
    ], null, 2);

    const loadSample = () => setInput(placeholder);

    const run = async () => {
        setError(""); setResults(null);
        let parsed;
        try {
            parsed = JSON.parse(input.trim());
            if (!Array.isArray(parsed)) parsed = [parsed];
        } catch {
            setError("Invalid JSON. Paste an array of product objects.");
            return;
        }
        for (const p of parsed) {
            if (!p.code || !p.name) {
                setError('Every product needs at least "code" and "name" fields.');
                return;
            }
        }
        if (parsed.length > 300) {
            setError("Maximum 300 products per request.");
            return;
        }

        setLoading(true); setElapsed(0);
        const t0 = Date.now();
        timerRef.current = setInterval(() => setElapsed(((Date.now() - t0) / 1000)), 100);

        try {
            const res = await fetch("/nextapi/categorize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ exportId, products: parsed }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || data.error || "Request failed");
            setResults(data.results || []);
            toast(`Categorized ${(data.results || []).length} products`, "success");
        } catch (e) {
            setError(e.message);
            toast(e.message, "error");
        } finally {
            clearInterval(timerRef.current);
            setElapsed(((Date.now() - t0) / 1000));
            setLoading(false);
        }
    };

    const copyResults = () => {
        navigator.clipboard.writeText(JSON.stringify(results, null, 2));
        toast("Copied to clipboard", "success");
    };

    const downloadResults = () => {
        const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `categorized-${exportId}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    return (
        <div className="space-y-5">
            {/* Info banner */}
            <div className={`${S.card} p-5`}>
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 ring-1 ring-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white mb-1">AI Categorization Playground</p>
                        <p className="text-xs text-neutral-500 leading-relaxed">
                            Paste a JSON array of third-party products below and categorize them against this export's category set.
                            Nothing is saved — results are returned directly. Max 300 products per request.
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />Export ID
                            </span>
                            <code className="text-[11px] font-mono text-[#01a0be] bg-[#01a0be]/[0.06] px-2 py-0.5 rounded-md ring-1 ring-[#01a0be]/15 select-all cursor-text">{exportId}</code>
                        </div>
                    </div>
                </div>
            </div>

            {/* Input area */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className={S.label}>Product JSON</label>
                    <button onClick={loadSample} className="text-[11px] text-neutral-600 hover:text-[#01a0be] transition-colors">
                        Load sample
                    </button>
                </div>
                <div className="relative">
                    <textarea
                        rows={12}
                        value={input}
                        onChange={e => { setInput(e.target.value); setError(""); }}
                        placeholder={placeholder}
                        className={`${S.input} font-mono text-xs leading-relaxed resize-none ${error ? "ring-red-500/40 focus:ring-red-500/60" : ""}`}
                    />
                    {input && (
                        <button onClick={() => { setInput(""); setResults(null); setError(""); }}
                            className="absolute top-3 right-3 text-neutral-600 hover:text-neutral-400 transition-colors">
                            <Ic.X />
                        </button>
                    )}
                </div>
                {error && (
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/[0.06] ring-1 ring-red-500/15 rounded-xl px-3.5 py-2.5">
                        <Ic.Warning />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {/* Run button */}
            <button onClick={run} disabled={loading || !input.trim()} className={`${S.btnPrimary} w-full justify-center py-3 text-sm`}>
                {loading ? (
                    <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-20" />
                            <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Categorizing... {elapsed.toFixed(1)}s
                    </>
                ) : (
                    <><Ic.Spark />Categorize Products</>
                )}
            </button>

            {/* Loading overlay */}
            {loading && (
                <div className={`${S.card} overflow-hidden`}>
                    <div className="p-8 flex flex-col items-center gap-5">
                        {/* Animated orbs */}
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 rounded-full bg-[#01a0be]/20 animate-ping" style={{ animationDuration: "1.5s" }} />
                            <div className="absolute inset-2 rounded-full bg-[#01a0be]/15 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.3s" }} />
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#01a0be]/30 to-violet-500/20 flex items-center justify-center backdrop-blur-sm ring-1 ring-[#01a0be]/20">
                                <Ic.Spark />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-white mb-1">AI is analyzing your products...</p>
                            <p className="text-xs text-neutral-500">Processing with Gemini 2.5 Flash in batches of 30</p>
                        </div>
                        {/* Progress shimmer */}
                        <div className="w-full max-w-xs h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                            <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-[#01a0be] to-transparent animate-shimmer"
                                style={{ animation: "shimmer 1.5s ease-in-out infinite" }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Results */}
            {results && !loading && (
                <div className="space-y-3 animate-in">
                    {/* Results header */}
                    <div className={`${S.card} p-4`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/30" />
                                    <span className="text-sm font-medium text-white">{results.length} categorized</span>
                                </div>
                                <span className="text-xs text-neutral-600">in {elapsed.toFixed(1)}s</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={copyResults} className={S.btnOutline}>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    Copy
                                </button>
                                <button onClick={downloadResults} className={S.btnOutline}>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results table */}
                    <div className={`${S.card} overflow-hidden`}>
                        <div className="grid grid-cols-[auto_1fr_2fr] gap-x-4 px-4 py-2.5 border-b border-white/[0.05]">
                            {["Code", "Category", "Category ID"].map(h => <span key={h} className={S.label}>{h}</span>)}
                        </div>
                        <div className="max-h-[420px] overflow-y-auto">
                            {results.map((r, i) => (
                                <div key={`${r.code}-${i}`}
                                    className="grid grid-cols-[auto_1fr_2fr] gap-x-4 px-4 py-3 items-center border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-all"
                                    style={{ animation: `fadeSlideIn 0.3s ease-out ${i * 0.03}s both` }}>
                                    <span className="text-xs text-neutral-400 font-mono">{r.code}</span>
                                    <span className="text-sm text-white truncate">{r.categoryName}</span>
                                    <span className="text-xs text-neutral-600 font-mono truncate">{r.categoryId}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Raw JSON toggle */}
                    <details className={`${S.card} group`}>
                        <summary className="px-4 py-3 text-xs text-neutral-500 hover:text-neutral-300 cursor-pointer transition-colors flex items-center gap-2 select-none">
                            <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                            Raw JSON response
                        </summary>
                        <pre className="px-4 pb-4 text-xs text-neutral-400 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                            {JSON.stringify(results, null, 2)}
                        </pre>
                    </details>
                </div>
            )}

            {/* ── API Reference ─────────────────────────────────────────────── */}
            <div className={`${S.card} overflow-hidden`}>
                <button onClick={() => setApiDocsOpen(o => !o)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left group hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 ring-1 ring-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">API Reference</p>
                            <p className="text-[11px] text-neutral-600">Use this endpoint from your own code or third-party services</p>
                        </div>
                    </div>
                    <svg className={`w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-all ${apiDocsOpen ? "rotate-180" : ""}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {apiDocsOpen && (
                    <div className="px-5 pb-6 space-y-5 border-t border-white/[0.05]">

                        {/* Endpoint */}
                        <div className="pt-5">
                            <p className={`${S.label} mb-2`}>Endpoint</p>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold tracking-wider ring-1 ring-emerald-500/20">POST</span>
                                <code className="text-sm font-mono text-neutral-300 select-all">/api/export/webhooks/categorize</code>
                            </div>
                        </div>

                        {/* Auth */}
                        <div>
                            <p className={`${S.label} mb-2`}>Authentication</p>
                            <div className="bg-white/[0.02] rounded-xl ring-1 ring-white/[0.06] p-3.5">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                    <span className="text-xs text-neutral-300 font-medium">x-api-key header</span>
                                </div>
                                <p className="text-[11px] text-neutral-500 leading-relaxed">
                                    Pass your <code className="text-neutral-400 bg-white/[0.04] px-1 rounded">WEBHOOK_API_KEY</code> in the <code className="text-neutral-400 bg-white/[0.04] px-1 rounded">x-api-key</code> request header.
                                </p>
                            </div>
                        </div>

                        {/* Request body */}
                        <div>
                            <p className={`${S.label} mb-2`}>Request Body</p>
                            <div className="bg-neutral-900/80 rounded-xl ring-1 ring-white/[0.06] overflow-hidden">
                                <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/[0.04]">
                                    <span className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">JSON</span>
                                    <button onClick={() => {
                                        navigator.clipboard.writeText(JSON.stringify({ exportId, products: [{ code: "SKU-001", name: "Product Name", description: "Optional description" }] }, null, 2));
                                        toast("Copied", "success");
                                    }} className="text-[10px] text-neutral-600 hover:text-[#01a0be] transition-colors flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        Copy
                                    </button>
                                </div>
                                <pre className="p-3.5 text-xs font-mono text-neutral-400 leading-relaxed overflow-x-auto">{`{
  "exportId": "${exportId}",
  "products": [
    {
      "code": "SKU-001",
      "name": "Product Name",
      "description": "Optional description",
      "brand": "Optional brand",
      "tags": ["optional", "tags"]
    }
  ]
}`}</pre>
                            </div>
                        </div>

                        {/* Product fields table */}
                        <div>
                            <p className={`${S.label} mb-2`}>Product Fields</p>
                            <div className="bg-white/[0.02] rounded-xl ring-1 ring-white/[0.06] overflow-hidden">
                                <div className="grid grid-cols-[100px_60px_1fr] gap-x-3 px-3.5 py-2 border-b border-white/[0.06]">
                                    {["Field", "Required", "Description"].map(h => <span key={h} className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">{h}</span>)}
                                </div>
                                {[
                                    ["code", true, "Unique product identifier (used to match results)"],
                                    ["name", true, "Product name — primary text the AI uses"],
                                    ["description", false, "Product description — improves accuracy"],
                                    ["brand", false, "Brand name"],
                                    ["tags", false, "Array of keywords/tags"],
                                    ["price", false, "Price (helps disambiguate categories)"],
                                    ["child_products", false, "Variants — AI reads for context but only categorizes parent"],
                                ].map(([field, req, desc]) => (
                                    <div key={field} className="grid grid-cols-[100px_60px_1fr] gap-x-3 px-3.5 py-2.5 border-b border-white/[0.03] last:border-0 items-center">
                                        <code className="text-xs font-mono text-[#01a0be]">{field}</code>
                                        <span>{req
                                            ? <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/10 text-red-400 ring-1 ring-red-500/15">YES</span>
                                            : <span className="text-[10px] text-neutral-700">no</span>
                                        }</span>
                                        <span className="text-[11px] text-neutral-500">{desc}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[11px] text-neutral-600 mt-2 leading-relaxed">
                                You can include any additional fields on each product — the AI receives the full object, so more context means better categorization.
                            </p>
                        </div>

                        {/* Response */}
                        <div>
                            <p className={`${S.label} mb-2`}>Response</p>
                            <div className="bg-neutral-900/80 rounded-xl ring-1 ring-white/[0.06] overflow-hidden">
                                <div className="px-3.5 py-2 border-b border-white/[0.04]">
                                    <span className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">200 OK</span>
                                </div>
                                <pre className="p-3.5 text-xs font-mono text-neutral-400 leading-relaxed overflow-x-auto">{`{
  "results": [
    {
      "code": "SKU-001",
      "categoryId": "683a1f2e...",
      "categoryName": "Electronics / Audio"
    }
  ]
}`}</pre>
                            </div>
                        </div>

                        {/* curl example */}
                        <div>
                            <p className={`${S.label} mb-2`}>curl Example</p>
                            <div className="bg-neutral-900/80 rounded-xl ring-1 ring-white/[0.06] overflow-hidden">
                                <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/[0.04]">
                                    <span className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wider">Shell</span>
                                    <button onClick={() => {
                                        navigator.clipboard.writeText(`curl -X POST https://your-server.com/api/export/webhooks/categorize \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -d '{"exportId":"${exportId}","products":[{"code":"P1","name":"Example Product"}]}'`);
                                        toast("Copied", "success");
                                    }} className="text-[10px] text-neutral-600 hover:text-[#01a0be] transition-colors flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        Copy
                                    </button>
                                </div>
                                <pre className="p-3.5 text-xs font-mono text-neutral-400 leading-relaxed overflow-x-auto whitespace-pre-wrap">{`curl -X POST https://your-server.com/api/export/webhooks/categorize \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "exportId": "${exportId}",
    "products": [
      {"code": "P1", "name": "Example Product", "description": "..."}
    ]
  }'`}</pre>
                            </div>
                        </div>

                        {/* Limits / notes */}
                        <div>
                            <p className={`${S.label} mb-2`}>Limits &amp; Notes</p>
                            <div className="space-y-2">
                                {[
                                    ["300", "Max products per request"],
                                    ["30", "Internal batch size (products per AI call)"],
                                    ["Sync", "Response is synchronous — wait for the full result"],
                                    ["Stateless", "Nothing is saved to the database"],
                                ].map(([val, desc]) => (
                                    <div key={val} className="flex items-center gap-3 text-xs">
                                        <span className="px-2 py-0.5 rounded-md bg-white/[0.04] ring-1 ring-white/[0.06] text-neutral-300 font-mono font-medium shrink-0 min-w-[60px] text-center">{val}</span>
                                        <span className="text-neutral-500">{desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Error codes */}
                        <div>
                            <p className={`${S.label} mb-2`}>Error Responses</p>
                            <div className="bg-white/[0.02] rounded-xl ring-1 ring-white/[0.06] overflow-hidden">
                                {[
                                    ["400", "Missing fields, empty products, or exceeds 300 limit"],
                                    ["401", "Missing or invalid x-api-key"],
                                    ["500", "No categories for this exportId, or AI processing error"],
                                ].map(([code, desc]) => (
                                    <div key={code} className="flex items-center gap-3 px-3.5 py-2.5 border-b border-white/[0.03] last:border-0">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ring-1 ${
                                            code === "400" ? "bg-amber-500/10 text-amber-400 ring-amber-500/15"
                                            : code === "401" ? "bg-red-500/10 text-red-400 ring-red-500/15"
                                            : "bg-red-500/10 text-red-400 ring-red-500/15"
                                        }`}>{code}</span>
                                        <span className="text-[11px] text-neutral-500">{desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(400%); }
                }
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-in {
                    animation: fadeSlideIn 0.4s ease-out;
                }
            `}</style>
        </div>
    );
}

// ─── ExportSelector ───────────────────────────────────────────────────────────

function ExportSelector({ exports, selected, onSelect, onCreateEdit, onDelete }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 320 });
    const btnRef = useRef(null);
    const menuRef = useRef(null);

    const openDrop = () => {
        const r = btnRef.current?.getBoundingClientRect();
        if (r) setPos({ top: r.bottom + window.scrollY + 6, left: r.left + window.scrollX, width: Math.max(r.width, 320) });
        setOpen(true);
    };

    useEffect(() => {
        if (!open) return;
        const h = e => { if (!btnRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [open]);

    return (
        <div className="flex items-center gap-2">
            <button ref={btnRef} onClick={openDrop}
                className={`flex items-center justify-between gap-3 flex-1 max-w-sm px-4 py-3 rounded-2xl ring-1 text-left transition-all
                    ${open ? "ring-[#01a0be]/40 bg-white/[0.06]" : "ring-white/[0.08] bg-white/[0.03] hover:ring-white/[0.14] hover:bg-white/[0.05]"}`}>
                {selected ? (
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-[#01a0be]/10 flex items-center justify-center text-[#01a0be] shrink-0">
                            <Ic.Tag />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{selected.name}</p>
                            {selected.description && <p className="text-xs text-neutral-600 truncate">{selected.description}</p>}
                        </div>
                        {selected.aiCategorizationEnabled && (
                            <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-[#01a0be]/10 text-[#01a0be] ring-1 ring-[#01a0be]/20 shrink-0">AI</span>
                        )}
                    </div>
                ) : (
                    <span className="text-sm text-neutral-600">Select export…</span>
                )}
                <div className={`text-neutral-500 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}><Ic.Chevron /></div>
            </button>

            {selected && (
                <button onClick={() => onCreateEdit(selected)}
                    className={`${S.btnOutline} w-10 h-10 px-0 justify-center rounded-xl shrink-0`} title="Edit export">
                    <Ic.Settings />
                </button>
            )}
            <button onClick={() => onCreateEdit(null)}
                className={`${S.btnPrimary} h-10 shrink-0 rounded-xl`}>
                <Ic.Plus />New
            </button>

            {open && (
                <div ref={menuRef} style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
                    className="z-[9980] bg-neutral-950 ring-1 ring-white/[0.1] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden py-1.5">
                    {exports.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-neutral-600 text-center">No exports yet</p>
                    ) : exports.map(exp => (
                        <div key={exp._id} className={`group flex items-center gap-2 px-2 mx-1.5 py-2 rounded-xl transition-colors cursor-pointer
                            ${selected?._id === exp._id ? "bg-[#01a0be]/8" : "hover:bg-white/[0.04]"}`}>
                            <button className="flex items-center gap-3 flex-1 min-w-0 text-left" onClick={() => { onSelect(exp); setOpen(false); }}>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${selected?._id === exp._id ? "bg-[#01a0be]/15 text-[#01a0be]" : "bg-white/[0.04] text-neutral-600 group-hover:text-neutral-400"}`}>
                                    <Ic.Tag />
                                </div>
                                <div className="min-w-0">
                                    <p className={`text-sm font-medium truncate ${selected?._id === exp._id ? "text-[#01a0be]" : "text-neutral-200"}`}>{exp.name}</p>
                                    {exp.description && <p className="text-xs text-neutral-600 truncate">{exp.description}</p>}
                                </div>
                                {exp.aiCategorizationEnabled && (
                                    <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#01a0be]/10 text-[#01a0be] ring-1 ring-[#01a0be]/20 shrink-0">AI</span>
                                )}
                            </button>
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button onClick={e => { e.stopPropagation(); setOpen(false); onCreateEdit(exp); }} className={`${S.iconBtn} text-neutral-600 hover:text-[#01a0be] hover:bg-[#01a0be]/10`}><Ic.Pencil /></button>
                                <button onClick={e => { e.stopPropagation(); setOpen(false); onDelete(exp); }} className={`${S.iconBtn} text-neutral-600 hover:text-red-400 hover:bg-red-500/10`}><Ic.Trash /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CategoriesPage({ initialExports }) {
    const [exports, setExports] = useState(initialExports);
    const [selected, setSelected] = useState(null);
    const [tab, setTab] = useState("categories");
    const [toasts, setToasts] = useState([]);
    const [exportForm, setExportForm] = useState({ open: false, initial: null });
    const [confirm, setConfirm] = useState(null);

    const toast = useCallback((message, type = "info") => {
        const id = Date.now() + Math.random();
        setToasts(p => [...p, { id, message, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
    }, []);

    const onExportSaved = (saved, isEdit) => {
        if (isEdit) {
            setExports(p => p.map(e => e._id === saved._id ? saved : e));
            if (selected?._id === saved._id) setSelected(saved);
            toast("Export updated", "success");
        } else {
            setExports(p => [...p, saved]);
            setSelected(saved); setTab("categories");
            toast("Export created", "success");
        }
    };

    const onDeleteExport = exp => setConfirm({
        title: "Delete Export", danger: true, confirmLabel: "Delete",
        message: `Delete "${exp.name}"? Categories and product assignments are kept.`,
        onConfirm: async () => {
            setConfirm(null);
            try {
                const d = await (await fetch(`/nextapi/exports/${exp._id}`, { method: "DELETE" })).json();
                if (!d.success) throw new Error(d.message);
                setExports(p => p.filter(e => e._id !== exp._id));
                if (selected?._id === exp._id) setSelected(null);
                toast("Export deleted", "success");
            } catch (e) { toast(e.message, "error"); }
        }
    });

    const tabs = [
        { key: "categories", label: "Categories", icon: <Ic.Tag /> },
        { key: "products", label: "Products", icon: <Ic.Cube /> },
        { key: "playground", label: "Playground", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> },
    ];

    return (
        <>
            <Toast toasts={toasts} />
            <ConfirmModal open={!!confirm} {...confirm} onCancel={() => setConfirm(null)} />
            <ExportFormModal open={exportForm.open} initial={exportForm.initial}
                onClose={() => setExportForm({ open: false, initial: null })} onSave={onExportSaved} />

            <div className="space-y-8 pb-16">
                {/* Compact header — small icon + title on one line, matching the Export / Shopify pages. */}
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#01a0be]/30 bg-[#01a0be]/10 text-[#01a0be]">
                        <Ic.Tag />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold tracking-tight text-white">Category Management</h1>
                        <p className="truncate text-xs text-neutral-500">Define categories, manage AI assignments and manually override product categorizations.</p>
                    </div>
                </div>

                {/* Export selector */}
                <ExportSelector
                    exports={exports}
                    selected={selected}
                    onSelect={exp => { setSelected(exp); setTab("categories"); }}
                    onCreateEdit={exp => setExportForm({ open: true, initial: exp })}
                    onDelete={onDeleteExport}
                />

                {/* Empty state */}
                {!selected ? (
                    <div className="rounded-3xl ring-1 ring-white/[0.06] bg-white/[0.01] py-28 flex flex-col items-center gap-5">
                        <div className="w-16 h-16 rounded-3xl bg-white/[0.03] ring-1 ring-white/[0.06] flex items-center justify-center text-neutral-700">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2zM17 17h.01M17 13h-2a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2zM7 13H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2z" /></svg>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-neutral-300">No export selected</p>
                            <p className="text-xs text-neutral-600 mt-1">Pick one above or create a new export configuration</p>
                        </div>
                        <button onClick={() => setExportForm({ open: true, initial: null })} className={S.btnPrimary}>
                            <Ic.Plus />Create Export
                        </button>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* Tabs */}
                        <div className="flex gap-1 p-1 bg-white/[0.03] ring-1 ring-white/[0.06] rounded-2xl w-fit">
                            {tabs.map(t => (
                                <button key={t.key} onClick={() => setTab(t.key)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                                        ${tab === t.key
                                            ? "bg-[#01a0be] text-white shadow-lg shadow-[#01a0be]/25"
                                            : "text-neutral-500 hover:text-neutral-200"}`}>
                                    {t.icon}{t.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab content */}
                        {tab === "categories" && <CategoriesTab key={selected._id} exportId={selected._id} toast={toast} />}
                        {tab === "products" && <ProductsTab key={selected._id} exportId={selected._id} toast={toast} />}
                        {tab === "playground" && <PlaygroundTab key={selected._id} exportId={selected._id} toast={toast} />}
                    </div>
                )}
            </div>
        </>
    );
}
