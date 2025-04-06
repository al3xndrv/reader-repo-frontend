import axios from 'axios';

// Define the base URL for the backend API
// In development, this might be http://localhost:5000/api
// In production, it would be your deployed backend URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Interface for Signup Payload
interface SignupPayload {
  username: string;
  email: string;
  password: string;
}

// Interface for Login Payload
interface LoginPayload {
  email: string;
  password: string;
}

// Interface for Login Response (includes the token)
interface LoginResponse {
  token: string;
}

// Interface for Signup Response (includes user details, adjust as needed based on backend)
interface SignupResponse {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

const signup = async (payload: SignupPayload): Promise<SignupResponse> => {
  const response = await axios.post<SignupResponse>(`${API_URL}/auth/signup`, payload);
  return response.data;
};

const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(`${API_URL}/auth/login`, payload);
  // Optionally store the token in localStorage upon successful login
  if (response.data.token) {
    localStorage.setItem('userToken', response.data.token);
  }
  return response.data;
};

const logout = (): void => {
  // Remove the token from localStorage upon logout
  localStorage.removeItem('userToken');
  // Optionally: Send a request to the backend to invalidate the token if needed
};

const getCurrentUserToken = (): string | null => {
  return localStorage.getItem('userToken');
};

const AuthService = {
  signup,
  login,
  logout,
  getCurrentUserToken,
};

export default AuthService; 