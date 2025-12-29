"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { Play } from "lucide-react"

// Placeholder data - in a real app, this would come from an API or config
const viralVideos = [
  {
    id: 1,
    title: "The Video That Started It All",
    views: "7.9M",
    likes: "850K",
    desc: "The video that started it all. 🦦🌎 #viral #otter #cute",
    thumbnail: "/tiktok-real-car.png", // Original viral hit
    url: "https://www.tiktok.com/@marcelldegen/video/7349069167263354117"
  },
  {
    id: 2,
    title: "Baby Otter Holding $DEGEN",
    views: "161M",
    likes: "12.5M",
    desc: "Baby otter holding $DEGEN coin goes viral! 🥺💎 #solana #memecoin",
    thumbnail: "/tiktok-tv-show.png", // Original TV show appearance
    url: "https://www.tiktok.com/@marcelldegen/video/7106831147576954139"
  },
  {
    id: 3,
    title: "When The Otter Trades Better Than You",
    views: "8.4M",
    likes: "1.2M",
    desc: "When the otter trades better than you 🎮📈 #crypto #gaming",
    thumbnail: "/tiktok-raffi-ahmad.png", // Original Raffi Ahmad appearance
    url: "https://www.tiktok.com/@marcelldegen/video/7202921740622744858"
  }
]

export function ViralGallery() {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, -100])

  return (
    <section className="py-24 px-4 relative overflow-hidden z-10">
      {/* Parallax Background with Top Fade Mask */}
      <motion.div 
        style={{ y }}
        className="absolute inset-0 z-0"
      >
        <div className="absolute inset-0 bg-black/60 z-10" />
        <img 
          src="/viral-bg.png" 
          alt="Luxury Lounge" 
          className="w-full h-[120%] object-cover"
        />
        {/* Gradient Mask to blend with Hero Section */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/80 to-black z-20" />
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-6xl mx-auto relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl text-white mb-4 drop-shadow-lg px-4">
            The First Otter to break Tiktok
          </h2>
          <div className="h-1 w-16 md:w-24 bg-primary mx-auto rounded-full shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-4">
          {viralVideos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="group relative aspect-[9/16] bg-black/40 rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all duration-500 shadow-2xl hover:shadow-[0_0_30px_rgba(212,175,55,0.2)]"
            >
              {/* Thumbnail Image */}
              <img 
                src={video.thumbnail} 
                alt={video.title} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100 grayscale-[20%] group-hover:grayscale-0"
              />
              
              {/* Cinematic Tint Overlay - Blends image with the luxury green theme */}
              <div className="absolute inset-0 bg-[#0F1F12]/40 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-0" />
              
              {/* Vignette & Gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/95" />
              
              {/* Content Overlay */}
              <a href={video.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex flex-col justify-end p-5 md:p-6 z-20">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="text-lg md:text-xl font-serif text-white mb-2 drop-shadow-md line-clamp-1">{video.title}</h3>
                  <p className="text-white/80 text-[10px] md:text-xs mb-2 line-clamp-2 drop-shadow-md">{video.desc}</p>
                  <div className="flex items-center gap-4 text-xs md:text-sm font-medium">
                    <span className="text-primary drop-shadow-md">{video.views} Views</span>
                    <span className="text-white/80 drop-shadow-md">{video.likes} Likes</span>
                  </div>
                </div>
                
                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    <Play className="w-5 h-5 md:w-6 md:h-6 text-white fill-white" />
                  </div>
                </div>
              </a>

            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
