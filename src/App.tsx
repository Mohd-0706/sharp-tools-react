import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import PDFTools from './components/PDFTools';
import ImageTools from './components/ImageTools';
import About from './components/About';
import Footer from './components/Footer';
import { useDarkMode } from './hooks/useDarkMode';
import { useActiveSection } from './hooks/useActiveSection';

function App() {
  const [darkMode, setDarkMode] = useDarkMode();
  const [activeSection, setActiveSection] = useActiveSection();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      <Header 
        darkMode={darkMode} 
        setDarkMode={setDarkMode}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      
      <main>
        <Hero 
          darkMode={darkMode}
          setActiveSection={setActiveSection}
        />
        <PDFTools darkMode={darkMode} />
        <ImageTools darkMode={darkMode} />
        <About darkMode={darkMode} />
      </main>
      
      <Footer 
        darkMode={darkMode}
        setActiveSection={setActiveSection}
      />
    </div>
  );
}

export default App;