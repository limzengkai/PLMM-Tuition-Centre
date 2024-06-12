import React from "react";
import { useLocation } from "react-router-dom";

// components
import CardUsersManagementView from "../../components/Cards/AdminCard/Users/Management/CardUsersManagementView";
import CardUsersManagementEdit from "../../components/Cards/AdminCard/Users/Management/CardUsersManagementEdit";
import CardAddUser from "../../components/Cards/AdminCard/Users/Management/CardAddUser";

export default function Users() {
  const location = useLocation();
  
  return (
    <>
      <div className="flex flex-wrap">
        <div className="w-full px-4">
          <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
            {location.pathname.startsWith("/admin/users/view/") ? <CardUsersManagementView/> :location.pathname.startsWith("/admin/users/edit/")? <CardUsersManagementEdit/>: <CardAddUser/>}
          </div>
        </div>
      </div>
    </>
  );
}