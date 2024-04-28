import React from "react";
// components

import CardParentProfile from "../../components/Cards/CardUserInfo";

export default function Profile() {
  return (
    <>
      <div className="flex flex-wrap">
        <div className="w-full px-4">
          <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
            <CardParentProfile/>
          </div>
        </div>
      </div>
    </>
  );
}
