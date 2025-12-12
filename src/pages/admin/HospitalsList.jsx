import React, { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { listHospitals, updateHospitalStatus } from "../../api/admin/adminServices";
import { Building2, MapPin, Activity, Eye } from "lucide-react";

const HospitalsList = () => {
    const { searchQuery, setSearchPlaceholder, setFilters, activeFilters } = useOutletContext();
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setSearchPlaceholder("Search hospitals by name, address...");
        setFilters([
            {
                key: "status",
                label: "Filter by Status",
                options: [
                    { value: "approved", label: "Approved" },
                    { value: "pending", label: "Pending" },
                    { value: "suspended", label: "Suspended" },
                ]
            },
            {
                key: "sort",
                label: "Sort By",
                options: [
                    { value: "rating", label: "Rating" },
                    { value: "doctors", label: "Doctor Count" },
                ]
            }
        ]);
        fetchHospitals();
    }, []);

    const fetchHospitals = async () => {
        try {
            const data = await listHospitals();
            setHospitals(data);
        } catch (err) {
            console.error("Failed to fetch hospitals", err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = async (id, currentStatus) => {
        const newStatus = currentStatus === "approved" ? "suspended" : "approved";
        try {
            await updateHospitalStatus(id, newStatus);
            setHospitals(hospitals.map(h => h._id === id ? { ...h, status: newStatus } : h));
        } catch (err) {
            alert("Failed to update status");
        }
    };

    const filteredHospitals = hospitals.filter(h => {
        const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            h.address.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = activeFilters.status ? h.status === activeFilters.status : true;
        return matchesSearch && matchesStatus;
    });

    if (loading) return <div className="p-8" style={{ color: 'var(--text-color)' }}>Loading hospitals...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl max-[600px]:text-lg font-bold" style={{ color: 'var(--text-color)' }}>Hospitals Directory</h1>
                <Link to="/admin/create-hospital" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 max-[600px]:px-2 max-[600px]:py-1 rounded-lg text-sm font-medium transition-colors">
                    + Add Hospital
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHospitals.map((hospital) => (
                    <div key={hospital._id} className="rounded-xl border overflow-hidden hover:border-blue-500 transition-all group"
                        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-400">
                                    <Building2 size={24} />
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${hospital.status === 'approved' ? 'bg-green-900 text-green-300' :
                                    hospital.status === 'pending' ? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300'
                                    }`}>
                                    {hospital.status}
                                </span>
                            </div>

                            <h3 className="text-xl max-[600px]:text-lg font-bold mb-2" style={{ color: 'var(--text-color)' }}>{hospital.name}</h3>
                            <p className="text-sm flex items-center gap-2 mb-4" style={{ color: 'var(--secondary-color)' }}>
                                <MapPin size={14} /> {hospital.address}
                            </p>

                            <div className="grid grid-cols-2 gap-4 text-sm mb-6" style={{ color: 'var(--secondary-color)' }}>
                                <div>
                                    <span className="block text-xs uppercase" style={{ color: 'var(--secondary-color)' }}>Doctors</span>
                                    <span className="font-semibold" style={{ color: 'var(--text-color)' }}>{hospital.numberOfDoctors || 0}</span>
                                </div>
                                <div>
                                    <span className="block text-xs uppercase" style={{ color: 'var(--secondary-color)' }}>Rating</span>
                                    <span className="font-semibold text-yellow-400">★ {hospital.rating || 4.5}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Link
                                    to={`/admin/hospitals/${hospital._id}`}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium text-center transition-colors flex items-center justify-center gap-2"
                                >
                                    <Eye size={16} /> View Details
                                </Link>
                                <button
                                    onClick={() => handleStatusToggle(hospital._id, hospital.status)}
                                    className={`px-3 py-2 rounded-lg text-white transition-colors ${hospital.status === 'approved' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                                        }`}
                                    title={hospital.status === 'approved' ? 'Suspend' : 'Approve'}
                                >
                                    <Activity size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HospitalsList;