import AnalyticsTracker from "@/components/AnalyticsTracker";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

const Index = lazy(() => import("./pages/Index"));
const Services = lazy(() => import("./pages/Services"));
const ServiceDetails = lazy(() => import("./pages/ServiceDetails"));
const Sectors = lazy(() => import("./pages/Sectors"));
const Process = lazy(() => import("./pages/Process"));
const WhyUs = lazy(() => import("./pages/WhyUs"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQs = lazy(() => import("./pages/FAQs"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPostApi = lazy(() => import("./pages/BlogPostApi"));
const AdminBlogEditor = lazy(() => import("./pages/AdminBlogEditor"));
const AdminInbox = lazy(() => import("./pages/AdminInbox"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CandidateRegister = lazy(() => import("./pages/CandidateRegister"));
const ClientRegister = lazy(() => import("./pages/ClientRegister"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CandidateDashboard = lazy(() => import("./pages/CandidateDashboard"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));

const routeFallback = (
  <div className="flex min-h-screen items-center justify-center bg-background px-4 text-sm text-muted-foreground">
    Loading page...
  </div>
);

const App = () => (
  <BrowserRouter>
    <AnalyticsTracker />
    <Suspense fallback={routeFallback}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:id" element={<ServiceDetails />} />
        <Route path="/sectors" element={<Sectors />} />
        <Route path="/process" element={<Process />} />
        <Route path="/why-us" element={<WhyUs />} />
        <Route path="/about" element={<WhyUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faqs" element={<FAQs />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPostApi />} />
        <Route path="/dashboard/admin/blogs" element={<AdminBlogEditor />} />
        <Route path="/dashboard/admin/inbox" element={<AdminInbox />} />
        <Route path="/register/candidate" element={<CandidateRegister />} />
        <Route path="/register/client" element={<ClientRegister />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard/candidate" element={<CandidateDashboard />} />
        <Route path="/dashboard/client" element={<ClientDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
