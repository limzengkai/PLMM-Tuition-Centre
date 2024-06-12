import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import IndexNavbar from "../components/Navbars/IndexNavbar";
import Footer from "../components/Footers/Footer";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const teachersCollection = await getDocs(
        query(collection(db, "teacher"), where("status", "==", true))
      );
      const teachersData = await Promise.all(
        teachersCollection.docs.map(async (teacherDoc) => {
          const teacher = teacherDoc.data();
          // Fetch corresponding user details
          const userDoc = doc(db, "users", teacher.userID);
          const userSnapshot = await getDoc(userDoc);
          const userData = userSnapshot.data();
          console.log("DATA: ", userData);
          return {
            id: teacherDoc.id,
            name: userData.firstName + " " + userData.lastName,
            description: teacher.description || null,
            photo: teacher.photo || null,
            status: teacher.status || false,
          };
        })
      );
      setTeachers(teachersData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setLoading(false);
    }
  };

  return (
    <>
      <IndexNavbar fixed />
      <div className="pt-28 md:pt-20 pb-20 relative bg-gray-100">
        <div className="container mx-auto">
          {loading ? (
            <p className="text-center text-gray-800 text-xl">Loading...</p>
          ) : (
            <div className="flex flex-wrap justify-center mb-12">
              <h1 className="text-4xl font-bold text-center w-full mb-8 text-green-600">
                Meet Our Teachers
              </h1>
              {teachers.length > 0 ? (
                teachers.map((teacher, index) => (
                  <motion.div
                    key={index}
                    className="w-full md:w-5/12 lg:w-3/12 p-4"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                  >
                    <div className="bg-gray-100 rounded-lg shadow-lg overflow-hidden relative">
                      <img
                        alt={teacher.name}
                        src={
                          teacher.photo ||
                          "https://via.placeholder.com/150"
                        }
                        className="w-150 h-150 object-cover"
                        style={{ width: 150, height: 150 }}
                      />
                      <div className="p-6">
                        <h4 className="text-xl font-bold text-gray-800 mb-2">
                          {teacher.name}
                        </h4>
                        <p className="text-md text-gray-700 truncate">
                          {teacher.description}
                        </p>
                        <div className="absolute top-0 left-0 w-full h-full bg-gray-100 z-10 opacity-0 hover:opacity-100 transition-opacity duration-300 overflow-y-auto">
                          <div className="p-6 max-h-full">
                            <h4 className="text-xl font-bold text-gray-800 mb-2">
                              {teacher.name}
                            </h4>
                            <p className="text-md text-gray-700">
                              {teacher.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center w-full">
                  <p className="text-xl text-gray-800">
                    No teachers available.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Teachers;
