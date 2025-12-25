import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';


// --- HELPER COMPONENT: Scroll Reveal Animation ---
const RevealOnScroll = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Add a small delay if requested
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 } // Trigger when 10% is visible
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.disconnect();
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-20'
      }`}
    >
      {children}
    </div>
  );
};

// --- MAIN HOME COMPONENT ---
const Home = () => {
  const [hoveredLogo, setHoveredLogo] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      
      <Navbar page="home" />

      {/* --- HERO SECTION --- */}
      <main className="pt-40 pb-20 px-6 max-w-4xl mx-auto text-center">
        <RevealOnScroll>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-8 text-black leading-tight">
            Mental health support <br /> 
            <span className="text-blue-600">in your language.</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            QuietCare AI bridges the gap for the deaf and mute community. 
            We use AI to translate Sign Language into text, analyze emotions, and 
            provide psychological support through a realistic 3D Avatar.
          </p>

          <div className="flex justify-center gap-4">
            <Link to="/signup" className="bg-black text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-gray-800 transition">
              Get Started
            </Link>
            <a href="#features" className="bg-gray-100 text-gray-900 px-8 py-3 rounded-full text-lg font-medium hover:bg-gray-200 transition">
              Learn More
            </a>
          </div>
        </RevealOnScroll>
      </main>

      {/* --- FLOATING FEATURE CARDS --- */}
      <section id="features" className="py-20 overflow-hidden bg-gray-50 border-t border-gray-100">
        <div className="mb-12 text-center">
          <RevealOnScroll>
            <h2 className="text-2xl font-bold mb-2">How It Works</h2>
            <p className="text-gray-500">Powered by Computer Vision & NLP</p>
          </RevealOnScroll>
        </div>

        {/* Row 1 - Wrapped in Reveal Effect */}
        <RevealOnScroll delay={100}>
          <div className="relative w-full mb-4 flex">
            <div className="flex animate-scroll-row1 gap-4 px-4">
              {[...row1Features, ...row1Features, ...row1Features].map((feature, index) => (
                <FeatureCard key={`r1-${index}`} feature={feature} />
              ))}
            </div>
          </div>
        </RevealOnScroll>

        {/* Row 2 - Wrapped in Reveal Effect (Slight Delay) */}
        <RevealOnScroll delay={200}>
          <div className="relative w-full mb-4 flex">
            <div className="flex animate-scroll-row2 gap-4 px-4">
              {[...row2Features, ...row2Features, ...row2Features].map((feature, index) => (
                <FeatureCard key={`r2-${index}`} feature={feature} />
              ))}
            </div>
          </div>
        </RevealOnScroll>

        {/* Row 3 - Wrapped in Reveal Effect (More Delay) */}
        <RevealOnScroll delay={300}>
          <div className="relative w-full flex">
            <div className="flex animate-scroll-row3 gap-4 px-4">
              {[...row3Features, ...row3Features, ...row3Features].map((feature, index) => (
                <FeatureCard key={`r3-${index}`} feature={feature} />
              ))}
            </div>
          </div>
        </RevealOnScroll>

      </section>

      {/* --- TWO CENTERED CONTENT SECTIONS --- */}
      <section className="py-24 px-6 max-w-4xl mx-auto space-y-32">
        
        {/* Section 1 */}
        <RevealOnScroll>
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-6 text-black">
              Breaking Communication Barriers
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              The deaf and mute community often struggles to access mental health services due to language barriers. 
              Traditional therapy requires verbal communication, leaving many without support. QuietCare AI uses 
              advanced computer vision and natural language processing to create an inclusive platform where users 
              can express themselves through sign language and receive empathetic responses from an AI psychologist.
            </p>
          </div>
        </RevealOnScroll>

        {/* Section 2 */}
        <RevealOnScroll>
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-6 text-black">
              Emotional Intelligence Meets Technology
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Our system doesn't just translate signs—it understands emotions. Using BERT-based sentiment analysis, 
              QuietCare AI detects stress, anxiety, and sadness in your expressions. The AI psychologist then generates 
              context-aware responses tailored to your emotional state. Replies are delivered through a 3D avatar that 
              signs back to you, creating a truly immersive and supportive experience.
            </p>
          </div>
        </RevealOnScroll>

      </section>

      {/* --- FOOTER --- */}
      <footer className="relative py-12 md:py-16 bg-gray-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start mb-12 md:mb-16 gap-8 md:gap-12 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-lg md:text-xl">Q</span>
              </div>
            </div>
            <div className="flex gap-12 md:gap-24 text-sm">
              <div className="flex flex-col gap-3 md:gap-4">
                <h3 className="text-xs md:text-sm font-semibold text-gray-400 mb-1">Product</h3>
                <a href="#features" className="text-xs md:text-sm text-gray-300 hover:text-white transition">Features</a>
                <Link to="/about" className="text-xs md:text-sm text-gray-300 hover:text-white transition">About</Link>
                <Link to="/signin" className="text-xs md:text-sm text-gray-300 hover:text-white transition">Sign In</Link>
              </div>
              <div className="flex flex-col gap-3 md:gap-4">
                <h3 className="text-xs md:text-sm font-semibold text-gray-400 mb-1">Policies</h3>
                <span className="text-xs md:text-sm text-gray-300 hover:text-white transition">Terms of Use</span>
                <span className="text-xs md:text-sm text-gray-300 hover:text-white transition">Privacy Policy</span>
              </div>
            </div>
          </div>

          <div 
            className="relative cursor-pointer min-h-[40vh] md:min-h-[50vh] flex items-center justify-start"
            onMouseEnter={() => setHoveredLogo(true)}
            onMouseLeave={() => setHoveredLogo(false)}
          >
            <h2 className="text-7xl sm:text-7xl md:text-8xl lg:text-[13rem] font-bold text-white leading-none tracking-tight transition-all duration-500">
              {hoveredLogo ? <Link to="/signup" className="text-blue-400 no-underline">Try Now →</Link> : 'QuietCare AI'}
            </h2>
          </div>

          <div className="pt-6 md:pt-8 border-t border-gray-800 relative z-10">
            <p className="text-gray-500 text-xs md:text-sm">© 2025 QuietCare AI. Final Year Project.</p>
          </div>
        </div>
      </footer>

      {/* --- STYLES --- */}
      <style>{`
        @keyframes scroll-row1 { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }
        @keyframes scroll-row2 { 0% { transform: translateX(-33.333%); } 100% { transform: translateX(0); } }
        @keyframes scroll-row3 { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }
        .animate-scroll-row1 { animation: scroll-row1 45s linear infinite; }
        .animate-scroll-row1:hover { animation-play-state: paused; }
        .animate-scroll-row2 { animation: scroll-row2 50s linear infinite; }
        .animate-scroll-row2:hover { animation-play-state: paused; }
        .animate-scroll-row3 { animation: scroll-row3 40s linear infinite; }
        .animate-scroll-row3:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
};

// --- SUB COMPONENTS ---
const FeatureCard = ({ feature }) => (
  <div className="w-72 bg-gray-800 text-white p-5 rounded-2xl flex-shrink-0 hover:bg-gray-700 transition-all duration-300 cursor-default group">
    <h3 className="text-base font-medium leading-snug">{feature.title}</h3>
  </div>
);

// --- FEATURE DATA ---
const row1Features = [
  { title: "Real-time Sign Language Translation" },
  { title: "Emotion Detection from Facial Expressions" },
  { title: "AI-Powered Psychological Support" },
  { title: "3D Avatar Response Animation" },
  { title: "Bridge the gap for Deaf & Mute" },
];
const row2Features = [
  { title: "Confidential & Private Sessions" },
  { title: "Analyze Stress and Anxiety Levels" },
  { title: "Supports Dynamic Hand Gestures" },
  { title: "Uses MediaPipe & Deep Learning" },
  { title: "Inclusive Mental Health Care" },
];
const row3Features = [
  { title: "Instant Feedback Loop" },
  { title: "Natural Language Processing (BERT)" },
  { title: "Sign-to-Text & Text-to-Sign" },
  { title: "User-Friendly Interface" },
  { title: "Final Year Project 2025" },
];

export default Home;