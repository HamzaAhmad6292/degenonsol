"use client"

import { Card } from "@/components/ui/card"
import { Coins, Lock, Users, Rocket } from "lucide-react"
import type React from "react"
import { motion } from "framer-motion"

export function TokenomicsSection() {
  const distribution = [
    { label: "Community Holders", percentage: 60, color: "bg-primary", icon: Users },
    { label: "Liquidity Pool", percentage: 20, color: "bg-secondary", icon: Lock },
    { label: "Marketing & Growth", percentage: 15, color: "bg-accent", icon: Rocket },
    { label: "Team (Vested)", percentage: 5, color: "bg-chart-4", icon: Coins },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } }
  }

  return (
    <section id="tokenomics" className="py-24 relative bg-card/30 overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -translate-x-1/2" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-7xl font-black mb-6 text-balance">
            <span className="text-secondary">Tokenomics</span> <span className="text-foreground">That</span>{" "}
            <span className="text-accent">Slap</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed">
            {"No sketchy allocations. No rug pulls. Just transparent, community-first tokenomics."}
          </p>
        </motion.div>

        {/* Visual Distribution */}
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
            {/* Pie Chart Representation */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, type: "spring" }}
              className="relative"
            >
              <div className="aspect-square rounded-full overflow-hidden shadow-2xl border-8 border-background bg-background/50 backdrop-blur-sm">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {
                    distribution.reduce(
                      (acc, item, index) => {
                        const prevPercentage = index === 0 ? 0 : acc.sum
                        const segment = (
                          <motion.circle
                            key={index}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            className={item.color.replace("bg-", "stroke-")}
                            strokeWidth="20"
                            strokeDasharray={`${(item.percentage / 100) * 251.2} 251.2`}
                            strokeDashoffset={-prevPercentage * 2.512}
                            initial={{ pathLength: 0, opacity: 0 }}
                            whileInView={{ pathLength: 1, opacity: 0.9 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, delay: index * 0.2, ease: "easeOut" }}
                          />
                        )
                        acc.segments.push(segment)
                        acc.sum += item.percentage
                        return acc
                      },
                      { segments: [] as React.ReactNode[], sum: 0 },
                    ).segments
                  }
                </svg>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1, type: "spring" }}
                  className="text-center bg-background/80 backdrop-blur-sm rounded-full p-8 shadow-xl border border-white/10"
                >
                  <p className="text-4xl font-black text-primary">$degen</p>
                  <p className="text-sm text-muted-foreground font-semibold">Fair Launch</p>
                </motion.div>
              </div>
            </motion.div>

            {/* Distribution Breakdown */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-4"
            >
              {distribution.map((item, index) => {
                const Icon = item.icon
                return (
                  <motion.div key={index} variants={itemVariants}>
                    <Card
                      className="p-6 bg-card border-2 border-border hover:border-primary transition-all duration-300 hover:scale-105"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${item.color}`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-lg font-bold text-foreground">{item.label}</h4>
                            <span className="text-2xl font-black text-primary">{item.percentage}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${item.percentage}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                              className={`h-full ${item.color}`}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>

          {/* Key Points */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              { title: "🔥 No Tax", desc: "Zero buy/sell tax. Trade freely without worrying about hidden fees." },
              { title: "🔒 LP Locked", desc: "Liquidity pool locked for 2 years. Your investment is safe." },
              { title: "✅ Renounced", desc: "Contract ownership renounced. True community ownership." },
            ].map((item, index) => (
              <Card key={index} className="p-6 bg-background/50 border border-border text-center hover:border-primary transition-colors duration-300">
                <h4 className="text-2xl font-black mb-2">{item.title}</h4>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
