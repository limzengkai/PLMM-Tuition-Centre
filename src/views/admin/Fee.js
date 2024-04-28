import React from "react";

// components

import CardFeeAdd from "../../components/Cards/AdminCard/CardFeeAdd";
import CardFeeManagement from "../../components/Cards/AdminCard/CardFeeManagement";
import { useLocation } from "react-router-dom";

export default function Settings() {
  const location = useLocation();
  return (
    <>
      <div className="flex flex-wrap">
        <div className="w-full px-4">
          <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
            {location.pathname.includes("/admin/fee/add")? <CardFeeAdd/> : <CardFeeManagement/>}
          </div>
        </div>
      </div>
    </>
  );
}
