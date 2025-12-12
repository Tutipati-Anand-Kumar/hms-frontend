import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { assignHelpDeskToHospital } from "../../api/admin/adminServices";
import { Building2, Headphones } from "lucide-react";

const AssignHelpDesk = () => {
    const { setSearchPlaceholder } = useOutletContext();
    const [formData, setFormData] = useState({
        hospitalId: "",
        helpdeskId: "", // Helpdesk User ID
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setSearchPlaceholder("Search...");
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await assignHelpDeskToHospital(formData);
            alert("Help Desk assigned successfully!");
            setFormData({ hospitalId: "", helpdeskId: "" });
        } catch (err) {
            alert(err.message || "Assignment failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                <Headphones className="text-purple-500" /> Assign Help Desk to Hospital
            </h1>

            <form onSubmit={handleSubmit} className="p-8 rounded-xl border space-y-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <div>
                    <label className="block mb-2 text-sm" style={{ color: 'var(--secondary-color)' }}>Hospital ID</label>
                    <input
                        type="text"
                        required
                        placeholder="Enter Hospital ID"
                        value={formData.hospitalId}
                        onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
                        className="w-full p-3 rounded-lg border focus:border-purple-500 outline-none"
                        style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                    />
                </div>

                <div>
                    <label className="block mb-2 text-sm" style={{ color: 'var(--secondary-color)' }}>Help Desk User ID</label>
                    <input
                        type="text"
                        required
                        placeholder="Enter Help Desk User ID"
                        value={formData.helpdeskId}
                        onChange={(e) => setFormData({ ...formData, helpdeskId: e.target.value })}
                        className="w-full p-3 rounded-lg border focus:border-purple-500 outline-none"
                        style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                    {loading ? "Assigning..." : "Assign Help Desk"}
                </button>
            </form>
        </div>
    );
};

export default AssignHelpDesk;
