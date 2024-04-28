import React from "react";
import { useLocation } from "react-router-dom";

// components
import CardFeeManagementViewDetail from "../../components/Cards/AdminCard/CardFeeManagementViewDetail";
import CardFeeManagementEdit from "../../components/Cards/AdminCard/CardFeeManagementEdit";

export default function FeeManagementViewAction() {
  const location = useLocation();
  
  return (
    <>
      <div className="flex flex-wrap">
        <div className="w-full px-4">
          <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
            {location.pathname.startsWith("/admin/fee/view") 
            ? <CardFeeManagementViewDetail/> 
            : <CardFeeManagementEdit/>
            }
          </div>
        </div>
      </div>
    </>
  );
}