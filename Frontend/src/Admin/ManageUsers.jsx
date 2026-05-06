import React, { useEffect, useState } from "react";
import { useAuth } from "../Components/AuthContext";

export default function ManageUsers() {
  const { auth } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "teacher",
  });

  // FIXED: use auth.token from context, not localStorage directly
  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${auth.token}`,
  });

  const loadUsers = async () => {
    setLoading(true);
    // FIXED: was /api/admin/users — correct URL is /api/superadmin/users
    const res = await fetch("/api/superadmin/users", {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/superadmin/users", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(form),
    });
    const data = await res.json();
    alert(data.message || (res.ok ? "User created" : "Failed"));
    if (res.ok) {
      setForm({ username: "", email: "", password: "", role: "teacher" });
      loadUsers();
    }
  };

  const deactivate = async (id) => {
    if (!confirm("Deactivate this user?")) return;
    const res = await fetch(`/api/superadmin/users/${id}/deactivate`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    if (res.ok) loadUsers();
  };

  // NEW: activate a deactivated user
  const activate = async (id) => {
    const res = await fetch(`/api/superadmin/users/${id}/activate`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    if (res.ok) loadUsers();
  };

  // NEW: permanently delete a user
  const deleteUser = async (id) => {
    if (!confirm("Permanently delete this user? This cannot be undone.")) return;
    const res = await fetch(`/api/superadmin/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    if (res.ok) loadUsers();
  };

  const roleBadge = (role) => {
    const colors = {
      superadmin: "bg-purple-100 text-purple-800",
      teacher: "bg-blue-100 text-blue-800",
      student: "bg-stone-100 text-stone-700",
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${colors[role] || "bg-stone-100"}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Create User Form */}
      <form
        onSubmit={handleCreate}
        className="bg-white p-4 rounded-lg border grid grid-cols-1 md:grid-cols-5 gap-3"
      >
        <input
          className="border p-2 rounded col-span-1"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <input
          className="border p-2 rounded col-span-1"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          className="border p-2 rounded col-span-1"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <select
          className="border p-2 rounded col-span-1"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
        <button className="md:col-span-1 bg-stone-900 text-white py-2 rounded hover:bg-stone-800">
          Create User
        </button>
      </form>

      {/* Users Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <p className="p-4 text-stone-500">Loading users...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-stone-100">
              <tr>
                <th className="text-left p-3 font-semibold">Name</th>
                <th className="text-left p-3 font-semibold">Email</th>
                <th className="text-left p-3 font-semibold">Role</th>
                <th className="text-left p-3 font-semibold">Status</th>
                <th className="text-left p-3 font-semibold">Joined</th>
                <th className="text-left p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t hover:bg-stone-50">
                  <td className="p-3 font-medium">{u.username}</td>
                  <td className="p-3 text-stone-600">{u.email}</td>
                  <td className="p-3">{roleBadge(u.role)}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        u.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 text-stone-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    {u.role !== "superadmin" && (
                      <div className="flex gap-2">
                        {u.isActive ? (
                          <button
                            onClick={() => deactivate(u._id)}
                            className="px-3 py-1 bg-amber-100 text-amber-800 rounded text-xs hover:bg-amber-200"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => activate(u._id)}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs hover:bg-green-200"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          onClick={() => deleteUser(u._id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-stone-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
