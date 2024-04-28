import React from "react";

// components
import CardEditGrade from "../../components/Cards/TeacherCard/CardEditGrade";

export default function ClassesGradeEdit() {
  return (
    <>      {/* Header */}
      <div className="flex flex-wrap mt-4">
        <div className="w-full mb-12 px-4">
          <CardEditGrade/>
        </div>
      </div>
    </>
  );
}