import { API } from "../authservices/authservice";

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

export default {
  searchDoctors,
  getDoctorById,
  getMyProfile,
  updateMyProfile,
  getCalendarStats,
  getAppointmentsByDate
};
