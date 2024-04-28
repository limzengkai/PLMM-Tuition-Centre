import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { db } from "../../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getDocs, collection} from "firebase/firestore";

// components
import CardAdminClassesView from "../../components/Cards/AdminCard/CardAdminClassesView";
import CardAdminClassesAdd from "../../components/Cards/AdminCard/CardAdminClassesAdd";
import CardAdminClassesEdit from "../../components/Cards/AdminCard/CardAdminClassesEdit";

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