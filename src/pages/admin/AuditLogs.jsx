import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getAuditLogs } from "../../api/admin/adminServices";
import { FileText, Clock } from "lucide-react";

const AuditLogs = () => {
    const { setSearchPlaceholder } = useOutletContext();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setSearchPlaceholder("Search logs...");
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const data = await getAuditLogs();
            setLogs(data);
        } catch (err) {
            console.error("Failed to fetch logs", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8" style={{ color: 'var(--text-color)' }}>Loading logs...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 max-[600px]:text-lg" style={{ color: 'var(--text-color)' }}>
                <FileText className="text-yellow-500" /> Audit Logs
            </h1>

            <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                {logs.length > 0 && logs[0].message !== "Audit logging not implemented yet" ? (
                    <table className="w-full text-left" style={{ color: 'var(--text-color)' }}>
                        <thead className="uppercase text-xs" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--secondary-color)' }}>
                            <tr>
                                <th className="px-6 py-3">Action</th>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Details</th>
                                <th className="px-6 py-3">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                            {logs.map((log, index) => (
                                <tr key={index} className="hover:bg-opacity-50 transition-colors" style={{ backgroundColor: 'var(--card-bg)' }}>
                                    <td className="px-6 py-4">{log.action}</td>
                                    <td className="px-6 py-4">{log.user}</td>
                                    <td className="px-6 py-4">{log.details}</td>
                                    <td className="px-6 py-4 flex items-center gap-2 text-sm" style={{ color: 'var(--secondary-color)' }}>
                                        <Clock size={14} /> {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-12 text-center" style={{ color: 'var(--secondary-color)' }}>
                        <FileText size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No audit logs available or feature not yet enabled.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogs;
