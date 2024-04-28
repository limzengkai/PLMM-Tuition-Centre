import React, { useState } from "react";

import { CardStudentInfo } from "../../CardStudentInfo";
import { CardParentInfo } from "./CardParentInfo";

export default function CardSettings() {
  const [parentInfo, setParentInfo] = useState({
    parentName: "",
    parentAge: "",
    parentIC: "",
    parentEmail: "",
    parentPhone: "",
    parentAddress: "",
    parentCity: "",
    parentState: "",
    parentZip: ""
  });

  const [studentInfo, setStudentInfo] = useState({
    childName: "",
    childAge: "",
    childIC: "",
    educationalLevel: ""
  });

  const handleSaveChanges = () => {
    // Implement logic to save changes to parent and student information
    console.log("Parent Info:", parentInfo);
    console.log("Student Info:", studentInfo);
    // Add your logic here to save the changes
  };

  return (
    <>
      <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-100 border-0">
        <div className="rounded-t bg-white mb-0 px-6 py-6">
          <div className="text-center flex justify-between">
            <h6 className="text-blueGray-700 text-xl font-bold">My Account</h6>
            <button
              className="bg-lightBlue-500 text-white active:bg-lightBlue-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 ease-linear transition-all duration-150"
              type="button"
            >
              Settings
            </button>
          </div>
        </div>
        <div className="flex-auto px-4 lg:px-10 py-10 pt-0">
          <form>
            {/* Render Parent Information */}
            <CardParentInfo parentInfo={parentInfo} setParentInfo={setParentInfo} />
            
            <hr className="mt-6 border-b-1 border-blueGray-300" />
            
            {/* Render Child Information */}
            <CardStudentInfo studentInfo={studentInfo} setStudentInfo={setStudentInfo} />
            
            <hr className="mt-6 border-b-1 border-blueGray-300" />

            <div className="flex justify-end">
              <button
                className="bg-green-500 text-white active:bg-green-600 font-bold uppercase text-sm px-6 py-3 mt-3 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                type="button"
                onClick={handleSaveChanges}
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}