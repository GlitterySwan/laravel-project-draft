import React, { useState } from 'react';
import { Link, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Users, MapPin, ShieldAlert, CheckCircle2, Building2, Filter, X, SortAsc, Tag, Check } from 'lucide-react';

const SORT_LABELS = {
    alphabetical: 'Alphabetical (A–Z)',
    capacity: 'By Capacity (High–Low)',
    floor: 'By Floor',
};

const TYPE_LABELS = {
    All: 'All Types',
    Venue: 'Venue',
    Laboratory: 'Laboratory',
};

export default function Dashboard({ auth, facilities }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [sortBy, setSortBy] = useState('alphabetical');

    // Filter modal state
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    
    // Temp state inside modal (applied on "Apply")
    const [pendingType, setPendingType] = useState(filterType);
    const [pendingSort, setPendingSort] = useState(sortBy);

    const activeFilterCount = (filterType !== 'All' ? 1 : 0) + (sortBy !== 'alphabetical' ? 1 : 0);

    const openModal = () => {
        setPendingType(filterType);
        setPendingSort(sortBy);
        setFilterModalOpen(true);
    };

    const applyFilters = () => {
        setFilterType(pendingType);
        setSortBy(pendingSort);
        setFilterModalOpen(false);
    };

    const resetFilters = () => {
        setPendingType('All');
        setPendingSort('alphabetical');
    };

    // Filter and Sort facilities coming directly from your MySQL DB props!
    const filteredFacilities = (facilities || []).filter((facility) => {
        const matchesSearch = facility.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'All' || facility.type === filterType;
        return matchesSearch && matchesType;
    }).sort((a, b) => {
        if (sortBy === 'alphabetical') {
            return a.name.localeCompare(b.name);
        } else if (sortBy === 'capacity') {
            return (b.capacity ?? 0) - (a.capacity ?? 0);
        } else if (sortBy === 'floor') {
            const getFloorNum = (loc) => {
                if (!loc) return 99;
                if (loc.toLowerCase().includes('ground')) return 0;
                const match = loc.match(/(\d+)/);
                return match ? parseInt(match[0]) : 99;
            };
            return getFloorNum(a.location) - getFloorNum(b.location);
        }
        return 0;
    });

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">UIC Dashboard</h2>}
            
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">UIC Facilities</h1>
                    <p className="text-sm text-gray-500 mb-8">Browse and book university venues, laboratories, and equipment.</p>

                    {/* Search + Filter row */}
                    <div className="mb-8 flex items-center gap-3">
                        <input
                            type="text"
                            placeholder="Search facilities..."
                            className="flex-1 sm:max-w-xs px-4 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-sm bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        {/* Filter icon button */}
                        <button
                            onClick={openModal}
                            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                                activeFilterCount > 0
                                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm'
                            }`}
                        >
                            <Filter className="h-4 w-4" />
                            <span className="hidden sm:inline">Filters</span>
                            {activeFilterCount > 0 && (
                                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        {/* Active filter pills */}
                        {filterType !== 'All' && (
                            <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                {filterType}
                                <button onClick={() => setFilterType('All')} className="ml-1 hover:text-indigo-900">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {sortBy !== 'alphabetical' && (
                            <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                {SORT_LABELS[sortBy]}
                                <button onClick={() => setSortBy('alphabetical')} className="ml-1 hover:text-gray-900">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                    </div>

                    {/* Facilities Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredFacilities.map((facility) => (
                            <Link
                                key={facility.id}
                                href={`/facility/${facility.id}`}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col group"
                            >
                                <div className="relative h-44 w-full overflow-hidden">
                                    <img
                                        src={facility.imageUrl}
                                        alt={facility.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                                    <div className="absolute top-3 left-3 flex space-x-1.5">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-gray-800 backdrop-blur-sm shadow-sm">
                                            {facility.type}
                                        </span>
                                        {facility.requirement === 'CONSENT_REQUIRED' ? (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100/95 text-amber-800 backdrop-blur-sm shadow-sm">
                                                <ShieldAlert className="w-3 h-3 mr-1" /> Consent
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100/95 text-emerald-800 backdrop-blur-sm shadow-sm">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Standard
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-5 flex flex-col flex-grow">
                                    <h3 className="text-base font-bold text-gray-900 mb-1">{facility.name}</h3>
                                    <div className="flex items-center text-xs text-gray-500 mb-2.5">
                                        <MapPin className="flex-shrink-0 mr-1 h-3.5 w-3.5 text-gray-400" />
                                        {facility.location}
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-grow leading-relaxed">
                                        {facility.description}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-50 pt-3">
                                        <div className="flex items-center">
                                            <Users className="flex-shrink-0 mr-1 h-3.5 w-3.5 text-gray-400" />
                                            Cap: {facility.capacity ? facility.capacity : 'Unspecified'}
                                        </div>
                                        <span className="text-indigo-500 font-semibold group-hover:text-indigo-700 transition-colors">
                                            Book →
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {filteredFacilities.length === 0 && (
                        <div className="text-center py-12">
                            <Building2 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No facilities found</h3>
                            <p className="mt-1 text-sm text-gray-500">Adjust your search or filter settings.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Filter Modal */}
            {filterModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFilterModalOpen(false)} />
                    <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-indigo-600" />
                                <h3 className="font-bold text-gray-900">Filter & Sort</h3>
                            </div>
                            <button onClick={() => setFilterModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Tag className="h-3.5 w-3.5 text-gray-500" />
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {['All', 'Venue', 'Laboratory'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setPendingType(type)}
                                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                                                pendingType === type
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                                            }`}
                                        >
                                            {pendingType === type && <Check className="h-3.5 w-3.5" />}
                                            {TYPE_LABELS[type]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <SortAsc className="h-3.5 w-3.5 text-gray-500" />
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sort By</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {Object.entries(SORT_LABELS).map(([value, label]) => (
                                        <button
                                            key={value}
                                            onClick={() => setPendingSort(value)}
                                            className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                                                pendingSort === value
                                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <span>{label}</span>
                                            {pendingSort === value && (
                                                <span className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                                                    <Check className="h-2.5 w-2.5 text-white" />
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                            <button onClick={resetFilters} className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                                Reset
                            </button>
                            <button onClick={applyFilters} className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}