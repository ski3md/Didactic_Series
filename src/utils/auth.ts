import { User } from '../types.ts';
import { 
    apiLoginUser, 
    apiChangePassword, 
} from '../api/mockApi.ts';

/**
 * Logs in a user by calling the API.
 * @param username The user's username.
 * @param password The user's password.
 * @returns A promise that resolves to the user object if login is successful.
 * @throws An error if login fails.
 */
export const loginUser = async (username: string, password: string): Promise<User> => {
  return await apiLoginUser(username, password);
};

/**
 * Changes a user's password by calling the API.
 * @param username The user's username.
 * @param oldPassword The user's current password.
 * @param newPassword The new password.
 * @throws An error if the password change fails.
 */
export const changePassword = async (username: string, oldPassword: string, newPassword: string): Promise<void> => {
  await apiChangePassword(username, oldPassword, newPassword);
};