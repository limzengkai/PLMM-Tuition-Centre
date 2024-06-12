import React from "react";

// components
import CardViewGrade from "../../components/Cards/TeacherCard/CardViewGrade";

export default function ClassesGradeView() {
  return (
    <>
      <div className="flex flex-wrap mt-4">
        <div className="w-full mb-12 px-4">
          <CardViewGrade />
        </div>
      </div>
    </>
  );
}
