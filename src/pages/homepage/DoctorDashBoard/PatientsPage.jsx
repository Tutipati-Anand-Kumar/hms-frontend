import React, { useEffect, useState } from "react";
import { API } from "../../../api/authservices/authservice";
import useDebounce from "../../../hooks/useDebounce";

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500); // Debounce search
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, [patients, selectedPatient]);

  const fetchPatients = async () => {
    try {
      // Use new dedicated endpoint that returns MRN
      const res = await API.get("/doctors/my-patients");
      setPatients(res.data);
    } catch (err) {
      console.error("Error fetching patients:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatient = async (patientId) => {
    try {
      const res = await API.get(`/doctors/patient/${patientId}`);
      setSelectedPatient(res.data);
    } catch (err) {
      console.error("Error fetching patient details:", err);
      alert("Failed to load patient details");
    }
  };

  const filtered = patients.filter(p =>
    (p.name && p.name.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
    (p.mobile && p.mobile.includes(debouncedSearch)) ||
    (p.mrn && p.mrn.toLowerCase().includes(debouncedSearch.toLowerCase()))
  );

  return (
    <div className="h-full md:p-8" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
      <div className="p-5 rounded-xl shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>My Patients</h2>
        <div className="w-full md:w-auto">
          <input
            type="text"
            placeholder="Search name, mobile or MRN..."
            className="w-full md:w-80 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* PATIENT DETAILS VIEW (INLINE) */}
      {selectedPatient ? (
        <div className="mt-6 rounded-xl shadow overflow-hidden animate-fade-in" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          {/* Header */}
          <div className="flex justify-between items-center p-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>Patient Details</h2>
            <button
              onClick={() => setSelectedPatient(null)}
              className="px-4 py-2  rounded-lg transition-colors flex items-center gap-2"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
            >
              <span>← Back to List</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">

            {/* Personal Info */}
            <section>
              <h3 className="text-lg font-semibold text-blue-400 mb-4 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm" style={{ color: 'var(--secondary-color)' }}>Full Name</p>
                  <p className="font-medium text-lg" style={{ color: 'var(--text-color)' }}>{selectedPatient.personal.name}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--secondary-color)' }}>Mobile</p>
                  <p className="font-medium text-lg" style={{ color: 'var(--text-color)' }}>{selectedPatient.personal.mobile || "—"}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--secondary-color)' }}>Email</p>
                  <p className="font-medium text-lg" style={{ color: 'var(--text-color)' }}>{selectedPatient.personal.email || "—"}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--secondary-color)' }}>Age / Gender</p>
                  <p className="font-medium text-lg" style={{ color: 'var(--text-color)' }}>
                    {selectedPatient.personal.age ? `${selectedPatient.personal.age} yrs` : "—"} / {selectedPatient.personal.gender || "—"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm" style={{ color: 'var(--secondary-color)' }}>Address</p>
                  <p className="font-medium text-lg" style={{ color: 'var(--text-color)' }}>{selectedPatient.personal.address || "—"}</p>
                </div>
              </div>
            </section>

            {/* Health Snapshot */}
            <section>
              <h3 className="text-lg font-semibold text-blue-400 mb-4 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>Health Snapshot</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className=" p-5 rounded-xl border border-red-900/50">
                  <p className=" font-semibold mb-2 text-lg">Conditions</p>
                  <p className="text-gray-400">{selectedPatient.health.medicalHistory || selectedPatient.health.conditions || "None"}</p>
                </div>
                <div className=" p-5 rounded-xl border border-yellow-900/50">
                  <p className=" font-semibold mb-2 text-lg">Allergies</p>
                  <p className="text-gray-400">{selectedPatient.health.allergies || "None"}</p>
                </div>
                <div className=" p-5 rounded-xl border border-green-900/50">
                  <p className=" font-semibold mb-2 text-lg">Current Medications</p>
                  <p className="text-gray-400">{selectedPatient.health.medications || "None"}</p>
                </div>
              </div>
            </section>

            {/* Recent History */}
            <section>
              <h3 className="text-lg font-semibold text-blue-400 mb-4 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>Recent History</h3>
              {selectedPatient.history.length === 0 ? (
                <p className="italic" style={{ color: 'var(--secondary-color)' }}>No history found.</p>
              ) : (
                <div className="space-y-4">
                  {selectedPatient.history.map((item) => (
                    <div key={item._id} className="p-2 rounded-xl hover:border-blue-500/50 transition-colors" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-lg" style={{ color: 'var(--text-color)' }}>{new Date(item.date).toLocaleDateString()}</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.status === 'Completed' ? 'bg-green-900 text-green-300' :
                          item.status === 'Cancelled' ? 'bg-red-900 text-red-300' :
                            'bg-blue-900 text-blue-300'
                          }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <p style={{ color: 'var(--text-color)' }}><span className="text-sm block" style={{ color: 'var(--secondary-color)' }}>Reason</span> {item.reason}</p>
                        <p style={{ color: 'var(--text-color)' }}><span className="text-sm block" style={{ color: 'var(--secondary-color)' }}>Doctor</span> {item.doctorName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Medical Reports */}
            <section>
              <h3 className="text-lg font-semibold text-blue-400 mb-4 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>Medical Reports</h3>
              {(!selectedPatient.reports || selectedPatient.reports.length === 0) ? (
                <p className="italic" style={{ color: 'var(--secondary-color)' }}>No reports uploaded.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedPatient.reports.map((report) => (
                    <div key={report._id} className="p-4 rounded-xl flex items-center justify-between group hover:border-blue-500 transition-colors" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="text-3xl p-2 rounded-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
                          {report.type.startsWith("image/") ? "🖼️" :
                            report.type === "application/pdf" ? "📕" :
                              report.type.startsWith("video/") ? "🎥" :
                                report.type.startsWith("audio/") ? "🎵" : "📄"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate group-hover:text-blue-400 transition-colors" style={{ color: 'var(--text-color)' }}>{report.name}</p>
                          <p className="text-xs" style={{ color: 'var(--secondary-color)' }}>{report.date}</p>
                        </div>
                      </div>
                      <a
                        href={report.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors shadow-lg shadow-blue-900/20"
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>
      ) : (
        <div className="mt-6 p-5 rounded-xl shadow overflow-x-auto" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          {loading ? (
            <p className="text-center py-4" style={{ color: 'var(--secondary-color)' }}>Loading patients...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-4" style={{ color: 'var(--secondary-color)' }}>No patients found</p>
          ) : (
            <table className="w-full border-collapse min-w-[600px]" style={{ color: 'var(--text-color)' }}>
              <thead>
                <tr className="text-left" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th className="py-2">MRN</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">Mobile</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Last Reason</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p._id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="py-2 font-mono text-sm text-blue-500">{p.mrn || "N/A"}</td>
                    <td className="py-2 font-medium" style={{ color: 'var(--text-color)' }}>{p.name}</td>
                    <td className="py-2">{p.mobile}</td>
                    <td className="py-2">{p.email}</td>
                    <td className="py-2" style={{ color: 'var(--secondary-color)' }}>{p.reason}</td>
                    <td className="py-2">
                      <button
                        onClick={() => handleViewPatient(p._id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
