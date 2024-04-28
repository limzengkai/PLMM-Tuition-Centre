import React, { useContext, useState } from "react";
import { db } from "../../config/firebase";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../config/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";

export default function Login() {
  const [error, setError] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { logIn } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(false);
    setLoading(true);
    try {
      const userCredential = await logIn(email, password);
      const user = userCredential.user;
      // Proceed with the rest of the login process
      if (user) {
        const userRoleDoc = await getDoc(doc(db, "users", user.uid));
        if (userRoleDoc.exists()) {
          const userData = userRoleDoc.data();
          // Directly redirect to the dashboard based on the user's role
          redirectBasedOnRole(userData.role);
          return; // Exit the function to prevent further execution
        }
      }
      // If user role is not determined, default to "/"
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      setError(true); // Set error state to display error message
    } finally {
      setLoading(false);
    }
  };

  const redirectBasedOnRole = (role) => {
    switch (role) {
      case "admin":
        navigate("/admin/dashboard");
        break;
      case "parent":
        navigate("/parent/dashboard");
        break;
      case "teacher":
        navigate("/teacher/dashboard");
        break;
      default:
        navigate("/");
    }
  };

  return (
    <div className="container mx-auto px-4 h-full">
      <div className="flex content-center items-center justify-center h-full">
        <div className="w-full lg:w-4/12 px-4">
          <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-200 border-0">
            <div className="rounded-t mb-0 px-6 py-6">
              <div className="text-center mb-3">
                <h6 className="text-blueGray-500 text-sm font-bold">
                  Sign in with
                </h6>
              </div>
              <div className="btn-wrapper text-center">
                <button
                  className="bg-white active:bg-blueGray-50 text-blueGray-700 px-4 py-2 rounded outline-none focus:outline-none mr-1 mb-1 uppercase shadow hover:shadow-md inline-flex items-center font-bold text-xs ease-linear transition-all duration-150"
                  type="button"
                >
                  <img
                    alt="..."
                    className="w-5 mr-1"
                    src={
                      require("../../assets/img/google.svg").default
                    }
                  />
                  Google
                </button>
              </div>
              <hr className="mt-6 border-b-1 border-blueGray-300" />
            </div>

            <div className="flex-auto px-4 lg:px-10 py-10 pt-0">
              <div className="text-blueGray-400 text-center mb-3 font-bold">
                <small>Or sign in with credentials</small>
              </div>
              {error && (
                <div className="text-red-500 text-center">
                  <h1>Wrong Email or Password</h1>
                </div>
              )}
              <form>
                <div className="relative w-full mb-3">
                  <label
                    className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                    htmlFor="grid-password"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                    placeholder="Email"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="relative w-full mb-3">
                  <label
                    className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                    htmlFor="grid-password"
                  >
                    Password
                  </label>
                  <div className="flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      placeholder="Password"
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center mt-4">
                    <input
                      id="customCheckLogin"
                      type="checkbox"
                      className="form-checkbox border-0 rounded text-blueGray-700 w-5 h-5 ease-linear transition-all duration-150"
                      checked={showPassword}
                      onChange={() => setShowPassword(!showPassword)}
                    />
                    <label
                      htmlFor="customCheckLogin"
                      className="ml-2 text-sm font-semibold text-blueGray-600 cursor-pointer"
                    >
                      Show Password
                    </label>
                  </div>
                </div>

                <div className="text-center mt-6">
                  <button
                    className="bg-blueGray-800 text-white active:bg-blueGray-600 text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 w-full ease-linear transition-all duration-150"
                    type="submit"
                    onClick={handleLogin}
                  >
                    {loading ? "Sign In ..." : "Sign In"}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="flex flex-wrap mt-6 relative">
            <div className="w-1/2">
              <Link
                to="/auth/forgot-password"
                className="text-blueGray-200"
              >
                <small>Forgot password?</small>
              </Link>
            </div>
            <div className="w-1/2 text-right">
              <Link to="/auth/register" className="text-blueGray-200">
                <small>Do a Registration</small>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
