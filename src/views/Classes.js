import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import IndexNavbar from "../components/Navbars/IndexNavbar";
import Footer from "../components/Footers/Footer";

const Classes = () => {

  const educationStandard = [
    {
      Level: "Standard 1",
      LinkLevel: "standard-1",
    },
    {
      Level: "Standard 2",
      LinkLevel: "standard-2",
    },
    {
      Level: "Standard 3",
      LinkLevel: "standard-3",
    },
    {
      Level: "Standard 4",
      LinkLevel: "standard-4",
    },
    {
      Level: "Standard 5",
      LinkLevel: "standard-5",
    },
    {
      Level: "Standard 6",
      LinkLevel: "standard-6",
    },
  ];

  const educationForm = [
    {
      Level: "Form 1",
      LinkLevel: "form-1",
    },
    {
      Level: "Form 2",
      LinkLevel: "form-2",
    },
    {
      Level: "Form 3",
      LinkLevel: "form-3",
    },
    {
      Level: "Form 4",
      LinkLevel: "form-4",
    },
    {
      Level: "Form 5",
      LinkLevel: "form-5",
    },
  ];

  return (
    <>
      <IndexNavbar fixed />
      <div className="pt-28 md:pt-20 pb-20 bg-gray-100">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-8 text-blue-600">
              Our Programs
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-semibold mb-4 text-gray-700">
              Primary School
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {educationStandard.map((cls, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Link to={`/classes/${cls.LinkLevel}`}>
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {cls.Level}
                        </h3>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-4 text-gray-700">
              Secondary School
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {educationForm.map((cls, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Link to={`/classes/${cls.LinkLevel}`}>
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {cls.Level}
                        </h3>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Classes;
