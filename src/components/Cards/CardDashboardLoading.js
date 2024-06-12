import React from 'react'
import RiseLoader from "react-spinners/MoonLoader";

const CardDashboardLoading = ({ loading }) => {
  return (
    <div
      style={{
        // display: 'flex',
        // justifyContent: 'center',
        // alignItems: 'center',
        // marginTop: '1rem',
        minHeight: '3px', // Adjust minHeight as needed
      }}
    >
      <RiseLoader
        color="#007bff"
        loading={loading}
        size={15}
        aria-label="Loading Spinner"
        data-testid="loader"
      />
    </div>
  )
}

export default CardDashboardLoading