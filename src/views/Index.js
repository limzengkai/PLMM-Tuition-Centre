import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Pagination, Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/autoplay";
import { motion, useScroll, useTransform } from "framer-motion";
import { Tilt } from "react-tilt";
import teacher1 from "../assets/img/example-teacher-1.png";
import teacher2 from "../assets/img/example-teacher-2.png";
import teacher3 from "../assets/img/example-teacher-3.png";
import { getDocs, collection } from "firebase/firestore";
import IndexNavbar from "../components/Navbars/IndexNavbar.js";
import Footer from "../components/Footers/Footer.js";
import CardLoading from "../components/Cards/CardLoading.js";
// import { AuthContext } from "../config/context/AuthContext.js";
import { storage, db } from "../config/firebase.js";
import { getDownloadURL, ref } from "firebase/storage";

export default function Index() {
  // const { currentUser } = useContext(AuthContext);
  const [imageURLs, setImageURLs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const imagesCollection = await getDocs(collection(db, "images"));
        const imagesData = await Promise.all(
          imagesCollection.docs.map(async (imageDoc) => {
            const imageUrl = await getDownloadURL(
              ref(storage, imageDoc.data().path)
            );
            return {
              url: imageUrl,
            };
          })
        );
        setImageURLs(imagesData.map((image) => image.url));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching images:", error);
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  const teachers = [
    {
      name: "Mr. Smith",
      role: "Mathematics Teacher",
      description:
        "With over 10 years of teaching experience, Mr. Smith is passionate about making math fun and accessible for all students.",
      image: teacher1,
    },
    {
      name: "Ms. Johnson",
      role: "Science Teacher",
      description:
        "Ms. Johnson brings a wealth of knowledge and enthusiasm to teaching science, inspiring students to explore the wonders of the natural world.",
      image: teacher2,
    },
    {
      name: "Mr. Lee",
      role: "English Teacher",
      description:
        "With a passion for literature and language, Mr. Lee fosters creativity and critical thinking in his English classes, helping students express themselves confidently.",
      image: teacher3,
    },
  ];

  const defaultOptions = {
    reverse: false,
    max: 35,
    perspective: 1000,
    scale: 1.2,
    speed: 1000,
    transition: true,
    axis: null,
    reset: true,
    easing: "cubic-bezier(.03,.98,.52,.99)",
  };

  const { scrollY } = useScroll();
  const yRange = useTransform(scrollY, [0, 300], [0, -100]);

  return (
    <>
      <IndexNavbar fixed />
      {/* {loading ? (
        <p>Loading...</p>
      ) : ( */}
      <section className="bg-gray-300 header relative pt-16 items-center flex h-screen">
        <div className="absolute inset-0 z-0">
          <Swiper
            modules={[Pagination, Autoplay]}
            spaceBetween={50}
            slidesPerView={1}
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000 }}
            loop={true}
            scrollbar={{ draggable: true }}
            className="h-full"
          >
            {imageURLs.map((url, index) => (
              <SwiperSlide key={index}>
                <img
                  src={url}
                  alt={`Slide ${index + 1}`}
                  className="w-full h-full"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        <div className="absolute container mx-auto items-center flex flex-wrap">
          <div className="bg-blue-300/50 rounded-lg w-full md:w-8/12 lg:w-6/12 xl:w-6/12 px-4">
            <motion.div
              className="pt-32 sm:pt-0 text-center text-black"
              style={{ y: yRange }}
            >
              <h2 className="font-semibold text-4xl">
                Welcome to Bright Minds Tuition Centre - Nurturing Young Minds,
                Shaping Futures
              </h2>
              <p className="mt-4 text-lg leading-relaxed">
                Bright Minds Tuition Centre offers a comprehensive range of
                educational programs designed to nurture the academic growth and
                personal development of our students. Our commitment to
                excellence, combined with a nurturing learning environment,
                ensures that every student reaches their full potential.
              </p>
              <div className="mt-10 flex justify-center">
                <Link
                  to={"/classes"}
                  className="get-started text-white font-bold px-6 py-4 rounded outline-none focus:outline-none mr-1 mb-1 bg-lightBlue-500 active:bg-lightBlue-600 uppercase text-sm shadow hover:shadow-lg ease-linear transition-all duration-150"
                >
                  Explore Our Programs
                </Link>
                <a
                  href="https://github.com/creativetimofficial/notus-react?ref=nr-index"
                  className="github-star ml-1 text-white font-bold px-6 py-4 rounded outline-none focus:outline-none mr-1 mb-1 bg-blueGray-700 active:bg-blueGray-600 uppercase text-sm shadow hover:shadow-lg ease-linear transition-all duration-150"
                  target="_blank"
                >
                  Join Us
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      {/* // )} */}
      <section className="pt-28 md:pt-20 pb-20 relative bg-blueGray-100">
        <h1 className="text-4xl mb-12 font-bold text-center">
          <span className="text-blue-500">Our Programs</span>
        </h1>
        <div className="container mx-auto mb-12">
          <div className="flex flex-wrap items-center justify-center">
            <div className="w-full">
              <h2 className="text-3xl mb-6 font-semibold text-center">
                Primary School
              </h2>
            </div>
            <motion.div
              className="w-full md:w-6/12 lg:w-4/12 px-4"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded-lg overflow-hidden">
                <img
                  alt="Primary School Subjects"
                  src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=700&q=80"
                  className="w-full"
                />
                <div className="px-8 py-6">
                  <h4 className="text-xl font-bold text-gray-800 mb-2">
                    Primary School Subjects
                  </h4>
                  <p className="text-md font-light text-gray-700">
                    Explore a range of subjects tailored for primary school
                    students to facilitate their learning journey.
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="w-full md:w-6/12 lg:w-8/12 px-4">
              <div className="flex flex-wrap">
                <motion.div
                  className="w-full md:w-6/12 px-4"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <Tilt options={defaultOptions}>
                    <Link to="/classes/standard-1">
                      <div className="relative flex flex-col mt-4">
                        <div className="p-4 bg-white rounded-lg shadow-lg">
                          <i className="fas fa-pencil-ruler text-4xl text-blue-500 mb-4"></i>
                          <h6 className="text-xl font-semibold text-gray-800">
                            Standard 1
                          </h6>
                        </div>
                      </div>
                    </Link>
                  </Tilt>
                  <Tilt options={defaultOptions}>
                    <Link to="/classes/standard-2">
                      <div className="relative flex flex-col mt-4">
                        <div className="p-4 bg-white rounded-lg shadow-lg">
                          <i className="fas fa-book text-4xl text-blue-500 mb-4"></i>
                          <h6 className="text-xl font-semibold text-gray-800">
                            Standard 2
                          </h6>
                        </div>
                      </div>
                    </Link>
                  </Tilt>
                  <Tilt options={defaultOptions}>
                    <Link to="/classes/standard-3">
                      <div className="relative flex flex-col mt-4">
                        <div className="p-4 bg-white rounded-lg shadow-lg">
                          <i className="fas fa-apple-alt text-4xl text-blue-500 mb-4"></i>
                          <h6 className="text-xl font-semibold text-gray-800">
                            Standard 3
                          </h6>
                        </div>
                      </div>
                    </Link>
                  </Tilt>
                </motion.div>
                <motion.div
                  className="w-full md:w-6/12 px-4"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Tilt options={defaultOptions}>
                    <Link to="/classes/standard-4">
                      <div className="relative flex flex-col mt-4">
                        <div className="p-4 bg-white rounded-lg shadow-lg">
                          <i className="fas fa-paint-brush text-4xl text-blue-500 mb-4"></i>
                          <h6 className="text-xl font-semibold text-gray-800">
                            Standard 4
                          </h6>
                        </div>
                      </div>
                    </Link>
                  </Tilt>
                  <Tilt options={defaultOptions}>
                    <Link to="/classes/standard-5">
                      <div className="relative flex flex-col mt-4">
                        <div className="p-4 bg-white rounded-lg shadow-lg">
                          <i className="fas fa-calculator text-4xl text-blue-500 mb-4"></i>
                          <h6 className="text-xl font-semibold text-gray-800">
                            Standard 5
                          </h6>
                        </div>
                      </div>
                    </Link>
                  </Tilt>
                </motion.div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center mt-12">
            <div className="w-full">
              <h2 className="text-3xl mb-6 font-semibold text-center">
                Secondary School Subjects
              </h2>
            </div>
            <motion.div
              className="w-full md:w-6/12 lg:w-4/12 px-4"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded-lg overflow-hidden">
                <img
                  alt="Secondary School Subjects"
                  src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=700&q=80"
                  className="w-full"
                />
                <div className="px-8 py-6">
                  <h4 className="text-xl font-bold text-gray-800 mb-2">
                    Secondary School
                  </h4>
                  <p className="text-md font-light text-gray-700">
                    Comprehensive courses for secondary school students,
                    designed to prepare them for higher education and future
                    careers.
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="w-full md:w-6/12 lg:w-8/12 px-4">
              <div className="flex flex-wrap">
                <motion.div
                  className="w-full md:w-6/12 px-4"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <Tilt options={defaultOptions}>
                    <Link to="/classes/form-1">
                      <div className="relative flex flex-col mt-4">
                        <div className="p-4 bg-white rounded-lg shadow-lg">
                          <i className="fas fa-calculator text-4xl text-blue-500 mb-4"></i>
                          <h6 className="text-xl font-semibold text-gray-800">
                            Form 1
                          </h6>
                        </div>
                      </div>
                    </Link>
                  </Tilt>
                  <Tilt options={defaultOptions}>
                    <Link to="/classes/form-2">
                      <div className="relative flex flex-col mt-4">
                        <div className="p-4 bg-white rounded-lg shadow-lg">
                          <i className="fas fa-flask text-4xl text-blue-500 mb-4"></i>
                          <h6 className="text-xl font-semibold text-gray-800">
                            Form 2
                          </h6>
                        </div>
                      </div>
                    </Link>
                  </Tilt>
                  <Tilt options={defaultOptions}>
                    <Link to="/classes/form-3">
                      <div className="relative flex flex-col mt-4">
                        <div className="p-4 bg-white rounded-lg shadow-lg">
                          <i className="fas fa-microscope text-4xl text-blue-500 mb-4"></i>
                          <h6 className="text-xl font-semibold text-gray-800">
                            Form 3
                          </h6>
                        </div>
                      </div>
                    </Link>
                  </Tilt>
                </motion.div>
                <motion.div
                  className="w-full md:w-6/12 px-4"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Tilt options={defaultOptions}>
                    <Link to="/classes/form-4">
                      <div className="relative flex flex-col mt-4">
                        <div className="p-4 bg-white rounded-lg shadow-lg">
                          <i className="fas fa-globe-europe text-4xl text-blue-500 mb-4"></i>
                          <h6 className="text-xl font-semibold text-gray-800">
                            Form 4
                          </h6>
                        </div>
                      </div>
                    </Link>
                  </Tilt>
                  <Tilt options={defaultOptions}>
                    <Link to="/classes/form-5">
                      <div className="relative flex flex-col mt-4">
                        <div className="p-4 bg-white rounded-lg shadow-lg">
                          <i className="fas fa-graduation-cap text-4xl text-blue-500 mb-4"></i>
                          <h6 className="text-xl font-semibold text-gray-800">
                            Form 5
                          </h6>
                        </div>
                      </div>
                    </Link>
                  </Tilt>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-blueGray-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center text-center mb-24">
            <div className="w-full lg:w-6/12 px-4">
              <h2 className="text-4xl font-semibold">Meet Our Teachers</h2>
              <p className="text-lg leading-relaxed m-4 text-blueGray-500">
                Our dedicated team of experienced educators is passionate about
                teaching and committed to helping students achieve their
                academic goals.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center">
            {teachers.map((teacher, index) => (
              <div
                className="w-full md:w-4/12 lg:w-3/12 px-4 text-center"
                key={index}
              >
                <Tilt options={defaultOptions}>
                  <motion.div
                    className="relative flex flex-col min-w-0 break-words bg-white w-full mb-8 shadow-lg rounded-lg"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <div className="px-4 py-5 flex-auto">
                      <img
                        alt={teacher.name}
                        src={teacher.image}
                        className="shadow-lg rounded-full mx-auto"
                        style={{
                          maxWidth: "120px",
                          maxHeight: "150px",
                          width: "auto",
                          height: "auto",
                        }}
                      />
                      <h6 className="text-xl mt-5 font-semibold text-gray-800">
                        {teacher.name}
                      </h6>
                      <p className="mt-1 mb-4 text-blueGray-500">
                        {teacher.role}
                      </p>
                    </div>
                  </motion.div>
                </Tilt>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <Link
              to={"/teachers"}
              className="inline-block mt-6 font-bold text-blue-600 hover:text-blue-800 transition duration-300"
            >
              Explore More <i className="fas fa-arrow-right ml-1"></i>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-100 overflow-hidden border-none">
        <div className="container mx-auto pb-64">
          <div className="flex flex-wrap justify-center">
            <motion.div
              className="w-full md:w-5/12 px-12 md:px-4 ml-auto mr-auto md:mt-64"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-blueGray-500 p-3 text-center inline-flex items-center justify-center w-16 h-16 mb-6 shadow-lg rounded-full bg-white">
                <i className="fas fa-info-circle text-xl"></i>
              </div>
              <h3 className="text-3xl mb-2 font-semibold leading-normal text-blueGray-800">
                About Us
              </h3>
              <p className="text-lg font-light leading-relaxed mt-4 mb-4 text-blueGray-600">
                At PLMM Tuition Centre, we are dedicated to nurturing young
                minds and shaping futures. Our mission is to provide a
                supportive and stimulating environment where students can
                achieve their full potential.
              </p>
              <p className="text-lg font-light leading-relaxed mt-0 mb-4 text-blueGray-600">
                With a team of experienced educators and a comprehensive range
                of programs, we are committed to fostering academic excellence
                and personal growth.
              </p>
              <Link
                to="/about-us"
                className="github-star mt-4 inline-block text-white font-bold px-6 py-4 rounded outline-none focus:outline-none mr-1 mb-1 bg-blueGray-700 active:bg-blueGray-600 uppercase text-sm shadow hover:shadow-lg"
              >
                Learn More
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
