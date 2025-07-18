import React from 'react';

const Home = () => {
  return (
    <div className="bg-green-700 min-h-screen text-white">
      <header className="flex justify-between items-center p-6">
        <h1 className="text-2xl font-bold">Mishby Health OS</h1>
        <nav className="space-x-6 font-semibold text-white text-sm md:text-base">
          <a href="#about" className="hover:underline">About</a>
          <a href="#features" className="hover:underline">Features</a>
          <a href="#library" className="hover:underline">Library</a>
          <a href="#recipes" className="hover:underline">Recipes</a>
          <a href="#resources" className="hover:underline">Resources</a>
          <a href="#testimonials" className="hover:underline">Testimonials</a>
          <a href="#preorder" className="hover:underline">Pre-order</a>
          <a href="#contact" className="hover:underline">Contact</a>
        </nav>
      </header>

      <section className="text-center px-4 pt-20 pb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Your All-in-One Health Companion</h2>
        <p className="text-lg md:text-xl mb-8">
          Personal & Family Plans • India | UK | Canada • Culturally Smart Diets
        </p>
        <a href="#preorder">
          <button className="bg-white text-green-800 font-semibold px-6 py-3 rounded-full shadow hover:bg-green-200 transition">
            Pre-order Now
          </button>
        </a>
      </section>

      <section id="features" className="bg-[#fdf6ec] text-gray-800 py-16 px-4">
        <h3 className="text-2xl font-bold mb-10 text-center">Features</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            'Personal Health Planner',
            'Family Diet Organizer',
            'Cultural Region Support (IN | UK | CA)',
            'Posture & Breathing Guidance',
            'Seasonal Food Plans',
            'Mental Health Tools',
          ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow p-6 border hover:shadow-md transition text-center"
            >
              {feature}
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-green-800 text-white text-center py-6 text-sm">
        <p>© 2025 Mishby Health OS — Live Naturally, Heal Holistically</p>
      </footer>
    </div>
  );
};

export default Home;
