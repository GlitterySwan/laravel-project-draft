import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="ReserveIT Home" />

            <div className="relative min-h-screen overflow-hidden bg-[#F5EEE7] text-slate-900 selection:bg-[#7A4A57] selection:text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(165,106,120,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(90,62,72,0.15),transparent_28%)] pointer-events-none" />

                <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10 lg:px-10">
                    <header className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-2xl space-y-4">
                            <p className="inline-flex items-center rounded-full bg-[#7A4A57]/10 px-3 py-1 text-sm font-semibold uppercase tracking-[0.3em] text-[#7A4A57]">
                                ReserveIT
                            </p>
                            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                                Campus facilities, bookings, and approvals in one refined portal.
                            </h1>
                            <p className="max-w-xl text-base leading-8 text-slate-700">
                                Welcome to the ReserveIT interface for UIC-MAIN campus bookings. Review rooms, submit requests, and empower facility administrators with an academic-grade scheduling experience.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                href={route('facilities.index')}
                                className="inline-flex items-center justify-center rounded-full bg-[#7A4A57] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#6b3947]"
                            >
                                Browse facilities
                            </Link>
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="inline-flex items-center justify-center rounded-full border border-[#D8C9C2] bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-[#BBA8A0] hover:bg-[#F7F1EE]"
                                >
                                    Go to dashboard
                                </Link>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="inline-flex items-center justify-center rounded-full border border-[#D8C9C2] bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-[#BBA8A0] hover:bg-[#F7F1EE]"
                                >
                                    Sign in
                                </Link>
                            )}
                        </div>
                    </header>

                    <main className="mt-12 grid gap-8 lg:grid-cols-[1.35fr_0.9fr]">
                        <section className="rounded-[2rem] border border-[#E8D8D1] bg-white/95 p-10 shadow-[0_32px_90px_rgba(0,0,0,0.08)]">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-3 rounded-full bg-[#7A4A57]/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-[#7A4A57]">
                                    Facility Booking Workflow
                                </div>
                                <div className="grid gap-6 sm:grid-cols-2">
                                    {[
                                        {
                                            title: 'Request a room',
                                            description: 'Submit a booking request for lecture halls, labs, and meeting spaces.',
                                        },
                                        {
                                            title: 'Approve bookings',
                                            description: 'Facility admins see pending requests for assigned facilities only.',
                                        },
                                        {
                                            title: 'Keep records',
                                            description: 'Track approvals, cancellations, and compliance across campus resources.',
                                        },
                                        {
                                            title: 'Manage access',
                                            description: 'Centralize permissions, user roles, and facility booking workflows in one place.',
                                        },
                                    ].map((item) => (
                                        <div key={item.title} className="rounded-3xl border border-[#E7D7CD] bg-[#FFFBF6] p-5">
                                            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                                            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <aside className="space-y-6 rounded-[1.75rem] border border-[#E7D7CD] bg-[#FFF8F2] p-8 shadow-[inset_0_0_0_1px_rgba(227,206,199,0.9)]">
                            <div className="space-y-4">
                                <div className="inline-flex items-center rounded-full bg-[#7A4A57]/10 px-3 py-1 text-sm font-semibold uppercase tracking-[0.3em] text-[#7A4A57]">
                                    Facility Booking Priorities
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold text-slate-900">Trusted campus scheduling</h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        Designed to feel like official university booking system with a warm paper-inspired interface.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-3xl bg-white p-6 ring-1 ring-[#E5D2C6]/90">
                                <p className="text-sm font-semibold text-slate-900">Student events, faculty meetings, and facility booking requests</p>
                                <p className="mt-3 text-sm text-slate-600">Everything is organized for campus units that need trusted oversight and timely approvals.</p>
                            </div>

                            <div className="rounded-3xl bg-[#7A4A57] p-6 text-white">
                                <p className="text-sm uppercase tracking-[0.3em] text-[#E9D8D2]">ReserveIT Support</p>
                                <p className="mt-3 text-sm leading-6">
                                    Reach out to your MIS Office for policy guidance, facility use questions, or event coordination support.
                                </p>
                            </div>
                        </aside>
                    </main>
                </div>
            </div>
        </>
    );
}
