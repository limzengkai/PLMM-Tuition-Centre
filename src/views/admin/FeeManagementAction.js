import React from "react";
import { useLocation } from "react-router-dom";

// components
import CardFeeManagementView from "../../components/Cards/AdminCard/CardFeeManagementView";

export default function FeeManagementAction() {

  return (
    <>
      <div className="flex flex-wrap">
        <div className="w-full px-4">
          <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
            <CardFeeManagementView/> 
          </div>
        </div>
      </div>
    </>
  );
}