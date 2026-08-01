'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const queryClient = useQueryClient();

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-users', page, searchTerm],
    queryFn: async () => {
      const res = await api.get(`/admin/users?page=${page}&limit=20&search=${searchTerm}`);
      return res.data.data;
    },
    retry: 1,
  });

  const users = data?.users || [];
  const totalPages = data?.pagination?.pages || 1;
  const totalUsers = data?.pagination?.total || 0;
  const stats = data?.stats || {};

  const handleToggleActive = async (user) => {
    try {
      const newStatus = user.is_active ? 0 : 1;
      await api.put(`/admin/users/${user.id}/status`, { is_active: newStatus });
      toast.success(`User ${newStatus ? 'activated' : 'suspended'}`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update user.'); }
  };

  const handleDelete = async (user) => {
    try {
      await api.delete(`/admin/users/${user.id}`);
      toast.success(`User "${user.name}" deleted.`);
      setConfirmDelete(null);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete user.'); }
  };

  const ROLE_STYLES = {
    admin: 'bg-purple-50 text-purple-700 border-purple-200',
    seller: 'bg-blue-50 text-blue-700 border-blue-200',
    customer: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div><Skeleton className="w-24 h-8 mb-1" /><Skeleton className="w-20 h-4" /></div>
          <Skeleton className="w-48 h-10 rounded-lg" />
        </div>
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="p-5 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-7 h-7 rounded-full" />
                <div className="flex-1"><Skeleton className="w-32 h-4 mb-1" /><Skeleton className="w-40 h-3" /></div>
                <Skeleton className="w-16 h-4" />
                <Skeleton className="w-12 h-5 rounded-full" />
                <Skeleton className="w-16 h-3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <div className="bg-white rounded-xl border border-rose-100 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Failed to load users</span>
            <button onClick={() => refetch()} className="text-xs font-medium text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">{totalUsers} total user{totalUsers !== 1 ? 's' : ''}</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search users..."
            className="w-full sm:w-64 pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(''); setSearchTerm(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-all">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Live stats — from GET /admin/users (stats), all DB-driven */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500">Total Users</p>
              <p className="text-xl font-bold text-slate-900 leading-tight">{stats.total ?? totalUsers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500">Active</p>
              <p className="text-xl font-bold text-slate-900 leading-tight">{stats.active ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500">Suspended</p>
              <p className="text-xl font-bold text-slate-900 leading-tight">{stats.suspended ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500">Logged in 24h</p>
              <p className="text-xl font-bold text-slate-900 leading-tight">{stats.logged_in_24h ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500">Admins</p>
              <p className="text-xl font-bold text-slate-900 leading-tight">{stats.admins ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-600">{searchTerm ? 'No users matching your search' : 'No users yet'}</span>
            {searchTerm && <button onClick={() => { setSearchInput(''); setSearchTerm(''); }} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors">Clear search</button>}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider hidden sm:table-cell">Email</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider hidden md:table-cell">Joined</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell">Last Login</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          u.role === 'seller' ? 'bg-blue-100 text-blue-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {u.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium text-slate-900 text-sm block truncate max-w-[150px]">{u.name}</span>
                          <span className="text-[10px] text-slate-400 block sm:hidden">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden sm:table-cell">
                      <span className="truncate max-w-[200px] block">{u.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold border capitalize ${ROLE_STYLES[u.role] || ROLE_STYLES.customer}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">
                      {u.last_login
                        ? new Date(u.last_login).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                            u.is_active ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                        >
                          {u.is_active ? 'Suspend' : 'Activate'}
                        </button>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => setConfirmDelete(u)}
                            className="px-2.5 py-1 rounded-md text-[10px] font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${page === p ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'}`}>{p}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Delete User</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 mb-2">Are you sure you want to delete <strong>{confirmDelete.name}</strong>?</p>
            <p className="text-xs text-slate-500 mb-5">{confirmDelete.email}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-rose-500 hover:bg-rose-600 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
