// This is the central configuration file for your API.
// The API base URL is now configured via an environment variable for security and flexibility.
//
// To set it up, create a file named `.env` in the root of your project and add the following line:
// REACT_APP_API_BASE_URL='https://farm-mamagerment-system.onrender.com/api/v1'

/**
 * The base URL for all API requests.
 * 
 * It is read from the `REACT_APP_API_BASE_URL` environment variable.
 * If the variable is not set, it will default to the production URL, 
 * but it is highly recommended to configure it in a .env file.
 */
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://farm-mamagerment-system.onrender.com/api/v1';