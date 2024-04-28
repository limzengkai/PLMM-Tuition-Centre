import React from 'react'
import RiseLoader from "react-spinners/BeatLoader";

const CardLoading = ({ loading }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px', // Adjust minHeight as needed
      }}
    >
      <RiseLoader
        color="#007bff"
        loading={loading}
        size={30}
        aria-label="Loading Spinner"
        data-testid="loader"
      />
    </div>
  )
}

export default CardLoading