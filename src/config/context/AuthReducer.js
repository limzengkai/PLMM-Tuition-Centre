import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";

const AuthReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN":
      return {
        currentUser: action.payload,
        userRole: action.role, // Include user role in the state
      };
    case "LOGOUT":
      // Sign out the user
      signOut(auth); // Make sure 'auth' is defined in your Firebase configuration
      return {
        currentUser: null,
        userRole: null, // Clear user role upon logout
      };
    case "SET_USER_ROLE":
      return {
        ...state,
        userRole: action.payload, // Update user role in the state
      };
    default:
      return state;
  }
};

export default AuthReducer;
