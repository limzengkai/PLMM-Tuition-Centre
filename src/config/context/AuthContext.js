import { createContext, useEffect, useState } from "react";
import { auth, db } from "../../config/firebase";
import {
  confirmPasswordReset,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  sendEmailVerification,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import CardLoading from "../../components/Cards/CardLoading";

const AuthContext = createContext();

const AuthContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Listen for authentication state changes
        onAuthStateChanged(auth, async (user) => {
          setCurrentUser(user);
          if (user) {
            try {
              const userRoleDoc = await getDoc(doc(db, "users", user.uid));
              if (userRoleDoc.exists()) {
                const userData = userRoleDoc.data();
                user.role = userData.role;
                setUserRole(userData.role);
                setEmailVerified(user.emailVerified);
              }
            } catch (error) {
              console.error("Error fetching user role:", error);
            }
          } else {
            setUserRole(null);
          }
          setLoading(false);
        });
      } catch (error) {
        console.error("Error initializing authentication:", error);
      }
    };

    initializeAuth();
  }, []);

  async function logIn(email, password) {
    // Set local persistence before attempting to sign in
    return await setPersistence(auth, browserLocalPersistence)
      .then(() => {
        // Sign in with email and password
        return signInWithEmailAndPassword(auth, email, password);
      })
      .catch((error) => {
        console.error("Error setting persistence:", error);
        // If there's an error, return a rejected promise
        return Promise.reject(error);
      });
  }

  function verifyEmail() {
    return sendEmailVerification(currentUser).then(() => {
      console.log("Email verification sent!");
    }).catch((error) => {
      console.error("Error sending email verification:", error);
    } );
  }

  function forgotPassword(email) {
    return sendPasswordResetEmail(auth, email, {
      url: "http://localhost:3000/login",
    });
  }

  function resetPassword(oobCode, newPassword) {
    return confirmPasswordReset(auth, oobCode, newPassword);
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userRole,
        emailVerified,
        logIn,
        forgotPassword,
        resetPassword,
        verifyEmail,
      }}
    >
      {loading ? <CardLoading /> : children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthContextProvider };