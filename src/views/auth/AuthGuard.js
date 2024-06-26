import { useContext, useEffect } from "react";
import { AuthContext } from "../../config/context/AuthContext";
import { useNavigate } from "react-router-dom"; // Import useNavigate hook

const AuthGuard = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  // const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate(); // Initialize the navigate function

  useEffect(() => {
    // Redirect user based on role when userRole is fetched
    if (currentUser && currentUser.role !== null) {
      switch (currentUser.role) {
        case "admin":
          navigate("/admin/dashboard");
          break;
        case "parent":
          navigate("/parent/dashboard");
          break;
        case "teacher":
          console.log("teacher ");
          navigate("/teacher/dashboard");
          break;
        default:
          break;
      }
    }
  }, [currentUser]);

  // If user is not authenticated or user role is not fetched yet, render the children components
  return children;
};

export default AuthGuard;