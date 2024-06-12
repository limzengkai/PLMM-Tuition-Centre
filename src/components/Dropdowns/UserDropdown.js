import React, { useRef, useContext, useState, useEffect } from "react";
import { AuthContext } from "../../config/context/AuthContext";
import Profile from "../../assets/img/profile.jpg";
import ChangePassword from "../../views/auth/ChangePassword";
import { signOutUser, auth } from "../../config/firebase";
import { Link, useNavigate } from "react-router-dom";

const UserDropdown = () => {
  const [dropdownPopoverShow, setDropdownPopoverShow] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const btnDropdownRef = useRef(null);
  const popoverDropdownRef = useRef(null);
  const navigate = useNavigate();

  const currentUser = useContext(AuthContext);

  const toggleDropdownPopover = () => {
    setDropdownPopoverShow(!dropdownPopoverShow);
  };

  const closeDropdownPopover = () => {
    setDropdownPopoverShow(false);
  };

  const handleLogout = () => {
    signOutUser(auth)
  };

  const openChangePasswordModal = () => {
    setIsChangePasswordModalOpen(true);
    closeDropdownPopover();
  };

  const navigateToPasswordChange = () => {
    closeDropdownPopover();
    navigate("/parent/change-password");
  }

  // Attach event listener to close the dropdown when clicking outside of it
  useEffect(() => {
    const closeDropdownWhenClickOutside = (event) => {
      if (
        btnDropdownRef.current &&
        !btnDropdownRef.current.contains(event.target) &&
        popoverDropdownRef.current &&
        !popoverDropdownRef.current.contains(event.target)
      ) {
        setDropdownPopoverShow(false);
      }
    };

    document.addEventListener("mousedown", closeDropdownWhenClickOutside);

    return () => {
      document.removeEventListener("mousedown", closeDropdownWhenClickOutside);
    };
  }, []);

  // Effect to navigate and close modal when isChangePasswordModalOpen changes
  useEffect(() => {
    if (isChangePasswordModalOpen) {
      navigateToPasswordChange();
      setIsChangePasswordModalOpen(false);
    }
  }, [isChangePasswordModalOpen]);

  return (
    <div className="relative">
      <button
        id="dropdownHoverButton"
        className="border-0 p-0"
        ref={btnDropdownRef}
        onClick={toggleDropdownPopover}
      >
        <div className="items-center flex">
          <span className="text-sm text-white bg-blueGray-200 inline-flex items-center justify-center rounded-full">
            {currentUser && (
              <img
                alt="..."
                className="w-14 h-14 rounded-full align-middle border-none shadow-lg"
                src={
                  currentUser.currentUser.photoURL
                    ? currentUser.currentUser.photoURL
                    : Profile
                }
              />
            )}
          </span>
        </div>
      </button>

      {dropdownPopoverShow && (
        <div
          id="dropdownHover"
          className="absolute right-0 mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow-lg w-56 z-50"
          ref={popoverDropdownRef}
        >
          <div className="py-3 px-4">
            <span className="block text-sm text-gray-900">
              {currentUser.currentUser.email}
            </span>
          </div>
          <div className="pt-2">
            <button
              onClick={openChangePasswordModal}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
            >
              Change Password
            </button>
          </div>
          <div className="">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {isChangePasswordModalOpen && (
        <ChangePassword
          onClose={() => setIsChangePasswordModalOpen(false)}
        />
      )}
    </div>
  );
};

export default UserDropdown;
