import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../../config/context/AuthContext";
import PropTypes from "prop-types";
import { db } from "../../../config/firebase";
import { Link } from "react-router-dom";
import CardPagination from "../CardPagination";
import CardLoading from "../CardLoading";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";

function CardTeacherClasses({ color }) {
  const { currentUser } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const teacherQuery = query(
          collection(db, "teacher"),
          where("userID", "==", currentUser.uid)
        );

        const teacherSnapshot = await getDocs(teacherQuery);

        if (!teacherSnapshot.empty) {
          const firstTeacherDoc = teacherSnapshot.docs[0];
          const teacherData = {
            id: firstTeacherDoc.id,
            ...firstTeacherDoc.data(),
          };

          const classesQuery = query(
            collection(db, "class"),
            where("teacher", "==", teacherData.id)
          );

          const classesSnapshot = await getDocs(classesQuery);

          const classesData = classesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setLoading(false);
          setClasses(classesData);
        }
      } catch (error) {
        console.error("Error fetching classes data:", error);
      }
    };

    fetchClasses();
  }, [currentUser]);

  const classesPerPage = 5;
  const indexOfLastClass = currentPage * classesPerPage;
  const indexOfFirstClass = indexOfLastClass - classesPerPage;
  const currentClasses = classes.slice(indexOfFirstClass, indexOfLastClass);
  const totalPages = Math.ceil(classes.length / classesPerPage);


  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <>
      {loading ? (
        <CardLoading loading={loading} />
      ) : (
        <div
          className={
            "relative mx-auto px-4 py-8 flex flex-col min-w-0 break-words w-full shadow-lg rounded " +
            (color === "light" ? "bg-white" : "bg-lightBlue-900 text-white")
          }
        >
          <div className="flex items-center mb-4 font-bold text-xl">
            <span to="/admin/classes" className="text-gray-500">
              Classes
            </span>
          </div>
          <div className="block w-full overflow-x-auto">
            <table className="w-full bg-transparent border-collapse">
              <thead>
                <tr>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    No
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Class
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Academic Level
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Register No
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentClasses.map((cls, index) => (
                  <tr key={cls.id}>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {index + 1}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {cls.CourseName}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {cls.academicLevel}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {cls.studentID && cls.studentID.length} /{" "}
                      {cls.MaxRegisteredStudent}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      <Link
                        to={`/teacher/classes/view/${cls.id}`}
                        className="mr-3 text-black rounded-full font-bold py-2 px-4 bg-blue-500"
                      >
                        View
                      </Link>
                      <Link
                        to={`/teacher/classes/grade/${cls.id}`}
                        className="mr-3 text-white rounded-full font-bold py-2 px-4 bg-green-500"
                      >
                        Grade
                      </Link>
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <CardPagination
            currentPage={currentPage}
            totalPages={totalPages}
            paginate={paginate}
          />
        </div>
      )}
    </>
  );
}

CardTeacherClasses.defaultProps = {
  color: "light",
};

CardTeacherClasses.propTypes = {
  color: PropTypes.oneOf(["light", "dark"]).isRequired,
};

export default CardTeacherClasses;
