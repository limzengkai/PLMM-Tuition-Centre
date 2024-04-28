import React, { useRef, useContext, useState, useEffect } from "react";
import { createPopper } from "@popperjs/core";
import { AuthContext } from "../../config/context/AuthContext";
import Profile from "../../assets/img/profile.jpg"

const UserDropdown = () => {
  const [dropdownPopoverShow, setDropdownPopoverShow] = useState(false);
  const btnDropdownRef = useRef(null);
  const popoverDropdownRef = useRef(null);

  const currentUser = useContext(AuthContext);

  const toggleDropdownPopover = () => {
    setDropdownPopoverShow(!dropdownPopoverShow);
  };

  const closeDropdownPopover = () => {
    setDropdownPopoverShow(false);
  };

  const handleLogout = () => {
    // Implement logout logic here
  };

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

  return (
    <div>
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
                src={currentUser.currentUser.photoURL?currentUser.currentUser.photoURL: Profile}
              />
            )}
          </span>
        </div>
      </button>

      {dropdownPopoverShow && (
        <div
          id="dropdownHover"
          className="absolute bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700"
          ref={popoverDropdownRef}
        >
          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
            <li>
              
              <p>This account login as : {currentUser.currentUser.email}</p>
            </li>
            <li>
              <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white" onClick={handleLogout}>Sign out</a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
