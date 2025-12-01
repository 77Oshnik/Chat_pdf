'use client';

import { Scene } from "@/components/ui/hero-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, MessageSquare, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: FileText,
    title: "PDF Analysis",
    description: "Upload any PDF and instantly unlock its knowledge with AI processing.",
  },
  {
    icon: MessageSquare,
    title: "Smart Chat",
    description: "Ask questions naturally and get accurate, context-aware answers.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Storage",
    description: "Your documents are encrypted and protected with enterprise-grade security.",
  },
  {
    icon: Zap,
    title: "Instant Insights",
    description: "Get summaries and key takeaways in seconds, not hours.",
  },
];

const DemoOne = () => {
  return (
    <div className="min-h-svh w-screen bg-gradient-to-br from-[#000] to-[#1A2428] text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="w-full max-w-6xl space-y-12 relative z-10">
        <div className="flex flex-col items-center text-center space-y-8">
          <Badge variant="secondary" className="backdrop-blur-sm bg-white/10 border border-white/20 text-white hover:bg-white/20 px-4 py-2 rounded-full">
            ✨ AI-Powered PDF Intelligence
          </Badge>
          
          <div className="space-y-6 flex items-center justify-center flex-col ">
            <h1 className=" text-3xl md:text-6xl font-semibold tracking-tight max-w-3xl">
              Chat with your Documents using Advanced AI
            </h1>
            <p className="text-lg text-neutral-300 max-w-2xl">
              Transform your static PDFs into interactive conversations. Extract insights, summarize content, and get answers instantly with our RAG-powered platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Link href="/register">
                <Button className="text-sm px-8 py-3 rounded-xl bg-white text-black border border-white/10 shadow-none hover:bg-white/90 transition-none">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button className="text-sm px-8 py-3 rounded-xl bg-transparent text-white border border-white/20 shadow-none hover:bg-white/10 transition-none">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 h-40 md:h-48 flex flex-col justify-start items-start space-y-2 md:space-y-3"
            >
              <feature.icon size={18} className="text-white/80 md:w-5 md:h-5" />
              <h3 className="text-sm md:text-base font-medium">{feature.title}</h3>
              <p className="text-xs md:text-sm text-neutral-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
      <div className='absolute inset-0 z-0 pointer-events-none'>
        <Scene />
      </div>
    </div>
  );
};

export { DemoOne };
