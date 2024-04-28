import React from "react";

// components

import CardFeeByClasses from "../../components/Cards/AdminCard/CardFeeByClasses";

export default function FeeClasses() {
  return (
    <>
      <div className="flex flex-wrap">
        <div className="w-full px-4">
          <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
            <CardFeeByClasses/>
          </div>
        </div>
      </div>
    </>
  );
}