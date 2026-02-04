'use client';

import { CheckCircle, MapPin, Clock, TreePine, ArrowRight, Mail } from 'lucide-react';

interface LandingHeroProps {
  onExplore: () => void;
  stats?: {
    total: number;
    rideable: number;
  };
}

// Organic topographic contour pattern
function TopoBackground() {
  return (
    <svg 
      className="absolute inset-0 w-full h-full opacity-[0.35] dark:opacity-[0.15]"
      viewBox="0 0 800 600" 
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="none" strokeWidth="1" className="stroke-stone-400 dark:stroke-stone-500">
        {/* Large flowing contours */}
        <path d="M-50 100 Q100 50 200 120 T400 80 T600 150 T850 100" />
        <path d="M-50 130 Q100 80 200 150 T400 110 T600 180 T850 130" />
        <path d="M-50 160 Q100 110 200 180 T400 140 T600 210 T850 160" />
        
        {/* Mid section contours */}
        <path d="M-50 250 Q50 200 150 280 T350 220 T500 300 T700 250 T850 280" />
        <path d="M-50 280 Q50 230 150 310 T350 250 T500 330 T700 280 T850 310" />
        <path d="M-50 310 Q50 260 150 340 T350 280 T500 360 T700 310 T850 340" />
        
        {/* Nested hill contours - left */}
        <ellipse cx="180" cy="350" rx="120" ry="80" />
        <ellipse cx="180" cy="350" rx="90" ry="60" />
        <ellipse cx="180" cy="350" rx="60" ry="40" />
        <ellipse cx="180" cy="350" rx="30" ry="20" />
        
        {/* Nested hill contours - right */}
        <ellipse cx="620" cy="400" rx="140" ry="90" />
        <ellipse cx="620" cy="400" rx="105" ry="67" />
        <ellipse cx="620" cy="400" rx="70" ry="45" />
        <ellipse cx="620" cy="400" rx="35" ry="22" />
        
        {/* Bottom flowing contours */}
        <path d="M-50 480 Q100 430 250 500 T450 450 T650 520 T850 470" />
        <path d="M-50 510 Q100 460 250 530 T450 480 T650 550 T850 500" />
        <path d="M-50 540 Q100 490 250 560 T450 510 T650 580 T850 530" />
        <path d="M-50 570 Q100 520 250 590 T450 540 T650 610 T850 560" />
        
        {/* Small nested feature - top right */}
        <ellipse cx="680" cy="120" rx="60" ry="45" />
        <ellipse cx="680" cy="120" rx="35" ry="25" />
        
        {/* Connecting flow lines */}
        <path d="M300 200 Q350 250 320 300 T380 380" />
        <path d="M330 200 Q380 250 350 300 T410 380" />
        <path d="M450 150 Q480 200 460 280 T520 350" />
        <path d="M480 150 Q510 200 490 280 T550 350" />
      </g>
      
      {/* Accent lines */}
      <g fill="none" strokeWidth="1.5" className="stroke-stone-500/50 dark:stroke-amber-600/30">
        <path d="M-50 190 Q100 140 200 210 T400 170 T600 240 T850 190" />
        <path d="M-50 340 Q50 290 150 370 T350 310 T500 390 T700 340 T850 370" />
        <ellipse cx="180" cy="350" rx="75" ry="50" />
        <ellipse cx="620" cy="400" rx="87" ry="56" />
      </g>
    </svg>
  );
}

export function LandingHero({ onExplore, stats }: LandingHeroProps) {
  return (
    <div className="min-h-[calc(100vh-60px)] relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50/30 dark:from-stone-900 dark:via-stone-900 dark:to-stone-800" />
      
      {/* Traditional topo contour lines */}
      <TopoBackground />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-60px)] px-4 py-16">
        
        {/* Hero Card */}
        <div className="max-w-2xl w-full">
          {/* Main card with texture */}
          <div className="relative bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-stone-900/10 dark:shadow-black/30 overflow-hidden border border-stone-200/50 dark:border-stone-700/50">
            
            {/* Accent bar */}
            <div className="h-2 bg-gradient-to-r from-green-600 via-green-500 to-emerald-400" />
            
            {/* Card content */}
            <div className="p-8 sm:p-12">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Colorado Trail Conditions
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-800 dark:text-stone-100 mb-4 tracking-tight">
                Know Before
                <br />
                <span className="text-green-600 dark:text-green-400">You Go</span>
              </h1>
              
              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-stone-600 dark:text-stone-300 mb-8 max-w-lg leading-relaxed">
                AI-powered trail predictions help you protect the trails you love. 
                Check conditions before you head out.
              </p>

              {/* Stats row */}
              {stats && (
                <div className="flex flex-wrap gap-4 sm:gap-8 mb-8 pb-8 border-b border-stone-200 dark:border-stone-700">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-stone-500 dark:text-stone-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-stone-800 dark:text-stone-100">{stats.total.toLocaleString()}</div>
                      <div className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wide">Trails</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.rideable.toLocaleString()}</div>
                      <div className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wide">Good to Go</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-stone-500 dark:text-stone-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-stone-800 dark:text-stone-100">Daily</div>
                      <div className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wide">Updates</div>
                    </div>
                  </div>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={onExplore}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-semibold text-lg rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Explore Trail Map
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* How it works - smaller cards below */}
          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            {[
              { num: '01', title: 'Weather Data', desc: 'Real-time precipitation & temperature from stations across Colorado' },
              { num: '02', title: 'Trail Analysis', desc: 'Soil type, elevation, aspect & drainage for each trail' },
              { num: '03', title: 'Predictions', desc: 'AI model estimates dry time based on conditions' },
            ].map((item) => (
              <div
                key={item.num}
                className="p-5 rounded-2xl bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm border border-stone-200/50 dark:border-stone-700/50"
              >
                <div className="text-xs font-bold text-green-600 dark:text-green-400 mb-2">{item.num}</div>
                <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-1">{item.title}</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Help improve callout */}
          <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-green-600/10 to-emerald-600/10 border border-green-500/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <TreePine className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-1">Help Us Improve</h3>
                <p className="text-sm text-stone-600 dark:text-stone-300 mb-2">
                  Predictions get better with your feedback. See something wrong? 
                  Click any trail and use the <strong>Report Condition</strong> button on the trail details page.
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  <strong>Why "Stay Singletrack"?</strong> Using muddy trails causes erosion and widens paths. 
                  Check conditions. Go when it's dry. Keep singletrack single.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-stone-200 dark:border-stone-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                <TreePine className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span>© {new Date().getFullYear()} Stay Singletrack</span>
              </div>
              <a
                href="mailto:hello@staysingletrack.com"
                className="inline-flex items-center gap-1.5 text-stone-500 dark:text-stone-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              >
                <Mail className="w-4 h-4" />
                hello@staysingletrack.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
