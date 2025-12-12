import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { adminBroadcast } from "../../api/admin/adminServices";
import { Radio, Send } from "lucide-react";

const Broadcast = () => {
    const { setSearchPlaceholder } = useOutletContext();
    const [formData, setFormData] = useState({
        title: "",
        body: ""
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setSearchPlaceholder("Search...");
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await adminBroadcast(formData);
            alert("Broadcast sent successfully!");
            setFormData({ title: "", body: "" });
        } catch (err) {
            alert(err.message || "Broadcast failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 max-[600px]:text-lg" style={{ color: 'var(--text-color)' }}>
                <Radio className="text-red-500" /> System Broadcast
            </h1>

            <form onSubmit={handleSubmit} className="p-8 rounded-xl border space-y-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <div>
                    <label className="block mb-2 text-sm" style={{ color: 'var(--secondary-color)' }}>Broadcast Title</label>
                    <input
                        type="text"
                        required
                        placeholder="Important Announcement"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full p-3 rounded-lg border focus:border-red-500 outline-none"
                        style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                    />
                </div>

                <div>
                    <label className="block mb-2 text-sm" style={{ color: 'var(--secondary-color)' }}>Message Body</label>
                    <textarea
                        required
                        rows="6"
                        placeholder="Type your message here..."
                        value={formData.body}
                        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                        className="w-full p-3 rounded-lg border focus:border-red-500 outline-none resize-none"
                        style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 max-[600px]:text-sm"
                >
                    <Send size={18} /> {loading ? "Sending..." : "Send Broadcast"}
                </button>
            </form>
        </div>
    );
};

export default Broadcast;
