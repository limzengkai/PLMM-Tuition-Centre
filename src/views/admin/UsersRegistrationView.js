import React from "react";

// components
import CardUsersRegistrationView from "../../components/Cards/AdminCard/Users/Registration/CardUsersRegistrationView";
import { useLocation } from "react-router-dom";
import CardUsersRegistrationViewDetails from "../../components/Cards/AdminCard/Users/Registration/CardUsersRegistrationViewDetails";

export default function UsersRegistrationView() {
  const location = useLocation();
  return (
    <>
      <div className="flex flex-wrap">
        <div className="w-full px-4">
          <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
            {location.pathname.startsWith("/admin/users/registration/view/") ? (
              <CardUsersRegistrationViewDetails />
            ) : (
              <CardUsersRegistrationView />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
