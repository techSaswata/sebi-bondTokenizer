"use client";

import LightRays from "@/components/LightRays";

export default function UjjwalaLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Background Light Rays */}
      <div className="absolute inset-0 w-full h-full">
        <LightRays
          raysOrigin="top-center"
          raysColor="#00ffff"
          raysSpeed={1.5}
          lightSpread={0.8}
          rayLength={1.2}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.1}
          distortion={0.05}
          className="absolute inset-0"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Navigation */}
        <nav className="absolute top-8 left-0 right-0 flex justify-between items-center px-8 max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">उ</span>
            </div>
            <span className="text-white text-xl font-semibold">Ujjwala</span>
          </div>
          <div className="flex space-x-8">
            <button className="text-gray-300 hover:text-white transition-colors duration-200">
              Home
            </button>
            <button className="text-gray-300 hover:text-white transition-colors duration-200">
              Docs
            </button>
          </div>
        </nav>

        {/* New Background Badge */}
        <div className="mb-8">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-800/60 border border-gray-700/50 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-3 bg-gradient-to-r from-gray-400 to-gray-600 rounded-sm flex items-center justify-center">
                <div className="w-2 h-1 bg-white/70 rounded-sm"></div>
              </div>
              <span className="text-gray-300 text-sm font-medium">New Background</span>
            </div>
          </div>
        </div>

        {/* Main Heading */}
        <div className="max-w-4xl mx-auto mb-12">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
            May these lights guide you
            <br />
            <span className="text-gray-400">on your path</span>
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <button className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg">
            Get Started
          </button>
          <button className="px-8 py-4 bg-transparent border border-gray-600 text-white font-semibold rounded-full hover:border-gray-400 hover:bg-gray-800/20 transition-all duration-200 backdrop-blur-sm">
            Learn More
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-gray-400 text-lg mt-8 max-w-2xl mx-auto leading-relaxed">
          Experience the radiance of modern web development with Ujjwala. 
          Let our luminous interface illuminate your journey through innovation.
        </p>
      </div>

      {/* Additional ambient light effects */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-cyan-500/10 to-transparent pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-cyan-400/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-radial from-blue-500/15 to-transparent rounded-full blur-2xl pointer-events-none"></div>
    </div>
  );
}
