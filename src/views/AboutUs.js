import React from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import IndexNavbar from "../components/Navbars/IndexNavbar";
import Footer from "../components/Footers/Footer";
import "leaflet/dist/leaflet.css";
import { Icon } from "leaflet";
import {
  FaWhatsapp,
  FaFacebook,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";

const AboutUs = () => {
  const icon = new Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/535/535137.png",
    iconSize: [25, 41],
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  });

  const whatsappMessage =
    "Hello, I'm interested in joining your tuition center.";

  return (
    <>
      <IndexNavbar fixed />
      <div className="pt-28 md:pt-20 pb-20 relative bg-gray-100">
        <div className="container mx-auto">
          <div className="flex flex-wrap justify-center mb-12">
            <motion.div
              className="w-full md:w-8/12 lg:w-6/12 px-4"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-center">
                <h1 className="text-4xl mb-6 font-bold text-gray-800">
                  About Us
                </h1>
                <p className="text-lg font-light text-gray-600 mb-4">
                  Our mission is to provide quality education and foster a love
                  for learning. We offer a wide range of programs and subjects
                  designed to meet the needs of students at different levels.
                </p>
                <p className="text-lg font-light text-gray-600 mb-4">
                  Our dedicated team of experienced teachers is committed to
                  supporting each student’s growth and development. We believe
                  in creating an inclusive and supportive learning environment
                  where every student can thrive.
                </p>
                <p className="text-lg font-light text-gray-600">
                  Join us on a journey of discovery and achievement. Together,
                  we can build a brighter future for all students.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto mt-12">
          <div className="flex flex-wrap justify-center">
            <div className="w-full md:w-8/12 lg:w-6/12 px-4">
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl mb-6 font-bold text-gray-800">
                  Contact Us
                </h2>
                <p className="text-lg font-light text-gray-600 mb-4 flex items-center justify-center">
                  <FaMapMarkerAlt className="mr-2 text-red-500" />
                  Address:{"  "}
                  <a
                    href="https://www.google.com/maps?q=20A,20B,18A,18B,Jalan+Pendekar+17,+Taman+Ungku+Tun+Aminah,+Johor+Bahru,+Malaysia"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500"
                  >
                    20A, 20B, 18A, 18B, Jalan Pendekar 17, Taman Ungku Tun
                    Aminah, Johor Bahru, Malaysia
                  </a>
                </p>
                <p className="text-lg font-light text-gray-600 mb-4 flex items-center justify-center">
                  <FaWhatsapp className="mr-2 text-green-500" />
                  Phone:{" "}
                  <a
                    href={`https://wa.me/60167108177?text=${encodeURIComponent(
                      whatsappMessage
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 ml-1"
                  >
                    +6016-710 8177
                  </a>
                </p>
                <p className="text-lg font-light text-gray-600 mb-4 flex items-center justify-center">
                  <FaEnvelope className="mr-2 text-gray-500" />
                  Email:{" "}
                  <a
                    href="mailto:plmmtuitioncentre8177@gmail.com"
                    className="text-blue-500"
                  >
                    plmmtuitioncentre8177@gmail.com
                  </a>
                </p>
                <p className="text-lg font-light text-gray-600 mb-4 flex items-center justify-center">
                  <FaFacebook className="mr-2 text-blue-500" />
                  Facebook:{" "}
                  <a
                    href="https://www.facebook.com/ptmmtuitioncentre"
                    className="text-blue-500"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    PLMM Tuition Centre
                  </a>
                </p>
                <div className="h-80 md:h-screen relative">
                  <MapContainer
                    center={[1.513042, 103.655884]}
                    zoom={16}
                    scrollWheelZoom={false}
                    className="h-full z-0"
                    style={{ zIndex: 0 }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[1.513042, 103.655884]} icon={icon}>
                      <Popup>
                        PLMM Tuition Centre <br />
                        <a
                          href="https://www.google.com/maps/search/?api=1&query=1.513042,103.655884"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          [Link]
                        </a>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AboutUs;
