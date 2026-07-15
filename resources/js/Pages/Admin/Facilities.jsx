import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, Users, MapPin } from 'lucide-react';

const EMPTY_FORM = {
    name: '',
    type: 'Venue',
    capacity: '',
    description: '',
    imageUrl: '',
    requirement: 'STANDARD',
    location: '',
    requiresWeekendConsent: true,
    allowTdevsManpower: true,
    assigned_admin_ids: [],
};

function FacilityFormModal({ facility, facilityAdmins = [], onClose }) {
    const isEditing = !!facility;

    const [form, setForm] = useState(() =>
        facility
            ? {
                  ...EMPTY_FORM,
                  ...facility,
                  assigned_admin_ids: facility.facility_admins?.map((admin) => admin.id) ?? [],
              }
            : EMPTY_FORM
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const toggleAssignedAdmin = (adminId) => {
        setForm((f) => {
            const assigned = new Set(f.assigned_admin_ids ?? []);
            if (assigned.has(adminId)) {
                assigned.delete(adminId);
            } else {
                assigned.add(adminId);
            }
            return { ...f, assigned_admin_ids: Array.from(assigned) };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = new FormData();
        payload.append('name', form.name);
        payload.append('type', form.type);
        payload.append('capacity', form.capacity === '' ? '' : String(form.capacity));
        payload.append('description', form.description);
        payload.append('location', form.location);
        payload.append('requirement', form.requirement);
        payload.append('requiresWeekendConsent', form.requiresWeekendConsent ? '1' : '0');
        payload.append('allowTdevsManpower', form.allowTdevsManpower ? '1' : '0');

        form.assigned_admin_ids.forEach((id) => payload.append('assigned_admin_ids[]', id));

        if (form.imageFile) {
            payload.append('image', form.imageFile);
        } else if (form.imageUrl) {
            payload.append('imageUrl', form.imageUrl);
        }

        const options = {
            onSuccess: () => {
                toast.success(isEditing ? 'Facility updated.' : 'Facility created.');
                onClose();
            },
            onError: (errors) => {
                toast.error(Object.values(errors)[0] || 'Something went wrong.');
            },
            onFinish: () => setIsSubmitting(false),
        };

        if (isEditing) {
            router.patch(route('admin.facilities.update', facility.id), payload, options);
        } else {
            router.post(route('admin.facilities.store'), payload, options);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
                    <h2 className="font-bold text-gray-900">{isEditing ? 'Edit Facility' : 'Add Facility'}</h2>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
                    <div className="px-6 py-5 space-y-3">
                        <input
                            type="text" required placeholder="Facility name" value={form.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            className="block w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-400"
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <select
                                value={form.type} onChange={(e) => updateField('type', e.target.value)}
                                className="block w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-400"
                            >
                                <option value="Venue">Venue</option>
                                <option value="Laboratory">Laboratory</option>
                                <option value="Equipment">Equipment</option>
                            </select>
                            <input
                                type="number" min={1} placeholder="Capacity (optional)" value={form.capacity}
                                onChange={(e) => updateField('capacity', e.target.value)}
                                className="block w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-400"
                            />
                        </div>

                        <input
                            type="text" required placeholder="Location" value={form.location}
                            onChange={(e) => updateField('location', e.target.value)}
                            className="block w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-400"
                        />

                        <div className="space-y-2 rounded-2xl border border-gray-200 bg-gray-50 p-3">
                            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                                Facility image
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => updateField('imageFile', e.target.files?.[0] ?? null)}
                                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-full file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-indigo-700"
                            />
                            <input
                                type="url"
                                placeholder="Or paste an image URL"
                                value={form.imageUrl}
                                onChange={(e) => updateField('imageUrl', e.target.value)}
                                className="block w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-400"
                            />
                        </div>

                        <textarea
                            required rows={3} placeholder="Description" value={form.description}
                            onChange={(e) => updateField('description', e.target.value)}
                            className="block w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-400 resize-none"
                        />

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Consent Requirement</label>
                            <select
                                value={form.requirement} onChange={(e) => updateField('requirement', e.target.value)}
                                className="block w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-400"
                            >
                                <option value="STANDARD">Standard (no consent unless weekend)</option>
                                <option value="CONSENT_REQUIRED">Always requires consent</option>
                            </select>
                        </div>

                        <label className="flex items-center gap-2.5 text-sm text-gray-700">
                            <input
                                type="checkbox" checked={form.requiresWeekendConsent}
                                onChange={(e) => updateField('requiresWeekendConsent', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
                            />
                            Requires consent letter for weekend bookings
                        </label>

                        <label className="flex items-center gap-2.5 text-sm text-gray-700">
                            <input
                                type="checkbox" checked={form.allowTdevsManpower}
                                onChange={(e) => updateField('allowTdevsManpower', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
                            />
                            Allow requesting TDEVS manpower
                        </label>

                        <div className="pt-2 border-t border-gray-100">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Facility Admins</label>
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search admins by name or email"
                                className="block w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-400"
                            />
                            <div className="mt-3 max-h-48 overflow-y-auto border border-gray-200 rounded-2xl bg-white">
                                {facilityAdmins
                                    .filter((admin) =>
                                        admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        admin.email.toLowerCase().includes(searchQuery.toLowerCase())
                                    )
                                    .map((admin) => {
                                        const selected = form.assigned_admin_ids.includes(admin.id);
                                        return (
                                            <button
                                                type="button"
                                                key={admin.id}
                                                onClick={() => toggleAssignedAdmin(admin.id)}
                                                className={`w-full text-left px-4 py-3 transition ${selected ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-gray-50 text-gray-700'}`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold">{admin.name}</p>
                                                        <p className="text-xs text-gray-500">{admin.email}</p>
                                                    </div>
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${selected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                        {selected ? 'Selected' : 'Select'}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {facilityAdmins
                                    .filter((admin) => form.assigned_admin_ids.includes(admin.id))
                                    .map((admin) => (
                                        <span key={admin.id} className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                                            {admin.name}
                                        </span>
                                    ))}
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-5 border-t border-gray-100">
                        <button
                            type="submit" disabled={isSubmitting}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:bg-indigo-300"
                        >
                            {isSubmitting ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Facility'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Facilities({ facilities = [], facilityAdmins = [] }) {
    const [modalState, setModalState] = useState(null); // null | 'create' | facility object
    const [deletingId, setDeletingId] = useState(null);

    const handleDelete = (facility) => {
        if (!confirm(`Delete "${facility.name}"? This cannot be undone.`)) return;

        setDeletingId(facility.id);
        router.delete(route('admin.facilities.destroy', facility.id), {
            onSuccess: () => toast.success('Facility deleted.'),
            onError: () => toast.error('Failed to delete facility.'),
            onFinish: () => setDeletingId(null),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Facility Management</h1>
                    <button
                        onClick={() => setModalState('create')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl"
                    >
                        <Plus className="h-4 w-4" /> Add Facility
                    </button>
                </div>
            }
        >
            <Head title="Facility Management" />

            <div className="p-6">
                {facilities.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
                        <p className="text-sm text-gray-400">No facilities yet. Click "Add Facility" to create one.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {facilities.map((facility) => (
                            <div key={facility.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <img src={facility.imageUrl} alt={facility.name} className="w-full h-32 object-cover" />
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-semibold text-gray-900">{facility.name}</h3>
                                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase flex-shrink-0">
                                            {facility.type}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> {facility.location}</p>
                                    {facility.capacity && (
                                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Users className="h-3 w-3" /> {facility.capacity} people</p>
                                    )}

                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => setModalState(facility)}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg"
                                        >
                                            <Pencil className="h-3.5 w-3.5" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(facility)}
                                            disabled={deletingId === facility.id}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg disabled:opacity-50"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {modalState && (
                <FacilityFormModal
                    facility={modalState === 'create' ? null : modalState}
                    facilityAdmins={facilityAdmins}
                    onClose={() => setModalState(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}