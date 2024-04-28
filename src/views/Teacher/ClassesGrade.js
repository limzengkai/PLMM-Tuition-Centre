import React from "react";

// components
import CardGradeClasses from "../../components/Cards/TeacherCard/CardGradeClasses";

export default function ClassesGrade() {
  return (
    <>      {/* Header */}
      <div className="flex flex-wrap mt-4">
        <div className="w-full mb-12 px-4">
          <CardGradeClasses/>
        </div>
      </div>
    </>
  );
}