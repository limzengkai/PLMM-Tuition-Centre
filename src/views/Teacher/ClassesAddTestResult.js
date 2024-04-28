import React from "react";

// components
import CardNewTestResult from "../../components/Cards/TeacherCard/CardNewTestResult";

export default function ClassesGrade() {
  return (
    <>      {/* Header */}
      <div className="flex flex-wrap mt-4">
        <div className="w-full mb-12 px-4">
          <CardNewTestResult/>
        </div>
      </div>
    </>
  );
}