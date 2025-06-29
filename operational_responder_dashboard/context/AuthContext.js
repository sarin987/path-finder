import React, { createContext, useState, useEffect, useContext } from 'react';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isProduction = process.env.NODE_ENV === 'production';

  // On mount, check for token in cookies
  useEffect(() => {
    try {
      const token = Cookies.get('token');
      const userInfo = Cookies.get('user');
      if (token && userInfo) {
        setUser({ ...JSON.parse(userInfo), token });
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login: save token and user info in cookies and set user
  const login = async (loginResponse) => {
    try {
      if (!loginResponse.token || !loginResponse.user) {
        throw new Error('Invalid login response');
      }
      Cookies.set('token', loginResponse.token, {
        expires: 7,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
      });
      Cookies.set('user', JSON.stringify(loginResponse.user), {
        expires: 7,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
      });
      setUser({ ...loginResponse.user, token: loginResponse.token });
    } catch (err) {
      setUser(null);
      throw err;
    }
  };

  // Logout: remove token and user from cookies and clear user
  const logout = async () => {
    try {
      Cookies.remove('token');
      Cookies.remove('user');
      setUser(null);
    } catch (err) {
      // Optionally log error
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
