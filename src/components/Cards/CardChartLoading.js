import React, { useEffect, useState } from "react";
import RiseLoader from "react-spinners/BeatLoader";

const CardLoading = ({ loading }) => {

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: 300 + "px",
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
  );
};

export default CardLoading;