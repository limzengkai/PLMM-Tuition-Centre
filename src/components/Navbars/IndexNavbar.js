import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../../config/context/AuthContext.js";

export default function Navbar() {
  const [navbarOpen, setNavbarOpen] = React.useState(false);
  const { currentUser } = useContext(AuthContext);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || (path === "/classes" && location.pathname.startsWith("/classes"));
  };

  return (
    <>
      <nav className="top-0 fixed mb-20 z-50 w-full flex flex-wrap items-center justify-between px-2 py-3 navbar-expand-lg bg-white shadow">
        <div className="container px-4 mx-auto flex flex-wrap items-center justify-between">
          <div className="w-full relative flex justify-between lg:w-auto lg:static lg:block lg:justify-start">
            <Link
              to="/"
              className="text-blueGray-700 text-sm font-bold leading-relaxed inline-block mr-4 py-2 whitespace-nowrap uppercase"
            >
              PLMM Tuition Center
            </Link>
            <button
              className="cursor-pointer text-xl leading-none px-3 py-1 border border-solid border-transparent rounded bg-transparent block lg:hidden outline-none focus:outline-none"
              type="button"
              onClick={() => setNavbarOpen(!navbarOpen)}
            >
              {navbarOpen ? (
                <i className="fas fa-close"></i>
              ) : (
                <i className="fas fa-bars"></i>
              )}
            </button>
          </div>
          <div
            className={
              "lg:flex md:h-auto flex-grow items-center bg-white lg:bg-opacity-0 lg:shadow-none" +
              (navbarOpen ? " block h-screen " : " hidden")
            }
            id="example-navbar-warning"
          >
            <ul className="flex flex-col lg:flex-row list-none lg:ml-auto lg:mr-auto">
              <li className="flex items-center">
                <Link
                  to={"/"}
                  className={`hover:text-blueGray-500 hover:text-sm hover:underline text-blueGray-700 px-3 py-4 lg:py-2 flex items-center text-xs uppercase font-bold ${
                    isActive("/") ? "underline" : ""
                  }`}
                >
                  <span>Home</span>
                </Link>
              </li>
              <li className="flex items-center">
                <Link
                  to={"/classes"}
                  className={`hover:text-blueGray-500 hover:text-sm hover:underline text-blueGray-700 px-3 py-4 lg:py-2 flex items-center text-xs uppercase font-bold ${
                    isActive("/classes") ? "underline" : ""
                  }`}
                >
                  <span>Classes</span>
                </Link>
              </li>
              <li className="flex items-center">
                <Link
                  to={"/teachers"}
                  className={`hover:text-blueGray-500 hover:text-sm hover:underline text-blueGray-700 px-3 py-4 lg:py-2 flex items-center text-xs uppercase font-bold ${
                    isActive("/teachers") ? "underline" : ""
                  }`}
                >
                  <span>Teacher</span>
                </Link>
              </li>
              <li className="flex items-center">
                <Link
                  to={"/about-us"}
                  className={`hover:text-blueGray-500 hover:text-sm hover:underline text-blueGray-700 px-3 py-4 lg:py-2 flex items-center text-xs uppercase font-bold ${
                    isActive("/about-us") ? "underline" : ""
                  }`}
                >
                  <span>About Us</span>
                </Link>
              </li>
              <li className="flex items-center">
                <Link
                  to={"/registration"}
                  className={`hover:text-blueGray-500 hover:text-sm hover:underline text-blueGray-700 px-3 py-4 lg:py-2 flex items-center text-xs uppercase font-bold ${
                    isActive("/registration") ? "underline" : ""
                  }`}
                >
                  <span>Registration</span>
                </Link>
              </li>
            </ul>
            <ul className="flex flex-col lg:flex-row list-none lg:ml-auto">
              {currentUser ? (
                <li className="flex items-center">
                  <Link
                    to={
                      currentUser.role === "admin"
                        ? "/admin/dashboard"
                        : currentUser.role === "teacher"
                        ? "/teacher/dashboard"
                        : "/parent/dashboard"
                    }
                    className="hover:text-blueGray-400 hover:bg-green-400 bg-green-300 rounded-full text-blueGray-700 px-3 py-4 lg:py-2 flex items-center text-xs uppercase font-bold"
                  >
                    <span>Dashboard</span>
                  </Link>
                </li>
              ) : (
                <li className="flex items-center">
                  <Link
                    to={"/auth/login"}
                    className="hover:text-blueGray-500 text-blueGray-700 px-3 py-4 lg:py-2 flex items-center text-xs uppercase font-bold"
                  >
                    Login
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}
