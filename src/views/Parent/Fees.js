import React from "react";

// components

import CardFee from "../../components/Cards/ParentCard/CardFee";
import CardFeeView from "../../components/Cards/ParentCard/CardFeeView";
import { useLocation } from "react-router-dom";

export default function Fees() {
  const location = useLocation();
  return (
    <>
      <div className="flex flex-wrap">
        <div className="w-full px-4">
          <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
          {location.pathname.includes("/parent/fee/view")? <CardFeeView/> : <CardFee/>}
          </div>
        </div>
      </div>
    </>
  );
}
