import React from "react";

// components

import CardClasses from "../../components/Cards/ParentCard/CardClasses.js";
import { useLocation } from "react-router-dom";
import CardClassesOffered from "../../components/Cards/ParentCard/CardClassesOffered.js";

export default function Class() {
  const location = useLocation();
  return (
    <>
      <div className="flex flex-wrap mt-4">
        <div className="w-full mb-12 px-4">
          {location.pathname.includes("/parent/classes/register")? <CardClassesOffered/> : <CardClasses/>}
        </div>
      </div>
    </>
  );
}
