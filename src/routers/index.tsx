import UserInfoPage from "@/page/UserInfoPage";
import RecordingPage from "@/page/RecordingPage";
import ThankYouPage from "@/page/ThankYouPage";
import { Route, Routes } from "react-router-dom";

const AppRouter = () => {
    return (
        <Routes>
            <Route path="/" element={<UserInfoPage />} />
            <Route path="/recording" element={<RecordingPage />} />
            <Route path="/thank-you" element={<ThankYouPage />} />
        </Routes>
    );
}

export default AppRouter;