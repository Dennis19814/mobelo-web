'use client'

import { useMemo, useState } from 'react'

const carouselImages = [
  { src: '/images/mockups/pink.png' },
  { src: '/images/mockups/green.png' },
  { src: '/images/mockups/purple.png' },
  { src: '/images/mockups/blue.png' },
  { src: '/images/mockups/orange.png' },
  { src: '/images/mockups/gray.png' },
]

const glowGradient = ''

export default function HomeAppCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)

  const visibleSlides = useMemo(() => {
    const total = carouselImages.length
    const offsets = [-2, -1, 0, 1, 2]
    return offsets.map((offset) => {
      const index = (activeIndex + offset + total) % total
      return { index, offset, item: carouselImages[index] }
    })
  }, [activeIndex])

  const getSlideStyle = (offset: number) => {
    const isCenter = offset === 0
    const absOffset = Math.abs(offset)
    const translateX = offset * 125
    const scale = isCenter ? 1.1 : absOffset === 1 ? 0.85 : 0.7
    const opacity = isCenter ? 1 : absOffset === 1 ? 1 : 0.8
    const blur = isCenter ? 0 : absOffset === 1 ? 0 : 0
    const zIndex = 10 - absOffset
    const rotateY = offset * 8
    
    return {
      transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`,
      opacity,
      filter: `blur(${blur}px)`,
      zIndex,
    }
  }

  return (
    <section className="relative  overflow-hidden" aria-labelledby="app-carousel-heading">

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="relative">
          <div className="relative mx-auto max-w-6xl">
            {/* Glow effect for center card */}
            <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[500px] bg-gradient-to-r ${glowGradient} opacity-20 blur-[100px] transition-all duration-700 pointer-events-none`}></div>
            
            <div className="relative mx-auto flex h-[480px] md:h-[540px] items-center justify-center perspective-1000" aria-label="App preview carousel" style={{ perspective: '1000px' }}>
              {visibleSlides.map(({ index, offset, item }) => {
                const isCenter = offset === 0
                return (
                  <button
                    key={item.src}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className="group absolute left-1/2 top-1/2 transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(0.22,0.61,0.36,1)] will-change-transform cursor-pointer"
                    style={getSlideStyle(offset)}
                    aria-label="View app preview"
                    aria-current={isCenter ? 'true' : 'false'}
                  >
                    <div className="relative">
                      {/* Enhanced glow for center card */}
                      {isCenter && (
                        <div className={`absolute -inset-6 bg-gradient-to-r  animate-pulse`}></div>
                      )}
                      
                      {/* iPhone frame (matched to Templates section) */}
                      <div
                        className={`relative aspect-[9/19.5] h-[320px] md:h-[380px] w-auto bg-[#080808] p-[1.2%] shadow-2xl flex flex-col ring-1 ring-black/50 transition-all duration-700 ${
                          isCenter ? 'saturate-100' : 'saturate-50'
                        }`}
                        style={{ borderRadius: '18% / 8.5%' }}
                      >
                          {/* Physical Buttons */}
                          <div className="absolute -left-[1.5px] top-[18%] w-[2px] h-[6%] bg-[#1a1a1a] rounded-l-sm"></div>
                          <div className="absolute -left-[1.5px] top-[26%] w-[2px] h-[12%] bg-[#1a1a1a] rounded-l-sm"></div>
                          <div className="absolute -left-[1.5px] top-[40%] w-[2px] h-[12%] bg-[#1a1a1a] rounded-l-sm"></div>
                          <div className="absolute -right-[1.5px] top-[32%] w-[2px] h-[18%] bg-[#1a1a1a] rounded-r-sm"></div>

                          {/* Screen Container */}
                          <div
                            className="relative w-full h-full bg-white overflow-hidden flex flex-col shadow-inner ring-1 ring-inset ring-black/5"
                            style={{ borderRadius: '16.5% / 7.8%' }}
                          >
                            {/* Top Spacer */}
                            <div className="h-[5%] w-full flex-shrink-0 bg-white z-20"></div>

                            {/* Dynamic Island */}
                            <div className="absolute top-[2.2%] left-1/2 -translate-x-1/2 w-[28%] h-[3%] bg-black rounded-full z-50 flex items-center justify-end px-[1.5%]">
                              <div className="w-[12%] aspect-square rounded-full bg-[#1a1a2e]"></div>
                            </div>

                                              {/* Content Area */}
                            <div className="flex-1 w-full relative bg-white overflow-hidden">
                              <img
                                src={item.src}
                                alt=""
                                className={`w-full h-full object-fill transition-all duration-700 ${
                                  isCenter ? 'opacity-100 scale-100' : 'opacity-80 scale-95'
                                }`}
                                style={{ display: 'block' }}
                              />
                            </div>

                            {/* Home Bar Area */}
                            <div className="h-[4%] w-full flex items-center justify-center flex-shrink-0 bg-white">
                              <div className="w-[32%] h-[2.5px] bg-black/15 rounded-full"></div>
                            </div>
                          </div>
                        </div>

                     
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Navigation arrows */}
        <button
  onClick={() =>
    setActiveIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)
  }
  className="absolute left-0 top-1/2 -translate-y-1/2 group
    bg-white hover:bg-slate-50 text-slate-700
    rounded-full p-3
    border border-slate-200 hover:border-slate-300
    transition-all duration-300 hover:scale-105
    shadow-md"
  aria-label="Previous app preview"
>
  <svg
    className="w-5 h-5 transform group-hover:-translate-x-0.5 transition-transform"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      d="M15 19l-7-7 7-7"
    />
  </svg>
</button>

            
      <button
  onClick={() => setActiveIndex((prev) => (prev + 1) % carouselImages.length)}
  className="absolute right-0 top-1/2 -translate-y-1/2 group
    bg-white hover:bg-slate-50 text-slate-700
    rounded-full p-3
    border border-slate-200 hover:border-slate-300
    transition-all duration-300 hover:scale-105
    shadow-md"
  aria-label="Next app preview"
>
  <svg
    className="w-5 h-5 transform group-hover:translate-x-0.5 transition-transform"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      d="M9 5l7 7-7 7"
    />
  </svg>
</button>

          </div>

        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </section>
  )
}