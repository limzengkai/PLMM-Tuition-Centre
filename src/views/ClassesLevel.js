import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import IndexNavbar from "../components/Navbars/IndexNavbar";
import Footer from "../components/Footers/Footer";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import CardLoading from "../components/Cards/CardLoading";

const ClassesLevel = () => {
  const { level } = useParams();
  const [currentLevel, setCurrentLevel] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const levelMap = {
    "standard-1": "Standard 1",
    "standard-2": "Standard 2",
    "standard-3": "Standard 3",
    "standard-4": "Standard 4",
    "standard-5": "Standard 5",
    "standard-6": "Standard 6",
    "form-1": "Form 1",
    "form-2": "Form 2",
    "form-3": "Form 3",
    "form-4": "Form 4",
    "form-5": "Form 5",
  };

  useEffect(() => {
    const levelName = levelMap[level] || "Unknown Level";
    setCurrentLevel(levelName);

    const fetchClasses = async () => {
      try {
        const classQuery = query(
          collection(db, "class"),
          where("academicLevel", "==", levelName)
        );
        const querySnapshot = await getDocs(classQuery);
        const classesData = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const classData = { id: doc.id, ...doc.data() };
            const scheduleQuery = query(
              collection(db, "class", doc.id, "Schedule")
            );
            const scheduleSnapshot = await getDocs(scheduleQuery);
            const scheduleData = scheduleSnapshot.docs.map((scheduleDoc) => {
              const schedule = scheduleDoc.data();
              // Convert Firestore Timestamp to JavaScript Date
              return {
                ...schedule,
                startTime: schedule.startTime.toDate().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                endTime: schedule.endTime.toDate().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              };
            });
            return { ...classData, schedule: scheduleData };
          })
        );
        setClasses(classesData);
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [level]);

  return (
    <>
      <IndexNavbar fixed />
      <div className="pt-28 md:pt-20 pb-20 bg-gray-100">
        <div className="container mx-auto">
          <p>
            <span className="text-blue-500">
              <Link to={`/classes`}>classes</Link>
            </span>{" "}
            / {currentLevel}
          </p>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-8 text-blue-600">
              {currentLevel}
            </h1>
          </div>
          {loading ? (
            <CardLoading />
          ) : classes.length === 0 ? (
            <div className="text-center text-gray-600 text-lg">
              No classes information is available.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((cls, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                >
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {cls.CourseName}
                        </h3>
                        <div className="text-gray-600">
                          {cls.schedule.map((sch, schIndex) => (
                            <div key={schIndex} className="mb-2">
                              <p className="font-semibold">{sch.day}</p>
                              <p>
                                {sch.startTime} - {sch.endTime}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ClassesLevel;
