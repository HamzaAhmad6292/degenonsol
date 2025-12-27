"use client";
import { Shield, Heart, Zap, CheckCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"

export function AboutSection() {
  const features = [
    {
      icon: Shield,
      title: "Authentic AF",
      description: "No fake promises, no BS. Just real community vibes and transparent tokenomics.",
      color: "text-primary",
    },
    {
      icon: Heart,
      title: "TikTok Native",
      description: "Born on TikTok, raised by the community. We speak your language - memes.",
      color: "text-accent",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Built on blazing-fast tech. Trade, hold, and vibe at the speed of internet culture.",
      color: "text-secondary",
    },
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
    <section id="about" className="py-24 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-7xl font-black mb-6 text-balance">
            <span className="text-primary">What Is</span> <span className="text-secondary">$degen</span>
            <span className="text-accent">?</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed">
            {
              "We're not just another meme token. We're a movement. A lifestyle. A vibe. Built by degens, for degens, with the TikTok community at our core."
            }
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 mb-16"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card
                className="p-8 bg-card border-2 border-border hover:border-primary transition-all duration-300 hover:scale-105 group h-full"
              >
                <feature.icon className={`w-12 h-12 mb-4 ${feature.color} group-hover:scale-110 transition-transform`} />
                <h3 className="text-2xl font-bold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Story Section with Asymmetric Layout */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-2 md:order-1"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 rounded-3xl blur-2xl" />
              <img 
                src="/tiktok-profile.png" 
                alt="Marcell Degen TikTok Profile" 
                className="relative rounded-3xl shadow-2xl w-full border-4 border-primary/20" 
              />
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-1 md:order-2 space-y-6"
          >
            <h3 className="text-4xl font-black text-primary text-balance">Our Story</h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {
                "It all started with a viral TikTok. @marcelldegen wasn't trying to create the next big thing - he was just vibing, sharing crypto memes, and building a community of real people who got it."
              }
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {
                "The community spoke. They wanted something authentic. Something fun. Something that wasn't just another pump and dump. So we created $degen - a token that actually represents the culture."
              }
            </p>
            <div className="space-y-3">
              {["Community-Driven", "Transparency First", "Meme-Powered", "TikTok Authentic"].map((item, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                  <span className="text-foreground font-semibold">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
