export interface UserDoc {
  id: string;
  email: string;
  displayName: string;
  role: "admin" | "member";
  avatar: string;
  spaceIds: string[];
  phone: string;
  countryCode: string;
  shiftEnd: string;
  shiftReminderSent: boolean;
  createdAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  displayName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserDoc;
}
