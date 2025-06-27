const TOKEN_KEY = 'token';

// Helper to check if we're running in the browser
const isBrowser = typeof window !== 'undefined';

interface DecodedToken {
  id: string;
  role: string;
  exp?: number;
  branch?: string;
  name?: string;
  defaultPasswordUsed?: boolean;
}

export const setToken = (token: string): void => {
  if (isBrowser) {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

export const getToken = (): string | null => {
  if (!isBrowser) return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = (): void => {
  if (isBrowser) {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const isAuthenticated = (): boolean => {
  try {
    const token = getToken();
    if (!token) {
      return false;
    }
    
    try {
      const decoded = decodeToken(token);
      
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTime) {
        console.warn('Token expired, removing');
        removeToken();
        return false;
      }
      
      // Additional validation check
      if (!decoded.id || !decoded.role) {
        console.warn('Token missing required fields, removing');
        removeToken();
        return false;
      }
      
      return true;
    } catch (decodeError) {
      console.error('Error validating authentication:', decodeError);
      // If token can't be decoded, remove it as it's invalid
      removeToken();
      return false;
    }
  } catch (error) {
    // Catch any unexpected errors in the validation process
    console.error('Unexpected error checking authentication:', error);
    // Safety removal of potentially corrupted token
    try {
      removeToken();
    } catch (removalError) {
      console.error('Error removing token:', removalError);
    }
    return false;
  }
};

export const decodeToken = (token: string): DecodedToken => {
  try {
    // Validate token input
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token: token must be a non-empty string');
    }
    
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid token format: token must have three parts');
    }
    
    const base64Url = tokenParts[1];
    if (!base64Url) {
      throw new Error('Invalid token: missing payload section');
    }
    
    // Safe base64 decoding
    try {
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      
      // Try-catch around atob which can throw for invalid input
      let decodedString;
      try {
        decodedString = atob(base64);
      } catch (atobError) {
        throw new Error('Invalid token: payload is not valid base64');
      }
      
      // Safe URI decoding
      const jsonPayload = decodeURIComponent(
        decodedString
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      // Parse JSON with validation
      const parsed = JSON.parse(jsonPayload);
      
      // Basic validation of expected fields
      if (!parsed.id || !parsed.role) {
        console.warn('Token missing important fields (id or role)');
      }
      
      return parsed;
    } catch (decodingError) {
      console.error('Error during token payload decoding:', decodingError);
      throw new Error('Failed to decode token payload');
    }
  } catch (error: any) {
    // Include more details in the error
    console.error('Token decode error:', error?.message || 'Unknown error');
    throw new Error(`Failed to decode token: ${error?.message || 'Unknown error'}`);
  }
};