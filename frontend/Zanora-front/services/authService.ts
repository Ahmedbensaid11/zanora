
const BASE_URL = 'http://192.168.0.109:8080/api/auth';
const BASE_URL2 = 'http://192.168.0.109:8080/api';


export interface AuthTokenResponse {
  token: string;
}

export interface UserDto {
  id: number;
  username: string;
  email: string;
  city?: string;
  isActive: boolean;
  createdAt: string;
  profileImg?: string;
  role?: {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
    color?: string;
  };
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  city?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}



const handleResponse = async (response: Response): Promise<string> => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return response.text();
};

export const loginWithCredentials = async (
  email: string,
  password: string
): Promise<AuthTokenResponse> => {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (response.status === 401) {
    const message = await response.text();
    throw new Error(message || 'Account suspended or invalid credentials');
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Login failed');
  }

  return response.json() as Promise<AuthTokenResponse>;
};


export const registerUser = async (
  userData: RegisterPayload
): Promise<AuthTokenResponse> => {
  const response = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Registration failed');
  }

  return response.json() as Promise<AuthTokenResponse>;
};


export const getCurrentUser = async (token: string): Promise<UserDto> => {
  const response = await fetch(`${BASE_URL}/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) throw new Error('Failed to fetch user profile');
  return response.json() as Promise<UserDto>;
};

export const changePassword = async (
  token: string,
  payload: ChangePasswordPayload
): Promise<string> => {
  const response = await fetch(`${BASE_URL}/change-password`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

export const loginWithGoogleUserInfo = async (
  userInfo: GoogleUserInfo
): Promise<AuthTokenResponse> => {
  const response = await fetch(`${BASE_URL2}/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userInfo.email,
      name: userInfo.name,
      googleId: userInfo.id,
      picture: userInfo.picture,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Google login failed');
  }

  return response.json() as Promise<AuthTokenResponse>;
};