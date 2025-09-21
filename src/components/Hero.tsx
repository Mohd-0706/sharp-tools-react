import React from 'react';
import { ArrowRight, FileText, Image, Download, Upload } from 'lucide-react';

interface HeroProps {
  darkMode: boolean;
  setActiveSection: (section: string) => void;
}

const Hero: React.FC<HeroProps> = ({ darkMode, setActiveSection }) => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  const features = [
    { icon: FileText, text: 'PDF Tools', count: '15+' },
    { icon: Image, text: 'Image Tools', count: '20+' },
    { icon: Upload, text: 'Fast Upload', count: '100MB' },
    { icon: Download, text: 'Instant Download', count: 'Free' },
  ];

  return (
    <section id="home" className={`pt-24 pb-16 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Main Heading */}
          <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Your Complete
            <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              {' '}Digital Toolkit
            </span>
          </h1>

          {/* Subtitle */}
          <p className={`text-lg sm:text-xl mb-8 max-w-3xl mx-auto leading-relaxed ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Free online tools for PDF editing, image conversion, and document processing. 
            No signup required, secure processing, and instant results.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => scrollToSection('pdf-tools')}
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:from-blue-700 hover:to-blue-800 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Explore PDF Tools
              <ArrowRight className="ml-2 h-5 w-5 inline transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => scrollToSection('image-tools')}
              className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 ${
                darkMode
                  ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'
                  : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-300 shadow-lg hover:shadow-xl'
              }`}
            >
              Image Tools
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`p-6 rounded-2xl transition-all duration-300 hover:scale-105 ${
                  darkMode
                    ? 'bg-gray-800 border border-gray-700 hover:bg-gray-750'
                    : 'bg-white border border-gray-200 hover:bg-gray-50 shadow-lg hover:shadow-xl'
                }`}
              >
                <feature.icon className={`h-8 w-8 mx-auto mb-3 ${
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <div className={`text-2xl font-bold mb-1 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {feature.count}
                </div>
                <div className={`text-sm ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {feature.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;