import React, { useContext, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { AuthContext } from "../../config/context/AuthContext";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Login() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  function useQuery() {
    return new URLSearchParams(useLocation().search);
  }

  const { resetPassword } = useContext(AuthContext);
  const query = useQuery();

  const validatePassword = (password) => {
    const regex = /^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])(?=.*?[^a-zA-Z0-9]).{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
  
    if (!validatePassword(password)) {
      setError("Password must contain at least 1 uppercase letter, 1 digit, 1 special character, and have a minimum length of 8 characters");
      setLoading(false);
      return;
    }
  
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
  
    try {
      await resetPassword(query.get("oobCode"), password);
      toast.success("Password reset successful");
      navigate("/auth/login");
    } catch (error) {
      setError("Error sending email");
      toast.error("There is an error resetting your password. Please try again.");
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
                <div className="bg-red-600 mx-6 my-2 p-4 rounded">
                    {/* Password rule */}
                    <h1 className="text-white font-bold">
                        Your password must meet the following requirements:
                    </h1>
                    <ul className="text-white md:text-normal sm:text-sm text-sm">
                      <li>At least 1 lowercase letter (a - z)</li>
                      <li>At least 1 uppercase letter (A - Z)</li>
                      <li>At least 1 number (0 - 9)</li>
                      <li>At least 1 special character</li>
                    </ul>
                </div>
              <div className="flex-auto px-4 lg:px-10 py-10 pt-0">
                <form>
                  <h1 className="text-3xl font-bold text-center mb-6">
                    RESET PASSWORD
                  </h1>
                  <div className="relative w-full mb-3">
                    <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                      Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <div className="flex items-center mt-4">
                        <input
                            id="customCheckPassword"
                            type="checkbox"
                            className="form-checkbox border-0 rounded text-blueGray-700 w-5 h-5 ease-linear transition-all duration-150"
                            checked={showPassword}
                            onChange={() => setShowPassword(!showPassword)}
                        />
                        <label
                            htmlFor="customCheckPassword"
                            className="ml-2 text-sm font-semibold text-blueGray-600 cursor-pointer"
                        >
                        Show Password
                        </label>
                    </div>
                    <label className="mt-4 block uppercase text-blueGray-600 text-xs font-bold mb-2">
                      Confirm Password
                    </label>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (password !== e.target.value) {
                          setError("Passwords do not match");
                        } else {
                          setError("");
                        }
                      }}
                    />
                    <div className="flex items-center mt-4">
                        <input
                            id="customCheckConfirmPassword"
                            type="checkbox"
                            className="form-checkbox border-0 rounded text-blueGray-700 w-5 h-5 ease-linear transition-all duration-150"
                            checked={showConfirmPassword}
                            onChange={() => setShowConfirmPassword(!showConfirmPassword)}
                        />
                        <label
                            htmlFor="customCheckConfirmPassword"
                            className="ml-2 text-sm font-semibold text-blueGray-600 cursor-pointer"
                        >
                        Show Password
                        </label>
                    </div>
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
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
}
