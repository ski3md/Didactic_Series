import { User } from '../types';

const USERS_KEY = 'pathology_module_users';

interface StoredUser extends User {
  passwordHash: string; // In a real app, this would be a proper hash. Here it's stored as plain text for simplicity.
  email: string;
  resetToken?: string;
  resetTokenExpires?: number;
}

// Helper to get all users from localStorage
const getUsers = (): Record<string, StoredUser> => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : {};
};

// Helper to save users to localStorage
const saveUsers = (users: Record<string, StoredUser>): void => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

/**
 * Registers a new user.
 * @param username The username for the new user.
 * @param password The password for the new user.
 * @param email The email for the new user.
 * @returns The new user object if successful.
 * @throws An error if the username or email is already taken.
 */
export const registerUser = (username: string, password: string, email: string): User => {
  if (username.toLowerCase() === 'admin') {
    throw new Error('This username is reserved.');
  }
  const users = getUsers();
  if (users[username]) {
    throw new Error('Username is already taken.');
  }
  if (Object.values(users).some(user => user.email === email)) {
    throw new Error('Email is already in use.');
  }


  const newUser: StoredUser = {
    username,
    passwordHash: password, // Storing plain text for this educational module.
    email,
  };

  users[username] = newUser;
  saveUsers(users);

  return { username, email };
};

/**
 * Logs in a user.
 * @param username The user's username.
 * @param password The user's password.
 * @returns The user object if login is successful.
 * @throws An error if the user does not exist or the password is incorrect.
 */
export const loginUser = (username: string, password: string): User => {
  if (username.toLowerCase() === 'admin' && password === 'admin') {
    return { username: 'admin', isAdmin: true, email: 'admin@system.local' };
  }

  const users = getUsers();
  const user = users[username];

  if (!user) {
    throw new Error('User not found.');
  }

  if (user.passwordHash !== password) {
    throw new Error('Incorrect password.');
  }

  return { username: user.username, email: user.email };
};

/**
 * Changes a user's password.
 * @param username The user's username.
 * @param oldPassword The user's current password.
 * @param newPassword The new password.
 * @throws An error if user not found, old password incorrect, or new password is same as old.
 */
export const changePassword = (username: string, oldPassword: string, newPassword: string): void => {
  const users = getUsers();
  const user = users[username];

  if (!user) {
    throw new Error('User not found.');
  }

  if (user.passwordHash !== oldPassword) {
    throw new Error('Incorrect current password.');
  }

  if (oldPassword === newPassword) {
    throw new Error('New password cannot be the same as the old password.');
  }

  user.passwordHash = newPassword;
  saveUsers(users);
};

/**
 * Initiates a password reset by generating a token.
 * @param username The username of the account to reset.
 * @returns The generated reset token.
 * @throws An error if the user is not found.
 */
export const initiatePasswordReset = (username: string): string => {
  const users = getUsers();
  const user = users[username];

  if (!user) {
    throw new Error('No account found with that username.');
  }

  const token = `reset-${Math.random().toString(36).substring(2, 11)}`;
  const expires = Date.now() + 3600000; // Token expires in 1 hour

  user.resetToken = token;
  user.resetTokenExpires = expires;
  saveUsers(users);

  // In a real app, you would email this token. We return it to the UI for this simulation.
  return token;
};

/**
 * Completes the password reset process.
 * @param token The reset token provided to the user.
 * @param newPassword The new password to set.
 * @throws An error if the token is invalid or expired.
 */
export const completePasswordReset = (token: string, newPassword: string): void => {
    const users = getUsers();
    const userToReset = Object.values(users).find(
        (u) => u.resetToken === token && u.resetTokenExpires && u.resetTokenExpires > Date.now()
    );

    if (!userToReset) {
        throw new Error('Invalid or expired reset token.');
    }

    userToReset.passwordHash = newPassword;
    delete userToReset.resetToken;
    delete userToReset.resetTokenExpires;
    
    users[userToReset.username] = userToReset;
    saveUsers(users);
};
