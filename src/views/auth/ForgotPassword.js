import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../config/context/AuthContext";
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { forgotPassword } = useContext(AuthContext);

  const validateEmail = (value) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(value);
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    setError(validateEmail(e.target.value) ? "" : "Please enter a valid email address");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
  
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }
  
    try {
      await forgotPassword(email);
      toast.success("Password reset email sent successfully");
    } catch (error) {
      setError("Error sending email");
      console.error("Error sending email:", error);
      toast.error("Failed to send password reset email");
    }
    setLoading(false);
  };

  return (
    <>
      <div className="container mx-auto px-4 h-full">
        <div className="flex content-center items-center justify-center h-full">
          <div className="w-full lg:w-4/12 px-4">
            <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-200 border-0">
              <div className="rounded-t mb-0 px-6 py-6"></div>

              <div className="flex-auto px-4 lg:px-10 py-10 pt-0">
                <form>
                  <h1 className="text-3xl font-bold text-center mb-6">
                    FORGOT PASSWORD
                  </h1>
                  <div className="relative w-full mb-3">
                    <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      placeholder="Email"
                      value={email}
                      onChange={handleChange}
                    />
                    {error && (
                      <span className="text-red-500 text-xs">{error}</span>
                    )}
                  </div>

                  <div className="text-center mt-6 bg-slate-600 rounded-lg">
                    <button
                      className="bg-blueGray-800 text-white active:bg-blueGray-600 text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 w-full ease-linear transition-all duration-150"
                      type="submit"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? "Submitting ..." : "Submit"}
                    </button>
                  </div>
                </form>

                <div className="flex items-center mt-3">
                  <hr className="flex-grow border-b-1 border-blueGray-300" />
                  <span className="mx-3 text-blueGray-500">OR</span>
                  <hr className="flex-grow border-b-1 border-blueGray-300" />
                </div>

                <div className="text-center mt-6">
                  <Link to="/auth/login" className="text-black-700">
                    <small>Back to Login</small>
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap mt-6 relative">
              <div className="w-1/2">
                <a
                  href="#pablo"
                  onClick={(e) => e.preventDefault()}
                  className="text-blueGray-200"
                >
                  <small>Forgot password?</small>
                </a>
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
      <ToastContainer />
    </>
  );
}