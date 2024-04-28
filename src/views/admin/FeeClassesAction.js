import React from "react";
import { useLocation } from "react-router-dom";

// components

import CardFeeManagementEdit from "../../components/Cards/AdminCard/CardFeeManagementEdit";
import CardFeeByClassesView from "../../components/Cards/AdminCard/CardFeeByClassesView";
import CardFeeByClasses from "../../components/Cards/AdminCard/CardFeeByClasses";
import CardFeeAdd from "../../components/Cards/AdminCard/CardFeeAdd";

export default function FeeClassesAction() {
  const location = useLocation();
  
  return (
    <>
      <div className="flex flex-wrap">
        <div className="w-full px-4">
          <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
            {location.pathname.startsWith("/admin/fee/classes/view") 
              ? <CardFeeByClassesView/> :              
              location.pathname.startsWith("/admin/fee/classes/add")
              ? <CardFeeAdd/> :
              location.pathname.startsWith("/admin/fee/classes") 
              ? <CardFeeByClasses/> :
               <CardFeeManagementEdit/>
            }
          </div>
        </div>
      </div>
    </>
  );
}