export interface UserResponse {
  UserID: number;
  Name: string;
  Username: string;
  Email: string;
  Password: string;
  Role: string;
}

export interface UserRequest {
  name: string;
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}