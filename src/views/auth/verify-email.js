import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../config/context/AuthContext";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { verifyEmail } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await verifyEmail(email);
      toast.success("Verification email sent successfully!");
    } catch (error) {
      setError("Error sending verification email: " + error.message);
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full lg:w-4/12 px-4">
        <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-200 border-0">
          <div className="p-3 w-full space-y-8">
            <form>
              <div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                  Email Verification
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                  Your email is not verified. Please check your email and verify
                  your email address. Or click the button below to resend the
                  verification email.
                </p>
              </div>

              <div className="text-center mt-6 bg-slate-600 rounded-lg">
                <button
                  className="bg-blueGray-800 text-white active:bg-blueGray-600 text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 w-full ease-linear transition-all duration-150"
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Sending ..." : "Resend Verification Email"}
                </button>
              </div>
            </form>
            <div className="flex justify-center">
              <hr />
              OR
              <hr />
            </div>
            <div className="text-sm text-center">
              {/* <Link
                to="/auth/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Back to Login
              </Link> */}
              {/* <br /> */}
              <button
                onClick={handleSignOut}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign Out
              </button>
            </div>
          </div>
          <ToastContainer />
        </div>
      </div>
    </div>
  );
}
