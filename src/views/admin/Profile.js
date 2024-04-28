import React from "react";

// components

import CardAdminProfile from "../../components/Cards/CardUserInfo";

export default function Settings() {
  return (
    <>
      <div className="flex flex-wrap">
        <div className="w-full">
          <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
          <CardAdminProfile />
          </div>
        </div>
      </div>
    </>
  );
}
