import React from "react";

// Student Information Component;
export const CardStudentInfo = () => {
  return (
    <>
      <h6 className="text-blueGray-400 text-sm mt-3 mb-6 font-bold uppercase">
        Children's Information
      </h6>
      <div className="flex flex-wrap">
        <div className="w-full lg:w-6/12 px-4">
          <div className="relative w-full mb-3">
            <label
              className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
              htmlFor="childName"
            >
              Name
            </label>
            <input
              type="text"
              id="childName"
              name="childName"
              className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
              placeholder="Child's Name"
              defaultValue="John Doe"
            />
          </div>
        </div>
        <div className="w-full lg:w-6/12 px-4">
          <div className="relative w-full mb-3">
            <label
              className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
              htmlFor="childAge"
            >
              Age
            </label>
            <input
              type="text"
              id="childAge"
              name="childAge"
              className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
              placeholder="Child's Age"
              defaultValue="12"
            />
          </div>
        </div>
        <div className="w-full lg:w-6/12 px-4">
          <div className="relative w-full mb-3">
            <label
              className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
              htmlFor="childIC"
            >
              IC Number
            </label>
            <input
              type="text"
              id="childIC"
              name="childIC"
              className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
              placeholder="Child's IC Number"
              defaultValue="123456789012"
            />
          </div>
        </div>
        <div className="w-full lg:w-6/12 px-4">
          <div className="relative w-full mb-3">
            <label
              className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
              htmlFor="educationalLevel"
            >
              Educational Level
            </label>
            <select
              id="educationalLevel"
              name="educationalLevel"
              className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
            >
              <option value="" disabled className="bg-gray-300">Select Educational Level</option>
              <option value="Standard 1">Standard 1</option>
              <option value="Standard 2">Standard 2</option>
              <option value="Standard 3">Standard 3</option>
              <option value="Standard 4">Standard 4</option>
              <option value="Standard 5">Standard 5</option>
              <option value="Standard 6" selected>Standard 6</option>
              <option value="Form 1">Form 1</option>
              <option value="Form 2">Form 2</option>
              <option value="Form 3">Form 3</option>
              <option value="Form 4">Form 4</option>
              <option value="Form 5">Form 5</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
};
