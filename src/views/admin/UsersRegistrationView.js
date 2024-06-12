import React from "react";

// components
import CardUsersRegistrationView from "../../components/Cards/AdminCard/Users/Registration/CardUsersRegistrationView";


export default function UsersRegistrationView() {
  
  return (
    <>
      <div className="flex flex-wrap">
        <div className="w-full px-4">
          <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
              <CardUsersRegistrationView/>
          </div>
        </div>
      </div>
    </>
  );
}