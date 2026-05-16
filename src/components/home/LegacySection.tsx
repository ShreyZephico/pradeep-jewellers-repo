"use client";

import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import Image from "next/image";

import {
  Calendar,
  BadgeCheck,
  Users,
  Award,
  Sparkles,
} from "lucide-react";

import data from "@/data/contactDatas.json";

export default function LegacySection() {
  const legacy = data.legacySection;

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  const icons = [
    <Calendar key="1" className="h-6 w-6" />,
    <Award key="2" className="h-6 w-6" />,
    <Users key="3" className="h-6 w-6" />,
    <BadgeCheck key="4" className="h-6 w-6" />,
  ];

  return (
    <section
      ref={ref}
      className="bg-[#F7F4EF] py-20 md:py-28 overflow-hidden mt-20"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-2 items-center">
          
          {/* LEFT CARD */}
          <div className="relative overflow-hidden rounded-sm bg-gradient-to-r from-[#1D1916] to-[#3B2A15] p-8 md:p-12 text-white shadow-2xl">

            {/* Glow */}
            <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-amber-500/10 blur-3xl"></div>

            {/* Header */}
            <div className="flex items-start gap-5">
              <Image
                src={legacy.astroCard.image}
                alt={legacy.astroCard.name}
                width={90}
                height={90}
                className="h-24 w-24 rounded-full border-2 border-amber-400 object-cover"
              />

              <div>
                <div className="mb-3 flex items-center gap-2 text-xs tracking-[4px] text-amber-400 uppercase">
                  <Sparkles className="h-4 w-4" />
                  {legacy.astroCard.tag}
                </div>

                <h3 className="font-serif text-3xl">
                  {legacy.astroCard.name}
                </h3>

                <p className="mt-2 text-gray-300">
                  {legacy.astroCard.experience}
                </p>
              </div>
            </div>

            {/* Lucky Boxes */}
            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
              
              <div className="border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <p className="mb-3 text-xs tracking-[3px] text-gray-400 uppercase">
                  Lucky Gem
                </p>

                <h4 className="font-serif text-3xl text-amber-400">
                  {legacy.astroCard.luckyGem}
                </h4>
              </div>

              <div className="border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <p className="mb-3 text-xs tracking-[3px] text-gray-400 uppercase">
                  Lucky Metal
                </p>

                <h4 className="font-serif text-3xl text-amber-400">
                  {legacy.astroCard.luckyMetal}
                </h4>
              </div>
            </div>

            {/* Prediction */}
            <p className="mt-10 text-lg leading-9 text-gray-200">
              {legacy.astroCard.prediction}
            </p>

            {/* Button */}
            <Link
              href={legacy.astroCard.buttonLink}
              className="mt-10 inline-flex items-center gap-3 text-sm tracking-[4px] text-amber-400 uppercase transition hover:gap-5"
            >
              {legacy.astroCard.buttonText}
              <span>→</span>
            </Link>
          </div>

          {/* RIGHT CONTENT */}
          <div>
            {/* Badge */}
            <div className="mb-6 flex items-center gap-4">
              <div className="h-[1px] w-14 bg-amber-500"></div>

              <p className="text-xs tracking-[5px] text-amber-700 uppercase">
                {legacy.badge}
              </p>
            </div>

            {/* Title */}
            <h2 className="max-w-2xl font-serif text-5xl leading-tight text-[#2B2118] md:text-7xl">
              Four decades of trust,
              <br />
              weighed in{" "}
              <span className="text-amber-500">
                pure gold.
              </span>
            </h2>

            {/* Description */}
            <p className="mt-8 max-w-2xl text-xl leading-10 text-[#5A5147]">
              {legacy.description}
            </p>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2">
              {legacy.stats.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-5"
                >
                  {/* Icon */}
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-amber-300 text-amber-700">
                    {icons[index]}
                  </div>

                  {/* Text */}
                  <div>
                    <h3 className="font-serif text-5xl text-[#24180F]">
                      {inView ? (
                        <CountUp
                          end={item.number}
                          duration={2.5}
                          separator=","
                        />
                      ) : (
                        item.number
                      )}

                      {item.suffix}
                    </h3>

                    <p className="mt-2 text-sm tracking-[4px] text-[#6B6259] uppercase">
                      {item.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}