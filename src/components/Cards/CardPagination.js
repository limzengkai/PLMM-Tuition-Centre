import React from 'react';
import PropTypes from 'prop-types';

const CardPagination = ({ currentPage, totalPages, paginate }) => {
  // Generate array of page numbers
  const pageNumbers = [];
  if (totalPages <= 10) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    const leftBound = Math.max(1, currentPage - 4);
    const rightBound = Math.min(currentPage + 5, totalPages);

    if (currentPage < 6) {
      for (let i = 1; i <= 10; i++) {
        pageNumbers.push(i);
      }
    } else if (currentPage >= totalPages - 5) {
      for (let i = totalPages - 9; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      for (let i = leftBound; i <= rightBound; i++) {
        pageNumbers.push(i);
      }
    }
  }

  return (
    <div className="px-5 py-3 mx-4 flex justify-center sm:justify-between border-t border-blue-200 bg-transparent">
      {totalPages > 1 && (
        <div className="flex items-center justify-center">
          <button
            className={`text-indigo-500 font-bold py-2 px-4 rounded-r-lg border border-indigo-500 ${totalPages > 1 ? 'hover:bg-indigo-500 hover:text-white' : 'hidden'}`}
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          {pageNumbers.map(number => (
            <button
              key={number}
              className={`mx-1 py-2 px-4 rounded-lg border ${currentPage === number ? 'bg-indigo-500 text-white' : 'text-indigo-500 hover:bg-indigo-500 hover:text-white'}`}
              onClick={() => paginate(number)}
            >
              {number}
            </button>
          ))}
          <button
            className={`text-indigo-500 font-bold py-2 px-4 rounded-r-lg border border-indigo-500 ${totalPages > 1 ? 'hover:bg-indigo-500 hover:text-white' : 'hidden'}`}
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
        <div className="ml-auto mt-2 sm:mt-0 text-xl text-blueGray-700">
          Page {currentPage} of {totalPages}
        </div>

    </div>
  );
};

CardPagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  paginate: PropTypes.func.isRequired,
};

export default CardPagination;