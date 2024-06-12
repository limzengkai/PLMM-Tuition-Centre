import React, { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import { getDocs, collection} from "firebase/firestore";

// components
import CardAdminClasses from "../../components/Cards/AdminCard/Classes/CardAdminClasses";
import CardLoading from "../../components/Cards/CardLoading";

async function fetchClassData() {
  try {
    const classCollectionRef = collection(db, "class")
    const classSnapshot = await getDocs(classCollectionRef); // Fetch all class documents
    
    const data = [];
    // Iterate through each class document
    for (const classDoc of classSnapshot.docs) {
      const classData = classDoc.data();
      const classId = classDoc.id;

      const scheduleCollectionRef = collection(classCollectionRef, classId, "Schedule");
      const scheduleSnapshot = await getDocs(scheduleCollectionRef); // Fetch all schedule documents

      const scheduleData = [];
      // Iterate through each schedule document
      scheduleSnapshot.forEach((scheduleDoc) => {
        scheduleData.push(scheduleDoc.data());
      });

      // Merge class data with schedule data
      const mergedData = { id: classId, ...classData, schedule: scheduleData };
      data.push(mergedData);

    }
    return data;
  } catch (error) {
    console.error("Error fetching documents:", error);
    throw error; // Propagate the error to the caller
  }
}

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await fetchClassData();
        setClasses(data);
        setLoading(false); // Set loading to false after data is fetched
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false); // Set loading to false even if there's an error
      }
    }
    fetchData();
  }, []);

  return (
    <>
      {loading ? (
        <CardLoading loading={loading} />
      ) : (
        <div className="flex flex-wrap">
          <div className="w-full">
            <CardAdminClasses classes={classes} />
          </div>
        </div>
      )}
    </>
  );
}