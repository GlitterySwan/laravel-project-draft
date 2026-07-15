import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function FacilitatorDashboard({ stats }) {
    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Facilitator Dashboard</h1>}>
            <Head title="Facilitator Dashboard" />
            <div className="p-6">
                <p>Pending Approvals: {stats.pendingApprovals}</p>
            </div>
        </AuthenticatedLayout>
    );
}