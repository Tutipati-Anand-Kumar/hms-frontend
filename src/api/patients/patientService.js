import { API } from "../authservices/authservice";

export const getProfile = async () => {
  try {
    const res = await API.get(`/patients/profile`);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Server Error" };
  }
};

export const updateProfile = async (data) => {
  try {
    const res = await API.patch(`/patients/profile`, data);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Server Error" };
  }
};

export default { getProfile, updateProfile };
