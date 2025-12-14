import { API, getActiveUser } from "../authservices/authservice";



export const searchDoctors = async (query = {}) => {
  try {
    const params = new URLSearchParams(query).toString();
    const res = await API.get(`/doctors${params ? `?${params}` : ""}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Server Error" };
  }
};

export const getDoctorById = async (id) => {
  try {
    const res = await API.get(`/doctors/${id}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Server Error" };
  }
};

export const getMyProfile = async () => {
  try {
    const res = await API.get(`/doctors/me`);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Server Error" };
  }
};

export const updateMyProfile = async (data) => {
  try {
    const res = await API.put(`/doctors/me`, data);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Server Error" };
  }
};

export const getCalendarStats = async (month, year) => {
  try {
    const res = await API.get(`/doctors/calendar/stats?month=${month}&year=${year}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Server Error" };
  }
};

export const getAppointmentsByDate = async (date) => {
  try {
    const res = await API.get(`/doctors/calendar/appointments?date=${date}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Server Error" };
  }
};

// Notes Services
export const getQuickNotes = async () => {
  try {
    const user = getActiveUser();
    if (!user || (!user.id && !user._id)) return [];

    // Backend expects an ID in the URL. For now, use the logged-in user's ID.
    // Note: The backend route is /:doctorId, so we pass the user ID.
    const id = user.id || user._id;
    const res = await API.get(`/notes/${id}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching notes", err);
    return [];
  }
};

export const createQuickNote = async (text) => {
  try {
    const user = getActiveUser();
    if (!user || (!user.id && !user._id)) throw new Error("User not found");

    const id = user.id || user._id;
    const res = await API.post("/notes", {
      doctorId: id,
      text: text
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Failed to create note" };
  }
};

export const deleteQuickNote = async (id) => {
  try {
    const res = await API.delete(`/notes/${id}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Failed to delete note" };
  }
};

export default {
  searchDoctors,
  getDoctorById,
  getMyProfile,
  updateMyProfile,
  getCalendarStats,
  getAppointmentsByDate,
  getQuickNotes,
  createQuickNote,
  deleteQuickNote
};
