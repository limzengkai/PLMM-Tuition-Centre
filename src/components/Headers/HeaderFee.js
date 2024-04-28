import React from "react";

export default function HeaderStats() {
  return (
    <>
      {/* Header */}
      <div className="relative bg-lightBlue-600 md:pt-32 pb-32 pt-12">
        <div className="px-4 md:px-10 mx-auto w-full">
          <div>
            {/* Card stats */}
            <div className="flex flex-wrap justify-center">
              <div className="w-full lg:w-6/12 xl:w-3/12 px-4">
                <div className="relative flex flex-col min-w-0 break-words bg-white rounded mb-6 xl:mb-0 shadow-lg">
                  <div className="flex-auto p-4">
                    <div className="flex flex-wrap">
                      <div className="relative w-full pr-4 max-w-full flex-grow flex-1">
                        <h5 className="text-blueGray-400 uppercase font-bold text-xs">
                          OUTSTANDING
                        </h5>
                        <span className="font-semibold text-xl text-blueGray-700">
                          RM 40
                        </span>
                      </div>
                      <div className="relative w-auto pl-4 flex-initial">
                        <div
                          className=
                            "text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-full bg-red-500"
                        >
                          <i className="fas fa-money-check-alt"></i>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-center p-4 text-sm text-blueGray-400 mt-4 ">
                      <button
                        className="text-white rounded-full font-bold py-2 px-4 "
                        style={{ backgroundColor: '#04086D' }}
                      >
                        Make a payment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}