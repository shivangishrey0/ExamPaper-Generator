import React, { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../api";
import { useToast } from "../Components/Toast";
import { useConfirm } from "../Components/ConfirmDialog";
import Pagination from "../Components/Pagination";
import { TableRowSkeleton } from "../Components/LoadingSkeleton";

const LIMIT = 8;

export default function ManageUsers() {
  const { success, error: toastError } = useToast();
  const confirmDialog = useConfirm();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  // cursorStack[i] = the cursor to fetch page (i+1); cursorStack[0] is always
  // null (first page, no cursor). pageIndex is 0-based; page shown to the
  // user is pageIndex + 1.
  const [cursorStack, setCursorStack] = useState([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const page = pageIndex + 1;

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Form — no password field anymore
  const [form, setForm] = useState({ username: "", email: "", role: "teacher" });
  const [creating, setCreating] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const cursor = cursorStack[pageIndex];
    const params = new URLSearchParams({
      limit: LIMIT,
      ...(cursor && { cursor }),
      ...(search && { search }),
      ...(roleFilter && { role: roleFilter }),
    });
    const res = await apiFetch(`/api/superadmin/users?${params}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
      setHasMore(data.hasMore);
      if (data.hasMore && cursorStack.length === pageIndex + 1) {
        setCursorStack((prev) => [...prev, data.nextCursor]);
      }
    }
    setLoading(false);
  }, [pageIndex, cursorStack, search, roleFilter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const resetPaging = () => { setCursorStack([null]); setPageIndex(0); };

  const applySearch = () => { setSearch(searchInput.trim()); resetPaging(); };

  const handleRoleFilter = (r) => { setRoleFilter(r); resetPaging(); };

  const goPrev = () => setPageIndex((i) => Math.max(0, i - 1));
  const goNext = () => { if (hasMore) setPageIndex((i) => i + 1); };

  const handleInvite = async (e) => {
    e.preventDefault();
    setCreating(true);
    const res = await apiFetch(`/api/superadmin/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      success(data.message);
      setForm({ username: "", email: "", role: "teacher" });
      resetPaging(); // cursorStack reference change re-triggers the fetch effect
    } else {
      toastError(data.message);
    }
    setCreating(false);
  };

  const resendInvite = async (id) => {
    const res = await apiFetch(`/api/superadmin/users/${id}/resend-invite`, { method: "POST" });
    const data = await res.json();
    if (res.ok) success(data.message);
    else toastError(data.message);
  };

  const deactivate = async (id) => {
    const ok = await confirmDialog("Deactivate this user? They will be logged out immediately.", { title: "Deactivate user" });
    if (!ok) return;
    await apiFetch(`/api/superadmin/users/${id}/deactivate`, { method: "PATCH" });
    loadUsers();
  };

  const activate = async (id) => {
    await apiFetch(`/api/superadmin/users/${id}/activate`, { method: "PATCH" });
    loadUsers();
  };

  const deleteUser = async (id) => {
    const ok = await confirmDialog("Permanently delete this user? This cannot be undone.", { title: "Delete user", danger: true, confirmLabel: "Delete" });
    if (!ok) return;
    await apiFetch(`/api/superadmin/users/${id}`, { method: "DELETE" });
    if (users.length === 1 && pageIndex > 0) goPrev();
    else loadUsers();
  };

  const roleBadge = (role) => {
    const map = {
      superadmin: "bg-purple-100 text-purple-800",
      teacher: "bg-blue-100 text-blue-800",
      student: "bg-stone-100 text-stone-700",
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${map[role] || ""}`}>
        {role}
      </span>
    );
  };

  const statusBadge = (user) => {
    if (!user.isVerified) {
      // Check if invite is expired
      const expired = user.inviteExpiry && user.inviteExpiry < Date.now();
      return (
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
          expired ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
        }`}>
          {expired ? "Invite expired" : "Pending invite"}
        </span>
      );
    }
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
        user.isActive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"
      }`}>
        {user.isActive ? "Active" : "Inactive"}
      </span>
    );
  };

  return (
    <div className="space-y-5">

      {/* Invite Form — no password field */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-sm font-semibold text-stone-700 mb-3">
          <i className="ti ti-mail-forward mr-1" aria-hidden="true" />
          Send Invite
        </h3>
        <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            className="border p-2 rounded text-sm"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
          <input
            className="border p-2 rounded text-sm"
            placeholder="Email address"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <select
            className="border p-2 rounded text-sm"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
          <button
            disabled={creating}
            className="bg-stone-900 text-white py-2 rounded text-sm hover:bg-stone-800 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <i className="ti ti-send" aria-hidden="true" />
            {creating ? "Sending..." : "Send Invite"}
          </button>
        </form>
        <p className="text-xs text-stone-400 mt-2">
          An email with a password setup link will be sent. Link expires in 24 hours.
        </p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 flex-1 min-w-[200px]">
          <input
            className="border p-2 rounded flex-1 text-sm"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
          />
          <button onClick={applySearch}
            className="px-3 py-2 bg-stone-900 text-white rounded text-sm hover:bg-stone-800">
            Search
          </button>
          {search && (
            <button onClick={() => { setSearch(""); setSearchInput(""); resetPaging(); }}
              className="px-3 py-2 border rounded text-sm hover:bg-stone-50">
              Clear
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {["", "teacher", "student"].map((r) => (
            <button key={r} onClick={() => handleRoleFilter(r)}
              className={`px-3 py-1.5 rounded text-xs font-medium capitalize border transition-colors ${
                roleFilter === r
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
              }`}>
              {r === "" ? "All" : r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-2.5 border-b bg-stone-50 flex justify-between items-center">
          <span className="text-sm text-stone-500">
            {loading ? "Loading..." : `${total} user${total !== 1 ? "s" : ""}`}
            {search && <span className="ml-1 text-stone-400">for "{search}"</span>}
          </span>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-stone-100">
            <tr>
              <th className="text-left p-3 font-semibold text-stone-600">#</th>
              <th className="text-left p-3 font-semibold text-stone-600">Name</th>
              <th className="text-left p-3 font-semibold text-stone-600">Email</th>
              <th className="text-left p-3 font-semibold text-stone-600">Role</th>
              <th className="text-left p-3 font-semibold text-stone-600">Status</th>
              <th className="text-left p-3 font-semibold text-stone-600">Joined</th>
              <th className="text-left p-3 font-semibold text-stone-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableRowSkeleton rows={LIMIT} columns={7} />
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-stone-400">No users found.</td>
              </tr>
            ) : (
              users.map((u, idx) => (
                <tr key={u._id} className="border-t hover:bg-stone-50">
                  <td className="p-3 text-stone-400 text-xs">{(page - 1) * LIMIT + idx + 1}</td>
                  <td className="p-3 font-medium">{u.username}</td>
                  <td className="p-3 text-stone-500">{u.email}</td>
                  <td className="p-3">{roleBadge(u.role)}</td>
                  <td className="p-3">{statusBadge(u)}</td>
                  <td className="p-3 text-stone-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    {u.role !== "superadmin" && (
                      <div className="flex gap-1.5 flex-wrap">
                        {/* Resend invite — only for pending users */}
                        {!u.isVerified && (
                          <button onClick={() => resendInvite(u._id)}
                            className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs hover:bg-amber-100">
                            Resend invite
                          </button>
                        )}
                        {/* Activate / Deactivate — only for verified users */}
                        {u.isVerified && (
                          u.isActive ? (
                            <button onClick={() => deactivate(u._id)}
                              className="px-2 py-1 bg-stone-50 text-stone-700 border border-stone-200 rounded text-xs hover:bg-stone-100">
                              Deactivate
                            </button>
                          ) : (
                            <button onClick={() => activate(u._id)}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs hover:bg-emerald-100">
                              Activate
                            </button>
                          )
                        )}
                        <button onClick={() => deleteUser(u._id)}
                          className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs hover:bg-red-100">
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && (
          <Pagination
            page={page}
            total={total}
            limit={LIMIT}
            hasPrev={pageIndex > 0}
            hasMore={hasMore}
            onPrev={goPrev}
            onNext={goNext}
            className="px-4 py-3 border-t bg-stone-50"
          />
        )}
      </div>
    </div>
  );
}
