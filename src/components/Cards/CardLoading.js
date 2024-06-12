import React, { useEffect, useState } from "react";
import RiseLoader from "react-spinners/BeatLoader";

const CardLoading = ({ loading }) => {
  const [minHeight, setMinHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setMinHeight(window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: minHeight + "px",
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