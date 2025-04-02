import { apiRequest } from "./queryClient";
import { LoginData, InsertUser } from "@shared/schema";

export const login = async (data: LoginData) => {
  const res = await apiRequest("POST", "/api/auth/login", data);
  return res.json();
};

export const register = async (data: InsertUser) => {
  const res = await apiRequest("POST", "/api/auth/register", data);
  return res.json();
};

export const getUser = async () => {
  const res = await apiRequest("GET", "/api/auth/user");
  return res.json();
};

export const logout = async () => {
  const res = await apiRequest("POST", "/api/auth/logout");
  return res.json();
};
