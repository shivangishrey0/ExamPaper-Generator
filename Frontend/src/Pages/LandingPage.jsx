import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Importing Assets
import heroImg from "../assets/img1.jpg";
import onlineExamImg from "../assets/img2.jpg";
import gradingImg from "../assets/img3.jpg";
import proctorImg from "../assets/img4.jpg";

function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#FDFBF7]/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-stone-800 rounded-lg flex items-center justify-center text-amber-50 font-bold text-xl font-serif italic">E</div>
          <span className="text-xl font-bold tracking-tight text-stone-800 font-serif italic">ExamGen</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-stone-600 hover:text-stone-900 font-medium transition-colors">Features</a>
          <a href="#security" className="text-stone-600 hover:text-stone-900 font-medium transition-colors">Security</a>
          <a href="#pricing" className="text-stone-600 hover:text-stone-900 font-medium transition-colors">Pricing</a>
        </div>

        <button
          onClick={() => navigate('/login-options')}
          className="bg-stone-800 text-amber-50 px-6 py-2.5 rounded-full font-medium hover:bg-stone-700 transition-all transform hover:scale-105 shadow-lg shadow-stone-800/10 italic"
        >
          Login
        </button>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 py-16">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-stone-700 rounded flex items-center justify-center text-white font-serif italic text-sm">E</div>
              <span className="text-2xl font-bold text-stone-100 font-serif italic">ExamGen</span>
            </div>
            <p className="max-w-xs text-stone-400 leading-relaxed">
              Empowering institutions with secure, intelligent, and seamless assessment solutions.
            </p>
          </div>

          <div>
            <h4 className="text-stone-100 font-bold mb-6 italic">Platform</h4>
            <ul className="space-y-4">
              <li><a href="#" className="hover:text-amber-100 transition-colors">Online Exams</a></li>
              <li><a href="#" className="hover:text-amber-100 transition-colors">Proctoring</a></li>
              <li><a href="#" className="hover:text-amber-100 transition-colors">Grading</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-stone-100 font-bold mb-6 italic">Support</h4>
            <ul className="space-y-4">
              <li><a href="#" className="hover:text-amber-100 transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-amber-100 transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-amber-100 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
          <p>© 2024 ExamPaper Generator. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-white">Twitter</a>
            <a href="#" className="hover:text-white">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            <div className="lg:w-1/2 text-center lg:text-left">
              <div className="inline-block px-4 py-1.5 mb-6 bg-amber-100/50 text-amber-900 border border-amber-200 rounded-full text-sm font-semibold tracking-wide uppercase">
                Future of Assessment
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6 text-stone-900 italic font-serif">
                Assessment <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 to-stone-600">Reimagined</span>
              </h1>
              <p className="text-lg text-stone-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                A complete ecosystem for modern education. From secure admin dashboards to proctored student exams, we handle it all with elegance and precision.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={() => navigate('/login-options')}
                  className="w-full sm:w-auto px-8 py-4 bg-stone-900 text-amber-50 rounded-xl font-bold text-lg hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/20 italic"
                >
                  Start Assessment
                </button>
                <button className="w-full sm:w-auto px-8 py-4 bg-white text-stone-700 border border-stone-200 rounded-xl font-bold text-lg hover:bg-stone-50 transition-all italic">
                  Watch Demo
                </button>
              </div>
            </div>

            <div className="lg:w-1/2 relative">
              <div className="relative rounded-t-[10rem] rounded-b-3xl overflow-hidden shadow-2xl shadow-stone-900/10 ring-1 ring-stone-900/5 bg-stone-200 aspect-[3/4] md:aspect-[4/3] group">
                <img
                  src={heroImg}
                  alt="Students taking exam"
                  className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105 filter sepia-[.15]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 1: Student Online Exams */}
      <section className="py-24 bg-white" id="features">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2">
              <div className="rounded-3xl overflow-hidden shadow-xl ring-1 ring-stone-900/5 aspect-video">
                <img src={onlineExamImg} alt="Online Exams" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 filter sepia-[.1]" />
              </div>
            </div>
            <div className="md:w-1/2">
              <h2 className="text-4xl font-bold mb-6 text-stone-900 italic font-serif">Seamless Online Exams</h2>
              <p className="text-lg text-stone-600 mb-6 leading-relaxed">
                Students can take exams from anywhere with our robust platform.
                Interactive interfaces, timer sync, and auto-submission ensure a stress-free experience for candidates.
              </p>
              <ul className="space-y-4">
                {['Real-time saving', 'Multiple question types', 'Instant Feedback'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-stone-700 font-medium">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 text-xs">✓</div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Admin Checking (Reversed Layout) */}
      <section className="py-24 bg-[#FDFBF7]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row-reverse items-center gap-16">
            <div className="md:w-1/2">
              <div className="rounded-3xl overflow-hidden shadow-xl ring-1 ring-stone-900/5 aspect-video">
                <img src={gradingImg} alt="Admin Grading" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 filter sepia-[.1]" />
              </div>
            </div>
            <div className="md:w-1/2">
              <h2 className="text-4xl font-bold mb-6 text-stone-900 italic font-serif">Intelligent Admin Grading</h2>
              <p className="text-lg text-stone-600 mb-6 leading-relaxed">
                Say goodbye to piles of paper. Admins can digitally evaluate answers, annotate directly on screen, and release results with a single click.
              </p>
              <button className="text-amber-800 font-bold hover:text-amber-900 uppercase tracking-widest text-sm border-b-2 border-amber-200 hover:border-amber-800 transition-all pb-1">
                Explore Dashboard
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3: Proctored Exams */}
      <section className="py-24 bg-stone-900 text-white" id="security">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2">
              <div className="rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 aspect-video">
                <img src={proctorImg} alt="Proctored Exams" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 opacity-90" />
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="inline-block px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-red-500/30">
                High Security
              </div>
              <h2 className="text-4xl font-bold mb-6 italic font-serif">Proctored Environment</h2>
              <p className="text-lg text-stone-400 mb-6 leading-relaxed">
                Ensure integrity with AI-driven proctoring. Our system monitors tab switching, audio levels, and presence to guarantee fair assessments for everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}