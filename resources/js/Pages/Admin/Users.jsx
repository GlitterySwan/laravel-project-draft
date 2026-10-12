import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, X, Copy, Check, KeyRound, Pencil, Trash2, Power, ChevronDown, Building2, Search, Filter } from 'lucide-react';

const ROLE_LABELS = {
    super_admin: 'Super Admin',
    facility_admin: 'Facility Admin',
    user: 'User',
};

const ROLE_STYLES = {
    super_admin: 'bg-purple-50 text-purple-700 ring-purple-600/20',
    facility_admin: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    user: 'bg-gray-100 text-gray-600 ring-gray-500/20',
};

function RoleBadge({ role }) {
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${ROLE_STYLES[role] ?? ROLE_STYLES.user}`}>
            {ROLE_LABELS[role] ?? role}
        </span>
    );
}

function StatusBadge({ isActive }) {
    return isActive ? (
        <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-600/20">
            Active
        </span>
    ) : (
        <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-gray-100 text-gray-500 ring-gray-500/20">
            Disabled
        </span>
    );
}

function AddUserModal({ facilities = [], onClose }) {
    const [form, setForm] = useState({ name: '', email: '', role: 'facility_admin', assigned_facility_ids: [] });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(route('admin.users.store'), form, {
            preserveScroll: true,
            onSuccess: () => onClose(),
            onError: (errors) => toast.error(Object.values(errors)[0] || 'Failed to create user.'),
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
                    <h2 className="font-bold text-gray-900">Add User</h2>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
                    <input type="text" required placeholder="Full name" value={form.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        className="block w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-400" />
                    <input type="email" required placeholder="Email address" value={form.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className="block w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-400" />
                    <select value={form.role} onChange={(e) => updateField('role', e.target.value)}
                        className="block w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-400">
                        <option value="facility_admin">Facility Admin</option>
                        <option value="user">User</option>
                        <option value="super_admin">Super Admin</option>
                    </select>
                    {form.role === 'facility_admin' && (
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Assigned Facilities</label>
                            <select
                                multiple
                                value={form.assigned_facility_ids}
                                onChange={(e) => updateField('assigned_facility_ids', Array.from(e.target.selectedOptions, (option) => Number(option.value)))}
                                className="block w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-400 min-h-28"
                            >
                                {facilities.map((facility) => (
                                    <option key={facility.id} value={facility.id}>{facility.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-400 mt-1">Select the facilities this admin should manage.</p>
                        </div>
                    )}
                    <p className="text-xs text-gray-400">
                        A temporary password will be generated automatically and shown once after creation.
                    </p>
                    <button type="submit" disabled={isSubmitting}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:bg-indigo-300">
                        {isSubmitting ? 'Creating…' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function EditUserModal({ user, facilities = [], onClose }) {
    const [form, setForm] = useState({ 
        name: user.name, 
        email: user.email, 
        assigned_facility_ids: user.assigned_facility_ids ?? [] 
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const toggleFacility = (facilityId) => {
        setForm((f) => {
            const current = f.assigned_facility_ids;
            const exists = current.includes(facilityId);
            return {
                ...f,
                assigned_facility_ids: exists
                    ? current.filter((id) => id !== facilityId)
                    : [...current, facilityId],
            };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.patch(route('admin.users.update', user.id), form, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('User details updated.');
                onClose();
            },
            onError: (errors) => toast.error(Object.values(errors)[0] || 'Failed to update user.'),
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
                    <h2 className="font-bold text-gray-900">Edit User</h2>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            placeholder="Full name"
                            value={form.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            className="block w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            placeholder="Email address"
                            value={form.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            className="block w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>

                    {user.role === 'facility_admin' && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-2">Assigned Facilities</label>
                            {facilities.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No facilities available.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 border border-gray-100 rounded-xl">
                                    {facilities.map((facility) => {
                                        const isSelected = form.assigned_facility_ids.includes(facility.id);
                                        return (
                                            <button
                                                key={facility.id}
                                                type="button"
                                                onClick={() => toggleFacility(facility.id)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                    isSelected
                                                        ? 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/30 font-semibold'
                                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 ring-1 ring-inset ring-gray-200'
                                                }`}
                                            >
                                                <Building2 className={`h-3.5 w-3.5 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
                                                {facility.name}
                                                {isSelected && <Check className="h-3 w-3 ml-0.5 text-indigo-600" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            <p className="text-xs text-gray-400 mt-1.5">Click to toggle facility permissions.</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:bg-indigo-300"
                    >
                        {isSubmitting ? 'Saving…' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function FacilityAssignmentModal({ user, facilities = [], onClose }) {
    const [selectedIds, setSelectedIds] = useState(user.assigned_facility_ids ?? []);
    const [isSaving, setIsSaving] = useState(false);

    const toggleFacility = (facilityId) => {
        setSelectedIds((prev) =>
            prev.includes(facilityId)
                ? prev.filter((id) => id !== facilityId)
                : [...prev, facilityId]
        );
    };

    const handleSave = () => {
        setIsSaving(true);
        router.patch(route('admin.users.update', user.id), {
            name: user.name,
            email: user.email,
            assigned_facility_ids: selectedIds,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`${user.name}'s facility assignments updated.`);
                onClose();
            },
            onError: (errors) => toast.error(Object.values(errors)[0] || 'Failed to update facility assignments.'),
            onFinish: () => setIsSaving(false),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                    <div>
                        <h2 className="font-bold text-gray-900">Manage Facility Assignments</h2>
                        <p className="text-xs text-gray-500 mt-0.5">{user.name} · {ROLE_LABELS[user.role] ?? user.role}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"><X className="h-5 w-5" /></button>
                </div>
                <div className="px-6 py-5">
                    <p className="text-sm text-gray-600 mb-3">
                        Select the facilities this user should manage. Unchecking a facility removes their access immediately.
                    </p>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                        {facilities.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-6">No facilities available.</p>
                        ) : (
                            facilities.map((facility) => {
                                const isChecked = selectedIds.includes(facility.id);
                                return (
                                    <label
                                        key={facility.id}
                                        className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition ${isChecked ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleFacility(facility.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <Building2 className={`h-4 w-4 ${isChecked ? 'text-blue-600' : 'text-gray-400'}`} />
                                        <span className={`text-sm font-medium ${isChecked ? 'text-blue-900' : 'text-gray-700'}`}>
                                            {facility.name}
                                        </span>
                                    </label>
                                );
                            })
                        )}
                    </div>
                    <div className="mt-5 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving ? 'Saving…' : 'Save Assignments'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TempPasswordModal({ account, onClose }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(account.tempPassword);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = account.tempPassword;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
                    <h2 className="font-bold text-gray-900">Password Ready</h2>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <p className="text-sm text-gray-600">
                        <strong>{account.name}</strong>'s temporary password is ready. Share it securely — it will not be shown again.
                    </p>
                    <div className="space-y-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                            <p className="text-sm font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">{account.email}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Temporary Password</label>
                            <div className="flex items-center gap-2">
                                <p className="flex-1 text-sm font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">{account.tempPassword}</p>
                                <button onClick={handleCopy} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600" title="Copy password">
                                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        The user will be required to change this password when they next log in.
                    </p>
                    <button onClick={onClose} className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Users({ users = [], facilities = [], newAccount = null }) {
    const currentUserId = usePage().props.auth.user.id;

    const [updatingId, setUpdatingId] = useState(null);
    const [resettingId, setResettingId] = useState(null);
    const [togglingId, setTogglingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [facilityAssignUser, setFacilityAssignUser] = useState(null);
    const [accountToShow, setAccountToShow] = useState(null);

    // Search and Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        if (newAccount) setAccountToShow(newAccount);
    }, [newAccount]);

    const handleRoleChange = (user, newRole) => {
        if (newRole === user.role) return;
        setUpdatingId(user.id);
        router.patch(route('admin.users.updateRole', user.id), { role: newRole }, {
            preserveScroll: true,
            onSuccess: () => toast.success(`${user.name}'s role updated to ${ROLE_LABELS[newRole]}.`),
            onError: (errors) => toast.error(errors.role || 'Failed to update role.'),
            onFinish: () => setUpdatingId(null),
        });
    };

    const handleResetPassword = (user) => {
        if (!confirm(`Generate a new temporary password for ${user.name}? Their current password will stop working immediately.`)) return;
        setResettingId(user.id);
        router.post(route('admin.users.regeneratePassword', user.id), {}, {
            preserveScroll: true,
            onError: () => toast.error('Failed to reset password.'),
            onFinish: () => setResettingId(null),
        });
    };

    const handleToggleActive = (user) => {
        const action = user.is_active ? 'disable' : 'activate';
        if (!confirm(`Are you sure you want to ${action} ${user.name}'s account?`)) return;
        setTogglingId(user.id);
        router.patch(route('admin.users.toggleActive', user.id), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success(`${user.name}'s account has been ${action}d.`),
            onError: (errors) => toast.error(errors.role || 'Failed to update account status.'),
            onFinish: () => setTogglingId(null),
        });
    };

    const handleDelete = (user) => {
        if (!confirm(`Delete ${user.name}'s account? They will lose access immediately.`)) return;
        setDeletingId(user.id);
        router.delete(route('admin.users.destroy', user.id), {
            preserveScroll: true,
            onSuccess: () => toast.success(`${user.name}'s account has been deleted.`),
            onError: (errors) => toast.error(errors.role || 'Failed to delete user.'),
            onFinish: () => setDeletingId(null),
        });
    };

    // Computed filtered users list
    const filteredUsers = users.filter((user) => {
        const query = searchTerm.toLowerCase();
        const matchesSearch =
            (user.name?.toLowerCase().includes(query) ?? false) ||
            (user.email?.toLowerCase().includes(query) ?? false);

        const matchesRole = roleFilter === 'all' || user.role === roleFilter;

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && user.is_active) ||
            (statusFilter === 'disabled' && !user.is_active);

        return matchesSearch && matchesRole && matchesStatus;
    });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <button onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl">
                        <Plus className="h-4 w-4" /> Add User
                    </button>
                </div>
            }
        >
            <Head title="User Management" />

            <div className="p-6">
                {/* Search and Filters Toolbar */}
                <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Filters Group */}
                    <div className="flex w-full sm:w-auto items-center gap-3">
                        {/* Role Filter */}
                        <div className="flex items-center gap-1.5 w-full sm:w-auto">
                            <Filter className="h-4 w-4 text-gray-400 hidden sm:block" />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="w-full sm:w-auto border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-400 text-gray-700"
                            >
                                <option value="all">All Roles</option>
                                <option value="super_admin">Super Admin</option>
                                <option value="facility_admin">Facility Admin</option>
                                <option value="user">User</option>
                            </select>
                        </div>

                        {/* Status Filter */}
<select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="w-full sm:w-auto border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-400 text-gray-700 cursor-pointer"
>
    <option value="all">All Statuses</option>
    <option value="active">Active</option>
    <option value="disabled">Disabled</option>
</select>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Facilities</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">
                                        No matching users found.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const isSelf = user.id === currentUserId;
                                    return (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}{isSelf && <span className="text-gray-400 font-normal"> (you)</span>}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                                            <td className="px-6 py-4">
                                                <div className="relative w-48">
                                                    <select
                                                        value={user.role}
                                                        disabled={updatingId === user.id}
                                                        onChange={(e) => handleRoleChange(user, e.target.value)}
                                                        className="w-full appearance-none rounded-lg border border-gray-200 py-1.5 pl-3 pr-10 text-sm focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 bg-white truncate"
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="facility_admin">Facility Admin</option>
                                                        <option value="super_admin">Super Admin</option>
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                                        <ChevronDown className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {user.role === 'facility_admin' ? (
                                                        <>
                                                            <span className="text-xs text-gray-600 max-w-[180px] truncate">
                                                                {user.assigned_facility_ids?.length
                                                                    ? `${user.assigned_facility_ids.length} ${user.assigned_facility_ids.length === 1 ? 'facility' : 'facilities'} assigned`
                                                                    : 'No facilities assigned'}
                                                            </span>
                                                            <button
                                                                onClick={() => setFacilityAssignUser(user)}
                                                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg"
                                                                title="Manage facility assignments"
                                                            >
                                                                <Building2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4"><StatusBadge isActive={user.is_active} /></td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <button onClick={() => setEditingUser(user)}
                                                        className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg" title="Edit details">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button onClick={() => handleResetPassword(user)} disabled={resettingId === user.id}
                                                        className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg disabled:opacity-50" title="Reset password">
                                                        <KeyRound className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button onClick={() => handleToggleActive(user)} disabled={togglingId === user.id || isSelf}
                                                        className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                                                        title={isSelf ? "Can't disable your own account" : user.is_active ? 'Disable account' : 'Activate account'}>
                                                        <Power className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(user)} disabled={deletingId === user.id || isSelf}
                                                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                                                        title={isSelf ? "Can't delete your own account here" : 'Delete account'}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showAddModal && <AddUserModal facilities={facilities} onClose={() => setShowAddModal(false)} />}
            {editingUser && <EditUserModal user={editingUser} facilities={facilities} onClose={() => setEditingUser(null)} />}
            {facilityAssignUser && <FacilityAssignmentModal user={facilityAssignUser} facilities={facilities} onClose={() => setFacilityAssignUser(null)} />}
            {accountToShow && <TempPasswordModal account={accountToShow} onClose={() => setAccountToShow(null)} />}
        </AuthenticatedLayout>
    );
}