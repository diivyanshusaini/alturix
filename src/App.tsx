import { Route, Routes, useLocation } from 'react-router-dom';
import { LiveCanvas, Pointer, RouteCurtain, SmoothScroll } from './components/motion';
import { Layout } from './components/shared';
import Home from './pages/Home'; import SectionPage from './pages/Section'; import CaseStudies from './pages/CaseStudies';
import ProjectPage from './pages/ProjectPage'; import About from './pages/About'; import Contact from './pages/Contact';
import CreativeUniverse from './pages/CreativeUniverse';
import IntroExperience from './pages/IntroExperience';
import AdminApp from './admin/AdminApp';

export default function App() {
  const { pathname } = useLocation();
  const shell = <><SmoothScroll /><RouteCurtain /></>;
  if (pathname.startsWith('/admin')) return <Routes><Route path="/admin/*" element={<AdminApp />} /></Routes>;
  return (
    <>
      {shell}<IntroExperience /><LiveCanvas /><Pointer />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/universe" element={<CreativeUniverse />} />
          <Route path="/video-editing" element={<SectionPage section="video" />} />
          <Route path="/graphic-design" element={<SectionPage section="graphic" />} />
          <Route path="/experiments" element={<SectionPage section="experiment" />} />
          <Route path="/case-studies" element={<CaseStudies />} />
          <Route path="/work/:slug" element={<ProjectPage />} />
          <Route path="/project/:slug" element={<ProjectPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<div className="px-10 py-40"><h1 className="display text-6xl">404.</h1></div>} />
        </Routes>
      </Layout>
    </>
  );
}
