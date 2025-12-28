"use client"

import { motion } from "framer-motion"
import { Heart, MessageCircle, Share2, Music } from "lucide-react"

export function TikTokSection() {
  const videos = [
    {
      id: 1,
      image: "/tiktok-real-car.png", // The viral hit (User provided)
      views: "7.9M",
      likes: "850K",
      desc: "The video that started it all. 🦦🌎 #viral #otter #cute",
      live: false,
      url: "https://www.tiktok.com/@marcelldegen/video/7349069167263354117"
    },
    {
      id: 2,
      image: "/tiktok-tv-show.png", // User provided TV show appearance
      views: "161M",
      likes: "12.5M",
      desc: "Baby otter holding $DEGEN coin goes viral! 🥺💎 #solana #memecoin",
      live: true,
      url: "https://www.tiktok.com/@marcelldegen/video/7106831147576954139"
    },
    {
      id: 3,
      image: "/tiktok-raffi-ahmad.png", // User provided Raffi Ahmad appearance
      views: "8.4M",
      likes: "1.2M",
      desc: "When the otter trades better than you 🎮📈 #crypto #gaming",
      live: false,
      url: "https://www.tiktok.com/@marcelldegen/video/7202921740622744858"
    }
  ]

  return (
    <section className="py-24 bg-[#051F20] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-[#52B788]/10 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Jungle Overlays */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[url('https://images.unsplash.com/photo-1596323676766-999999999999?q=80&w=500&auto=format&fit=crop')] opacity-20 mix-blend-overlay rotate-180 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#051F20] to-transparent z-20" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 border border-[#69C9D0]/30 mb-6"
          >
            <Music className="w-4 h-4 text-[#69C9D0]" />
            <span className="text-[#69C9D0] font-bold tracking-wider text-sm">@marcelldegen</span>
          </motion.div>
          
          <h2 className="text-5xl md:text-7xl font-black text-white mb-6 drop-shadow-xl">
            AS SEEN ON <span className="text-[#69C9D0]">TIKTOK</span>
          </h2>
          <p className="text-xl text-[#95D5B2] max-w-2xl mx-auto font-medium">
            The internet's favorite otter is now on Solana. Join the viral movement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <a href={video.url} target="_blank" rel="noopener noreferrer" className="block">
                {/* Phone Frame */}
                <div className="relative aspect-[9/16] bg-black rounded-[2.5rem] border-8 border-[#1a1a1a] overflow-hidden shadow-2xl transform transition-transform duration-300 group-hover:-translate-y-4 cursor-pointer">
                  {/* Image/Video Placeholder */}
                  <img 
                    src={video.image} 
                    alt="TikTok Video" 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[20px] border-l-white border-b-[10px] border-b-transparent ml-1" />
                    </div>
                  </div>

                  {/* UI Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 flex flex-col justify-end p-6">
                    <div className="text-white font-medium mb-4 line-clamp-2 drop-shadow-md">
                      {video.desc}
                    </div>
                    
                    <div className="flex items-center justify-between text-white/90">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Heart className="w-6 h-6 fill-white text-white drop-shadow-md" />
                          <span className="text-xs font-bold shadow-black drop-shadow-md">{video.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-6 h-6 text-white drop-shadow-md" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Share2 className="w-6 h-6 text-white drop-shadow-md" />
                      </div>
                    </div>
                  </div>

                  {/* Views Badge */}
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1">
                    <span>▶</span> {video.views}
                  </div>

                  {/* Live Badge */}
                  {video.live && (
                    <div className="absolute top-4 left-4 bg-[#FE2C55] px-3 py-1 rounded-sm text-xs font-bold text-white animate-pulse">
                      LIVE
                    </div>
                  )}
                </div>
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
