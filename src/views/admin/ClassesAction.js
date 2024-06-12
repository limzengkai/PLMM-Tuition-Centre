import React from "react";
import { useLocation } from "react-router-dom";

// components
import CardAdminClassesView from "../../components/Cards/AdminCard/CardAdminClassesView";
import CardAdminClassesAdd from "../../components/Cards/AdminCard/Classes/CardAdminClassesAdd";
import CardAdminClassesEdit from "../../components/Cards/AdminCard/Classes/CardAdminClassesEdit";

export default function FeeClassesAction() {
  const location = useLocation();
  const classes = null; // Dummy data for demonstration
  return (
    <>
      <div className="flex flex-wrap">
        <div className="w-full px-4">
          <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
            {location.pathname.startsWith("/admin/classes/view") ? (
              <CardAdminClassesView/>
            ) : location.pathname.startsWith("/admin/classes/edit") ? (
              <CardAdminClassesEdit classes={classes} />
            ) : (
              <CardAdminClassesAdd />
            )}
          </div>
        </div>
      </div>
    </>
  );
}