/*eslint-disable*/
import React, { useContext, useEffect } from "react";
import { Link } from "react-router-dom";

import IndexNavbar from "../components/Navbars/IndexNavbar.js";
import Footer from "../components/Footers/Footer.js";
import { AuthContext } from "../config/context/AuthContext.js";


export default function Index() {
  const currentUser = useContext(AuthContext);
  useEffect(() => {
      console.log("Current user:  ", currentUser.currentUser);

  }
  , []);

  return (
    <>
      <IndexNavbar fixed />
      <div>

      </div>
      <section className="header relative pt-16 items-center flex h-screen max-h-860-px">
        <div className="container mx-auto items-center flex flex-wrap">
          <div className="w-full md:w-8/12 lg:w-6/12 xl:w-6/12 px-4">
            <div className="pt-32 sm:pt-0">
              <h2 className="font-semibold text-4xl text-blueGray-600">
                Welcome to PLMM Tuition Centre - Empowering Minds, Enriching Futures
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-blueGray-500">
              PLMM Tuition Centre offers a comprehensive range of educational programs designed to nurture the academic growth and personal development of our students. 
              Our commitment to excellence, combined with a nurturing learning environment, ensures that every student reaches their full potential
              </p>
              <div className="mt-12">
                <a
                  href="https://www.creative-tim.com/learning-lab/tailwind/react/overview/notus?ref=nr-index"
                  target="_blank"
                  className="get-started text-white font-bold px-6 py-4 rounded outline-none focus:outline-none mr-1 mb-1 bg-lightBlue-500 active:bg-lightBlue-600 uppercase text-sm shadow hover:shadow-lg ease-linear transition-all duration-150"
                >
                  Explore Our Program
                </a>
                <a
                  href="https://github.com/creativetimofficial/notus-react?ref=nr-index"
                  className="github-star ml-1 text-white font-bold px-6 py-4 rounded outline-none focus:outline-none mr-1 mb-1 bg-blueGray-700 active:bg-blueGray-600 uppercase text-sm shadow hover:shadow-lg ease-linear transition-all duration-150"
                  target="_blank"
                >
                  Join Us
                </a>
              </div>
            </div>
          </div>
        </div>

        <img
          className="absolute top-0 b-auto right-0 pt-16 sm:w-6/12 -mt-48 sm:mt-0 w-10/12 max-h-860px"
          src={require('../assets/img/pattern_react.png')}
          alt="..."
        />
      </section>


      <Footer />
    </>
  );
}
