import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { EmailAuthProvider, getAuth, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { AuthContext } from "../../config/context/AuthContext";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const role = currentUser.role;

  const validatePassword = (password) => {
    const regex = /^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])(?=.*?[^a-zA-Z0-9]).{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Check if the new password and confirm new password match
    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match");
      setLoading(false);
      return;
    }

    if (!validatePassword(newPassword)) {
      setError("Password must contain at least 1 uppercase letter, 1 digit, 1 special character, and have a minimum length of 8 characters");
      setLoading(false);
      return;
    }

    // Get the current user
    const auth = getAuth();
    const user = auth.currentUser;

    // Create a credential with the current user's email and password
    const credential = EmailAuthProvider.credential(user.email, currentPassword);

    try {
      // Re-authenticate the user with the credential
      await reauthenticateWithCredential(user, credential);

      // If re-authentication is successful, update the password
      await updatePassword(user, newPassword);

      // Show success message
      toast.success("Password changed successfully!");

      navigate("/"+role+"/dashboard");
    } catch (error) {
      setError("Error changing password");
      toast.error("There was an error changing your password. Please try again.");
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
                  Your new password must meet the following requirements:
                </h1>
                <ul className="text-white md:text-normal sm:text-sm text-sm">
                  <li>At least 1 lowercase letter (a - z)</li>
                  <li>At least 1 uppercase letter (A - Z)</li>
                  <li>At least 1 number (0 - 9)</li>
                  <li>At least 1 special character</li>
                  <li>At least 8 character length</li>
                </ul>
              </div>
              <div className="flex-auto px-4 lg:px-10 py-10 pt-0">
                <form onSubmit={handleSubmit}>
                  <h1 className="text-3xl font-bold text-center mb-6">
                    Change Your Password
                  </h1>
                  <div className="relative w-full mb-3">
                    <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      placeholder="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="relative w-full mb-3">
                    <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="relative w-full mb-3">
                    <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      placeholder="Confirm New Password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  {error && (
                    <span className="text-red-500 text-xs">{error}</span>
                  )}
                  <div className="text-center mt-6 bg-slate-600 rounded-lg">
                    <button
                      className="bg-blueGray-800 text-white active:bg-blueGray-600 text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 w-full ease-linear transition-all duration-150"
                      type="submit"
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
};

export default ChangePassword;
