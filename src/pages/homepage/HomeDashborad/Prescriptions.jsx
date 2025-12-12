import React, { useEffect, useState } from 'react';
import { API } from "../../../api/authservices/authservice";
import { useNavigate, useOutletContext } from 'react-router-dom';
import { FileText, ChevronRight, CheckSquare, Square, Trash2, X } from 'lucide-react';

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selection State
  const [selectedIds, setSelectedIds] = useState([]);

  // Custom Confirmation State
  const [confirmState, setConfirmState] = useState({
    show: false,
    message: "",
    isBatch: false,
    targetId: null
  });

  const navigate = useNavigate();
  const { searchQuery } = useOutletContext();

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const res = await API.get("/prescriptions");
      setPrescriptions(res.data);
    } catch (err) {
      console.error("Error fetching prescriptions:", err);
      setError("no previous prescriptions.");
    } finally {
      setLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(pres => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const doctorName = pres.doctor?.name?.toLowerCase() || "";
    const specialization = pres.doctor?.specialization?.toLowerCase() || "";
    const diagnosis = pres.reason?.toLowerCase() || "";
    return doctorName.includes(query) || specialization.includes(query) || diagnosis.includes(query);
  });

  // --- Selection Logic ---
  const toggleSelection = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    e.stopPropagation();
    if (selectedIds.length === filteredPrescriptions.length && filteredPrescriptions.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPrescriptions.map(p => p._id));
    }
  };

  // --- Delete Logic ---
  const initiateDelete = (id, e) => {
    e.stopPropagation();
    setConfirmState({
      show: true,
      message: "Are you sure you want to delete this prescription?",
      isBatch: false,
      targetId: id
    });
  };

  const initiateBatchDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmState({
      show: true,
      message: `Are you sure you want to delete ${selectedIds.length} selected prescription(s)?`,
      isBatch: true,
      targetId: null
    });
  };

  const confirmDelete = async () => {
    const { isBatch, targetId } = confirmState;
    // Optimistic UI update or wait for API? Let's wait for API to be safe but show loading if needed.
    // For now, just close dialog and process.
    setConfirmState({ ...confirmState, show: false });

    try {
      if (isBatch) {
        await API.post("/prescriptions/delete-batch", { ids: selectedIds });
        setPrescriptions(prev => prev.filter(p => !selectedIds.includes(p._id)));
        setSelectedIds([]);
      } else if (targetId) {
        await API.delete(`/prescriptions/${targetId}`);
        setPrescriptions(prev => prev.filter(p => p._id !== targetId));
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete. Please try again.");
    }
  };

  const cancelDelete = () => {
    setConfirmState({ ...confirmState, show: false });
  };

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return <div className="text-red-400 p-8">{error}</div>;

  const allSelected = filteredPrescriptions.length > 0 && selectedIds.length === filteredPrescriptions.length;
  const showBatchDelete = selectedIds.length > 0;

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] md:p-8 w-full overflow-y-auto custom-scrollbar relative">

      {/* --- Custom Confirmation Dialog (Top Center) --- */}
      {confirmState.show && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-down w-[90%] max-w-md">
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] shadow-2xl rounded-xl p-4 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-red-500/10 p-2 rounded-full text-red-500 shrink-0">
                <Trash2 size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[var(--text-color)]">Confirm Deletion</h3>
                <p className="text-[var(--secondary-color)] text-sm mt-1">{confirmState.message}</p>
              </div>
              <button onClick={cancelDelete} className="text-[var(--secondary-color)] hover:text-[var(--text-color)]">
                <X size={20} />
              </button>
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-[var(--secondary-color)] hover:bg-[var(--bg-color)] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-lg shadow-red-500/20"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header with Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-[var(--text-color)] flex items-center gap-3">
            <FileText className="text-blue-500" />
            My Prescriptions
          </h1>

          <div className="flex items-center gap-3">
            {/* Select All Button */}
            {filteredPrescriptions.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--secondary-color)] hover:text-[var(--text-color)] hover:border-blue-500 transition-all text-sm font-medium"
              >
                {allSelected ? <CheckSquare size={18} className="text-blue-500" /> : <Square size={18} />}
                {allSelected ? "Deselect All" : "Select All"}
              </button>
            )}

            {/* Batch Delete Button */}
            {showBatchDelete && (
              <button
                onClick={initiateBatchDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all text-sm font-bold shadow-lg shadow-red-500/20 animate-fade-in"
              >
                <Trash2 size={18} />
                Delete ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        {filteredPrescriptions.length === 0 ? (
          <div className="text-center py-12 bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)]">
            <FileText size={48} className="mx-auto text-[var(--secondary-color)] mb-4" />
            <p className="text-[var(--secondary-color)] text-lg">
              {prescriptions.length === 0 ? "No prescriptions found." : "No matching prescriptions found."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPrescriptions.map((pres) => {
              const isSelected = selectedIds.includes(pres._id);
              return (
                <div
                  key={pres._id}
                  onClick={() => !confirmState.show && navigate(`/home/prescriptions/${pres._id}`)}
                  className={`group bg-[var(--card-bg)] p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-full relative ${isSelected ? 'border-blue-500 ring-1 ring-blue-500 shadow-md shadow-blue-500/10' : 'border-[var(--border-color)] hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10'}`}
                >
                  {/* Checkbox (Top Left) */}
                  <div
                    onClick={(e) => toggleSelection(pres._id, e)}
                    className="absolute top-4 left-4 z-20 text-[var(--secondary-color)] hover:text-blue-500 cursor-pointer p-1 -ml-1 -mt-1"
                  >
                    {isSelected ? <CheckSquare size={20} className="text-blue-500 fill-blue-500/10" /> : <Square size={20} />}
                  </div>

                  {/* Single Delete Button (Top Right) */}
                  <button
                    onClick={(e) => initiateDelete(pres._id, e)}
                    className="absolute top-4 right-4 p-2 text-red-400 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                    title="Delete Prescription"
                  >
                    <Trash2 size={18} />
                  </button>

                  <div className="mt-8"> {/* Added margin top to clear checkbox */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-blue-500/10 p-3 rounded-lg text-blue-500">
                        <FileText size={24} />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--secondary-color)] font-medium uppercase">
                          {new Date(pres.date || pres.createdAt).toLocaleDateString()}
                        </p>
                        <h3 className="font-bold text-[var(--text-color)] text-lg line-clamp-1">
                          {pres.doctor?.name || "Unknown Doctor"}
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-[var(--secondary-color)]">
                        <span className="font-medium">Spec:</span> {pres.doctor?.specialization || "General"}
                      </p>
                      <p className="text-sm text-[var(--secondary-color)] line-clamp-2">
                        <span className="font-medium">Diagnosis:</span> {pres.reason || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-[var(--border-color)] flex justify-between items-center text-sm font-medium text-blue-500 group-hover:text-blue-400 transition-colors">
                    <span>View Details</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Prescriptions;