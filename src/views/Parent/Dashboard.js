import React, { useContext, useEffect, useState } from "react";
import {
  collection,
  getDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { AuthContext } from "../../config/context/AuthContext.js";
import { db } from "../../config/firebase.js";
import CardLineChart from "../../components/Cards/CardLineChart.js";
import ClassTimetable from "../../components/Cards/ParentCard/Dashboard/Timetable/Timetable.js";
import CardAnnouncement from "../../components/Cards/ParentCard/Dashboard/CardAnnouncement.js";
import CardPaymentHistory from "../../components/Cards/ParentCard/Dashboard/CardPaymentHistory.js";

export default function Dashboard() {
  const { currentUser } = useContext(AuthContext);
  const [childrenDetails, setChildrenDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChildrenClasses = async () => {
      const childrenRef = doc(db, "parent", currentUser.uid);
      const childrenSnapshot = await getDoc(childrenRef);
      const childrenData = childrenSnapshot.data();

      if (childrenData && childrenData.children) {
        const childrenIDs = childrenData.children;
        const childClassesPromises = childrenIDs.map(async (childID) => {
          const classesRef = query(
            collection(db, "class"),
            where("studentID", "array-contains", childID)
          );
          const classesSnapshot = await getDocs(classesRef);

          const classesWithSchedule = [];
          for (const classDoc of classesSnapshot.docs) {
            const ClassSchedule = collection(
              db,
              "class",
              classDoc.id,
              "Schedule"
            );
            const ScheduleSnapshot = await getDocs(ClassSchedule);
            const ScheduleData = ScheduleSnapshot.docs.map((doc) => doc.data());

            const classDataWithSchedule = {
              id: classDoc.id,
              ...classDoc.data(),
              schedule: ScheduleData,
            };

            classesWithSchedule.push(classDataWithSchedule);
          }

          const childRef = doc(db, "students", childID);
          const childSnapshot = await getDoc(childRef);
          const childData = childSnapshot.data();

          return {
            id: childID,
            childDetails: childData,
            classes: classesWithSchedule,
          };
        });
        const childClasses = await Promise.all(childClassesPromises);
        setChildrenDetails(childClasses);
        setLoading(false);
      }
    };

    fetchChildrenClasses();
  }, [currentUser.uid]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="relative grid grid-cols-6 gap-4">
        <div className="col-span-6 xl:col-span-4">
          <CardPaymentHistory />
          {childrenDetails.map((child) => (
            <ClassTimetable key={child.id} child={child} />
          ))}
        </div>
        <div className="col-span-6 xl:col-span-2">
          <div className="flex flex-col gap-4">
            <CardAnnouncement
              performance="Announcement"
              totalOrders="2024-05-06"
            />
          </div>
        </div>
      </div>
    </>
  );
}
