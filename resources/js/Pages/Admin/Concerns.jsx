import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

export default function Concerns({ concerns }) {
    const records = concerns?.data ?? [];

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-slate-900">User Concerns</h1>}>
            <Head title="User Concerns" />
            <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
                {records.length === 0 ? (
                    <p className="p-8 text-center text-sm text-slate-500">No concerns have been submitted.</p>
                ) : (
                    <ul className="divide-y divide-stone-100">
                        {records.map((concern) => (
                            <li key={concern.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="whitespace-pre-wrap text-sm text-slate-800">{concern.message}</p>
                                    <p className="mt-2 text-xs text-slate-500">
                                        {concern.user?.name ?? 'Guest'} {concern.user?.email ? `(${concern.user.email})` : ''} · {new Date(concern.created_at).toLocaleString()}
                                    </p>
                                </div>
                                {concern.status === 'pending' ? (
                                    <button
                                        type="button"
                                        onClick={() => router.patch(route('admin.concerns.resolve', concern.id), {}, { preserveScroll: true })}
                                        className="shrink-0 rounded-xl bg-[#6A535C] px-3 py-2 text-sm font-semibold text-white hover:bg-[#533e45]"
                                    >
                                        Mark resolved
                                    </button>
                                ) : (
                                    <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Resolved</span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </AuthenticatedLayout>
    );
}
