import React from "react";
import { useParams } from "react-router-dom"; // Import useParams to get the ID from URL parameters

// components
import CardTest from "../../components/Cards/ParentCard/CardTest";


export default function TestResult() {

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap">
        <div className="w-full">
          <CardTest/>
        </div>
      </div>
    </>
  );
}