import * as auth from "../authservices/authservice";

export const registerUser = auth.registerUser;
export const sendOtp = auth.sendOtp;
export const forgotPassword = auth.forgotpasssword;
export const resetPassword = auth.resetPassword;
export const loginUser = auth.loginUser;
export const refreshToken = auth.refreshToken;
export const logoutUser = auth.logoutUser;
export const getCurrentUser = auth.getCurrentUser;

export default {
  registerUser,
  sendOtp,
  forgotPassword,
  resetPassword,
  loginUser,
  refreshToken,
  logoutUser,
  getCurrentUser,
};
