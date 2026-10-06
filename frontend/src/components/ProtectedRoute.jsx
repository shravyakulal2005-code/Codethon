import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, fetchMe, loading } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user) {
      fetchMe().finally(() => setChecked(true));
    } else {
      setChecked(true);
    }
  }, []);

  if (!checked || loading) {
    return (
      <div className="loader-overlay">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}
