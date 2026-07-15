import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50 text-slate-900 selection:bg-indigo-600 selection:text-white">
            <div className="mx-auto flex min-h-screen max-w-7xl flex-col">
                <header className="border-b border-gray-200 bg-white/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3">
                            <ApplicationLogo className="h-10 w-10 text-indigo-600" />
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                    ReserveIT
                                </p>
                                <h1 className="text-lg font-semibold text-slate-900">
                                    Facility Booking
                                </h1>
                            </div>
                        </Link>

                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                            <Link
                                href="/login"
                                className="rounded-md px-3 py-2 transition hover:bg-gray-100 hover:text-slate-900"
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="rounded-md bg-indigo-600 px-3 py-2 text-white transition hover:bg-indigo-700"
                            >
                                Register
                            </Link>
                        </div>
                    </div>
                </header>

                <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
