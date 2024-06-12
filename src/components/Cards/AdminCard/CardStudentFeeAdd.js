import React, { useState, useEffect } from "react";
import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import { collection, getDocs, addDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";
import CardLoading from "../CardLoading";
import Swal from "sweetalert2";

function CardStudentFeeAdd() {
  const [dueDate, setDueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [student, setStudent] = useState({});
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const { uid } = useParams();
  const [additionalFields, setAdditionalFields] = useState([
    {
      description: "",
      amount: "",
      quantity: "",
    },
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClass = async () => {
      try {
        // Fetch class data
        const classDoc = await getDocs(collection(db, "class"));
        let classData = [];
        classDoc.forEach((doc) => {
          classData.push({ id: doc.id, ...doc.data() });
        });
        // Fetch student data
        const studentDoc = await getDoc(doc(db, "students", uid));
        const studentData = { id: studentDoc.id, ...studentDoc.data() };
        // Filter class data based on registered courses
        const registeredClassData = classData.filter((classItem) =>
          studentData.registeredCourses.includes(classItem.id)
        );
        console.log("Registered Class Data", registeredClassData);
        setClasses(registeredClassData);
        setStudent(studentData);
      } catch (error) {
        console.error("Error fetching class data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClass();
  }, [uid]);

  const handleAddFee = async () => {
    try {
      const confirmResult = await Swal.fire({
        icon: "question",
        title: "Confirmation",
        text: "Are you sure you want to add this fee?",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
      });

      if (confirmResult.isConfirmed) {
        for (const field of additionalFields) {
          const feeRef = await addDoc(collection(db, "fees"), {
            DueDate: new Date(dueDate),
            StudentID: uid,
            paidAmount: 0,
            paymentDate: "",
            paymentStatus: false,
            publish: false,
          });
          const feeClassesRef = collection(feeRef, "Classes");
          await addDoc(feeClassesRef, {
            ClassId: selectedClass,
            Descriptions: [field.description],
            FeeAmounts: [Number(field.amount)],
            Quantity: [Number(field.quantity)],
          });
        }
        // Navigate to the desired page and then display the SweetAlert
        navigate(`/admin/fee/view/${uid}`).then(() => {
          Swal.fire({
            icon: "success",
            title: "Fee Added",
            text: "Fee has been successfully added.",
            timer: 2000,
            timerProgressBar: true,
          });
        });
      }
    } catch (error) {
      console.error("Error adding fee:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while adding the fee. Please try again later.",
      });
    }
  };

  const handleAddField = () => {
    setAdditionalFields([
      ...additionalFields,
      {
        description: "",
        amount: "",
        quantity: "",
      },
    ]);
  };

  const handleFieldInputChange = (e, index) => {
    const { name, value } = e.target;
    const updatedFields = [...additionalFields];
    updatedFields[index][name.split("-")[0]] = value;
    setAdditionalFields(updatedFields);
  };

  return (
    <>
      {loading ? (
        <CardLoading loading={loading} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-4 font-bold text-base sm:text-lg md:text-xl lg:text-2xl">
            <Link
              to="/admin/fee/classes"
              className="text-blue-500 hover:underline"
            >
              Fee Management
            </Link>
            <span className="mx-2">&nbsp;/&nbsp;</span>
            <Link
              to={`/admin/fee/view/${uid}`}
              className="text-blue-500 hover:underline"
            >
              View Student's fee
            </Link>
            <span className="mx-2">&nbsp;/&nbsp;</span>
            <span className="text-gray-500">Add Student Fee</span>
          </div>
          <div className="flex justify-between">
            <div className="flex mb-4">
              <Link
                to="/admin/fee"
                className={`rounded-l-lg font-bold py-2 px-4 ${
                  location.pathname === "/admin/fee"
                    ? "bg-blue-500 text-white hover:text-lightBlue-100"
                    : "text-black hover:text-white hover:bg-blue-500"
                }`}
              >
                Fee list
              </Link>
              <Link
                to="/admin/fee/classes"
                className={`font-bold py-2 px-4 ${
                  location.pathname.startsWith("/admin/fee/classes")
                    ? "bg-blue-500 text-white hover:text-lightBlue-100"
                    : "text-black hover:text-white hover:bg-blue-500"
                }`}
              >
                Class List
              </Link>
              <Link
                to="/admin/fee/payment-history"
                className={`rounded-r-lg font-bold py-2 px-4 ${
                  location.pathname === "/admin/fee/payment-history"
                    ? "bg-blue-500 text-white hover:text-lightBlue-100"
                    : "text-black hover:text-white hover:bg-blue-500"
                }`}
              >
                Payment History
              </Link>
            </div>
          </div>

          <div className="block w-full overflow-x-auto">
            <div className="m-4">
              <label>
                <h2 className="font-bold text-lg mb-2">Due Date</h2>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]} // Set min attribute to today's date
                className="border rounded-md p-2"
              />
              <h2 className="font-bold text-lg mb-2 mt-4">Select Class</h2>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="border rounded-md p-2 w-full mb-4"
              >
                <option value="" disabled>
                  Select a class
                </option>
                <option value="0">Other Fee</option>
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.CourseName} Fee
                  </option>
                ))}
              </select>
              <h2 className="font-bold text-lg mb-2">Add Fee</h2>
              <div className="grid grid-cols-3 gap-4">
                {additionalFields.map((field, index) => (
                  <React.Fragment key={index}>
                    <input
                      type="text"
                      name={`description-${index}`}
                      placeholder="Description"
                      value={field.description}
                      onChange={(e) => handleFieldInputChange(e, index)}
                      className="border rounded-md p-2"
                    />
                    <input
                      type="number"
                      name={`amount-${index}`}
                      placeholder="Amount"
                      value={field.amount}
                      onChange={(e) => handleFieldInputChange(e, index)}
                      className="border rounded-md p-2"
                    />
                    <input
                      type="number"
                      name={`quantity-${index}`}
                      placeholder="Quantity"
                      value={field.quantity}
                      onChange={(e) => handleFieldInputChange(e, index)}
                      className="border rounded-md p-2"
                    />
                  </React.Fragment>
                ))}
              </div>
              <div className="flex justify-center my-4">
                <button
                  className="bg-blue-500 text-white rounded-md py-2 px-4 mt-4 mr-2"
                  onClick={handleAddField}
                >
                  Add More
                </button>
                <button
                  className="bg-green-500 text-white rounded-md py-2 px-4 mt-4"
                  onClick={handleAddFee}
                  disabled={!selectedClass} // Disable button if no class is selected
                >
                  Submit Fee
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CardStudentFeeAdd;
