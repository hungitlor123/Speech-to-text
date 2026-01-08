import UserInfoPage from "@/page/UserInfoPage";
import RecordingPage from "@/page/RecordingPage";
import ThankYouPage from "@/page/ThankYouPage";
import LoginPage from "@/page/LoginPage";
import Dashboard from "@/page/Admin/Dashboard";
import ManagerUsers from "@/page/Admin/ManagerUsers";
import ProtectedRoute from "./ProtectedRoute";
import { Route, Routes } from "react-router-dom";
import ManagerRecords from "@/page/Admin/ManagerRecords";

const AppRouter = () => {
    return (
        <Routes>
            <Route path="/" element={<UserInfoPage />} />
            <Route path="/recording" element={<RecordingPage />} />
            <Route path="/thank-you" element={<ThankYouPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
            <Route path="/admin/recording" element={<ProtectedRoute element={<ManagerRecords />} />} />
            <Route path="/admin/users" element={<ProtectedRoute element={<ManagerUsers />} />} />

        </Routes>
    );
}

export default AppRouter;