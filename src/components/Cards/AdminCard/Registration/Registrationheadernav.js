import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import Swal from "sweetalert2";

function RegistrationheaderNav() {
  const [selectedFunction, setSelectedFunction] = useState("management");
  const location = useLocation();

  return (
    <>
      <div className="flex justify-between mb-3 border-t border-gray-300 pt-3">
        {/* Management and Registration Tabs */}
        <div className="flex">
          <Link
            to="/admin/users"
            className={
              " rounded-l-lg font-bold py-2 px-4" +
              (location.pathname === "/admin/users"
                ? " bg-blue-500 text-white hover:text-lightBlue-100"
                : " text-black  hover:bg-blue-500 hover:text-white")
            }
            onClick={() => setSelectedFunction("management")}
          >
            Management
          </Link>

          <Link
            to="/admin/users/registration"
            className={
              " rounded-r-lg font-bold py-2 px-4 m-0" +
              (location.pathname.includes("/admin/users/registration")
                ? "  bg-blue-500 text-white hover:text-lightBlue-100"
                : " text-black  hover:bg-blue-500 hover:text-white")
            }
            onClick={() => setSelectedFunction("registration")}
          >
            Registration
          </Link>
        </div>
        <div>
          <button
            className="m-0 p-4 rounded-lg text-black bg-yellow-400 font-bold py-2 px-4"
            onClick={() => {}}
            style={{ marginLeft: "1rem" }}
          >
            Add User
          </button>
        </div>
      </div>

      <div className="flex justify-between border-t border-gray-300 pt-3">
        {/* Additional Registration Tabs */}
        <div className="flex">
          <Link
            to="/admin/users/registration"
            className={
              " rounded-l-lg font-bold py-2 px-4 m-0" +
              (location.pathname === "/admin/users/registration"
                ? "  bg-blue-100 text-black hover:text-lightBlue-100"
                : " text-black  hover:bg-blue-100 ")
            }
            onClick={() => setSelectedFunction("registration")}
          >
            Active Registration
          </Link>

          <Link
            to="/admin/users/registration/rejected"
            className={
              " font-bold py-2 px-4" +
              (location.pathname === "/admin/users/registration/rejected"
                ? "  bg-blue-100 text-black hover:text-lightBlue-100"
                : " text-black  hover:bg-blue-100 ")
            }
            onClick={() => setSelectedFunction("registration")}
          >
            Rejected Registration
          </Link>
          <Link
            to="/admin/users/registration/approved"
            className={
              " rounded-r-lg font-bold py-2 px-4" +
              (location.pathname === "/admin/users/registration/approved"
                ? "  bg-blue-100 text-black hover:text-lightBlue-100"
                : " text-black  hover:bg-blue-100 ")
            }
            onClick={() => setSelectedFunction("registration")}
          >
            Approved Registration
          </Link>
        </div>
      </div>
    </>
  );
}

export default RegistrationheaderNav;
