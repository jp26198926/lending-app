# Mobile App Integration Guide (Expo/React Native)

## Overview

Your API now supports **dual authentication** for both web browsers and mobile apps:

- **Web Browsers**: HTTP-only cookies (secure, automatic)
- **Mobile Apps (Expo)**: Bearer tokens (manual token management)

The API automatically detects the client type and responds accordingly.

---

## 🚀 Quick Start for Expo/React Native

### 1. Installation

```bash
# Install required packages
npm install axios expo-secure-store
# or
yarn add axios expo-secure-store
```

### 2. Setup Axios Instance

Create `src/api/client.js`:

```javascript
import axios from "axios";
import * as SecureStore from "expo-secure-store";

// Use your computer's local IP for testing on real device
// Use localhost for iOS simulator
// Use 10.0.2.2 for Android emulator
const API_URL = __DEV__
  ? "http://192.168.1.100:3000" // Replace with your IP
  : "https://api.yourdomain.com";

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
    "X-Client-Type": "mobile", // Important: Identifies mobile client
  },
});

// Request interceptor: Add Bearer token to all requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor: Handle 401 errors (token expired)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and redirect to login
      await SecureStore.deleteItemAsync("auth_token");
      await SecureStore.deleteItemAsync("user_data");
      // Navigate to login screen (implement based on your navigation)
      // navigation.navigate('Login');
    }
    return Promise.reject(error);
  },
);

export default apiClient;
```

### 3. Authentication Service

Create `src/services/authService.js`:

```javascript
import apiClient from "../api/client";
import * as SecureStore from "expo-secure-store";

export const authService = {
  // Login
  async login(email, password) {
    try {
      const response = await apiClient.post("/auth/login", {
        email,
        password,
      });

      const { token, user, permissions } = response.data;

      // Store token securely
      await SecureStore.setItemAsync("auth_token", token);

      // Store user data
      await SecureStore.setItemAsync("user_data", JSON.stringify(user));

      // Store permissions
      await SecureStore.setItemAsync(
        "permissions",
        JSON.stringify(permissions),
      );

      return {
        success: true,
        user,
        permissions,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Login failed",
      };
    }
  },

  // Logout
  async logout() {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear all stored data
      await SecureStore.deleteItemAsync("auth_token");
      await SecureStore.deleteItemAsync("user_data");
      await SecureStore.deleteItemAsync("permissions");
    }
  },

  // Check session
  async checkSession() {
    try {
      const response = await apiClient.get("/auth/session");
      return {
        authenticated: true,
        user: response.data.user,
        permissions: response.data.permissions,
      };
    } catch (error) {
      return {
        authenticated: false,
        user: null,
      };
    }
  },

  // Get current user
  async getCurrentUser() {
    const userData = await SecureStore.getItemAsync("user_data");
    return userData ? JSON.parse(userData) : null;
  },

  // Get token
  async getToken() {
    return await SecureStore.getItemAsync("auth_token");
  },

  // Check if user is authenticated
  async isAuthenticated() {
    const token = await SecureStore.getItemAsync("auth_token");
    return !!token;
  },
};
```

### 4. Example Login Screen

```javascript
import React, { useState } from "react";
import { View, TextInput, Button, Text, Alert } from "react-native";
import { authService } from "../services/authService";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);
    const result = await authService.login(email, password);
    setLoading(false);

    if (result.success) {
      Alert.alert("Success", "Login successful!");
      navigation.replace("Home");
    } else {
      Alert.alert("Error", result.error);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 20 }}
      />

      <Button
        title={loading ? "Loading..." : "Login"}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  );
}
```

### 5. Making API Calls

```javascript
import apiClient from "../api/client";

// Example: Fetch users
export const fetchUsers = async () => {
  try {
    const response = await apiClient.get("/admin/user");
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Example: Create user
export const createUser = async (userData) => {
  try {
    const response = await apiClient.post("/admin/user", userData);
    return response.data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

// Example: Update user
export const updateUser = async (userId, userData) => {
  try {
    const response = await apiClient.put(`/admin/user/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// Example: Delete user
export const deleteUser = async (userId, reason) => {
  try {
    const response = await apiClient.delete(`/admin/user/${userId}`, {
      data: { reason },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};
```

---

## 🔧 Configuration

### Backend Configuration

**Update `.env.local`** to include your mobile app origins:

```env
# For local development - use your computer's local IP address
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100:3000,exp://192.168.1.100:19000

# For production
ALLOWED_ORIGINS=https://api.yourdomain.com,exp://your-expo-app
```

### Finding Your Local IP Address

**Windows:**

```bash
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

**Mac/Linux:**

```bash
ifconfig
# Look for "inet" under your active network interface
```

**Expo:**

```bash
# Your IP is shown when you run expo start
expo start
# Look for "Metro waiting on exp://192.168.x.x:19000"
```

---

## 📱 Platform-Specific Configuration

### iOS Simulator

- Use `http://localhost:3000` (localhost works)
- Simulator shares network with host machine

### Android Emulator

- Use `http://10.0.2.2:3000` (special alias for host machine)
- Or use your computer's local IP: `http://192.168.1.100:3000`

### Real Device (iOS/Android)

- **Must** use your computer's local IP address
- Both devices must be on the **same WiFi network**
- Use `http://192.168.1.100:3000` (replace with your IP)

### Expo Go App

- Use your computer's local IP
- Format: `exp://192.168.1.100:19000` for Expo origins

---

## 🔐 Authentication Flow

### 1. Login Flow

```
User enters credentials
    ↓
App sends POST /api/auth/login
Headers: X-Client-Type: mobile
    ↓
API detects mobile client
    ↓
API returns: { token, user, permissions }
(No cookie set for mobile)
    ↓
App stores token in SecureStore
    ↓
User redirected to home screen
```

### 2. Authenticated Request Flow

```
User makes API request
    ↓
Axios interceptor adds header:
Authorization: Bearer <token>
    ↓
API validates Bearer token
    ↓
API returns data
```

### 3. Token Expiration Flow

```
User makes API request
    ↓
Token expired
    ↓
API returns 401
    ↓
Axios interceptor catches error
    ↓
Clear stored token/data
    ↓
Redirect to login screen
```

---

## 🧪 Testing

### Test Login

```javascript
import { authService } from "./services/authService";

// In your component or test file
const testLogin = async () => {
  const result = await authService.login("test@example.com", "password123");

  console.log("Login result:", result);
  // Should return: { success: true, user: {...}, permissions: [...] }
};
```

### Test API Call

```javascript
import apiClient from "./api/client";

const testApiCall = async () => {
  try {
    const response = await apiClient.get("/admin/dashboard");
    console.log("Dashboard data:", response.data);
  } catch (error) {
    console.error("API error:", error.response?.data);
  }
};
```

### Debug Bearer Token

```javascript
import * as SecureStore from "expo-secure-store";

const debugToken = async () => {
  const token = await SecureStore.getItemAsync("auth_token");
  console.log("Current token:", token);

  // Decode token (don't use in production - just for debugging)
  if (token) {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString(),
    );
    console.log("Token payload:", payload);
    console.log("Token expires:", new Date(payload.exp * 1000));
  }
};
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Network request failed"

**Problem:** App can't reach the API

**Solutions:**

- ✅ Check if backend is running (`npm run dev`)
- ✅ Verify you're using correct IP address
- ✅ Ensure phone and computer are on same WiFi
- ✅ Check firewall settings (allow port 3000)
- ✅ Try with real device instead of emulator

### Issue 2: CORS Error

**Problem:** `Access-Control-Allow-Origin` error

**Solutions:**

- ✅ Add mobile app origin to `ALLOWED_ORIGINS` in `.env.local`
- ✅ Ensure `X-Client-Type: mobile` header is sent
- ✅ Restart backend after changing `.env.local`
- ✅ Check if origin includes protocol (http://)

### Issue 3: 401 Unauthorized

**Problem:** Token not being sent or invalid

**Solutions:**

- ✅ Check if token is stored: `await SecureStore.getItemAsync('auth_token')`
- ✅ Verify axios interceptor is adding Authorization header
- ✅ Check if token expired (default: 7 days)
- ✅ Ensure `X-Client-Type: mobile` header is present

### Issue 4: Token Not Returned on Login

**Problem:** Login successful but no token in response

**Solutions:**

- ✅ Verify `X-Client-Type: mobile` header is sent in login request
- ✅ Check backend logs for mobile client detection
- ✅ Update axios instance to include the header

---

## 🔒 Security Best Practices

### 1. Token Storage

✅ **DO:** Use `expo-secure-store` for token storage  
❌ **DON'T:** Use AsyncStorage (not encrypted)

### 2. Token Transmission

✅ **DO:** Always use HTTPS in production  
✅ **DO:** Send token in Authorization header  
❌ **DON'T:** Send token in URL parameters

### 3. Token Refresh

✅ **DO:** Implement automatic token refresh  
✅ **DO:** Clear token on logout or expiration  
❌ **DON'T:** Store tokens indefinitely

### 4. API Configuration

✅ **DO:** Use environment variables for API URL  
✅ **DO:** Different configs for dev/staging/production  
❌ **DON'T:** Hardcode API URLs

---

## 📦 Production Deployment

### Backend Configuration

```env
# Production .env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=https://api.yourdomain.com,exp://your-expo-app
NODE_ENV=production
```

### Mobile App Configuration

```javascript
// src/config/api.js
const getApiUrl = () => {
  if (__DEV__) {
    // Development
    return "http://192.168.1.100:3000";
  }

  // Production
  return "https://api.yourdomain.com";
};

export const API_URL = getApiUrl();
```

### Expo EAS Build

```json
// app.json
{
  "expo": {
    "extra": {
      "apiUrl": "https://api.yourdomain.com"
    }
  }
}
```

Access in code:

```javascript
import Constants from "expo-constants";
const API_URL = Constants.expoConfig.extra.apiUrl;
```

---

## 📝 API Response Format

### Login Response (Mobile)

```json
{
  "message": "Login successful",
  "user": {
    "_id": "userId",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "1234567890",
    "roleId": {
      "_id": "roleId",
      "role": "Admin"
    },
    "status": "ACTIVE"
  },
  "permissions": [
    {
      "page": {
        "_id": "pageId",
        "page": "Users",
        "path": "/admin/user"
      },
      "permissions": [
        { "permission": "View" },
        { "permission": "Add" },
        { "permission": "Edit" }
      ]
    }
  ],
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": "7d"
}
```

### Login Response (Web)

```json
{
  "message": "Login successful",
  "user": { ... },
  "permissions": [ ... ]
}
// Note: No token field - uses HTTP-only cookie instead
```

---

## 🎯 Summary

✅ **Authentication:** Dual strategy (cookies for web, Bearer tokens for mobile)  
✅ **Token Management:** Automatic with axios interceptors  
✅ **Security:** Tokens stored in expo-secure-store  
✅ **CORS:** Dynamic configuration via environment variables  
✅ **Client Detection:** Automatic via X-Client-Type header  
✅ **Error Handling:** 401 interceptor handles token expiration

Your API is now fully ready for mobile app integration! 🚀
