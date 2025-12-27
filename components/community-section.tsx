"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MessageCircle, Video } from "lucide-react"
import { motion } from "framer-motion"

export function CommunitySection() {
  const tiktokVideos = [
    { id: 1, thumbnail: "/tiktok-profile.png", views: "161.2M", url: "https://www.tiktok.com/@marcelldegen/video/7349069167263354117" },
    { id: 2, thumbnail: "/tiktok-thumb.png", views: "8.4M", url: "https://www.tiktok.com/@marcelldegen/video/7106831147576954139" },
    { id: 3, thumbnail: "/otter-mascot.png", views: "7.9M", url: "https://www.tiktok.com/@marcelldegen/video/7202921740622744858" },
    { id: 4, thumbnail: "/tiktok-thumb.png", views: "2.6M", url: "https://www.tiktok.com/@marcelldegen/video/7587374032861859093" },
  ]

  const socialLinks = [
    { icon: Video, label: "TikTok", followers: "8.6M+", color: "bg-accent", handle: "@marcelldegen", url: "https://www.tiktok.com/@marcelldegen" },
    { icon: MessageCircle, label: "Twitter", followers: "45K+", color: "bg-chart-4", handle: "@degentoken", url: "https://twitter.com/degentoken" },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  }

  return (
    <section id="community" className="py-24 relative overflow-hidden">
      {/* Floating Hearts Animation Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0, 
              y: Math.random() * 100 + 100 + "%",
              x: Math.random() * 100 + "%"
            }}
            animate={{ 
              opacity: [0, 0.2, 0],
              y: "-10%",
              x: (Math.random() * 100) + (Math.random() > 0.5 ? 10 : -10) + "%"
            }}
            transition={{ 
              duration: 5 + Math.random() * 5, 
              repeat: Infinity, 
              ease: "linear",
              delay: Math.random() * 5
            }}
            className="absolute text-accent text-2xl"
          >
            ❤️
          </motion.div>
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-7xl font-black mb-6 text-balance">
            <span className="text-accent">Join The</span> <span className="text-foreground">Community</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed">
            {
              "We're more than just holders. We're a family of degens who actually vibe together. Real people, real community, real fun."
            }
          </p>
        </motion.div>

        {/* Social Links */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-6 mb-16 max-w-4xl mx-auto"
        >
          {socialLinks.map((social, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card
                className="p-8 bg-card border-2 border-border hover:border-primary transition-all duration-300 hover:scale-105 group cursor-pointer"
              >
                <div
                  className={`inline-flex p-4 rounded-2xl ${social.color} mb-4 group-hover:scale-110 transition-transform`}
                >
                  <social.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-foreground">{social.label}</h3>
                <p className="text-3xl font-black text-primary mb-2">{social.followers}</p>
                <p className="text-muted-foreground font-semibold">{social.handle}</p>
                <Button 
                  className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                  onClick={() => window.open(social.url, "_blank")}
                >
                  Follow
                </Button>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* TikTok Video Carousel */}
        <div className="mb-12">
          <motion.h3 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-black text-center mb-8 text-primary"
          >
            {"Trending on TikTok 🔥"}
          </motion.h3>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {tiktokVideos.map((video) => (
              <motion.a
                key={video.id}
                variants={itemVariants}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative group cursor-pointer rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-300"
              >
                <img
                  src={video.thumbnail || "/placeholder.svg"}
                  alt={`TikTok video ${video.id}`}
                  className="w-full aspect-[3/4] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                  <div className="flex items-center gap-2 text-white">
                    <Video className="w-5 h-5" />
                    <span className="font-bold">{video.views} views</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Video className="w-12 h-12 text-white" />
                  </div>
                </div>
              </motion.a>
            ))}
          </motion.div>
        </div>

        {/* CTA Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Card className="inline-block p-8 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 border-2 border-primary shadow-[0_0_30px_rgba(15,97,87,0.2)]">
            <p className="text-2xl md:text-3xl font-black mb-4 text-foreground text-balance">
              {"Ready to become a degen?"}
            </p>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6 rounded-2xl shadow-lg hover:shadow-primary/20 transition-all"
              onClick={() => window.open("https://twitter.com/degentoken", "_blank")}
            >
              Join the Movement
            </Button>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}

