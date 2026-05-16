"use client";

import Link from "next/link";
import Image from "next/image";

import data from "@/data/contactDatas.json";

export default function CollectionSection() {
  const collectionData = data.collectionSection;

  return (
    <section className="bg-[#F7F4EF] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        
        {/* Header */}
        <div className="mb-14 flex items-end justify-between">
          <div>
            <div className="mb-4 flex items-center gap-4">
              <div className="h-[1px] w-12 bg-amber-500"></div>

              <p className="text-xs uppercase tracking-[4px] text-amber-700">
                {collectionData.badge}
              </p>
            </div>

            <h2 className="font-serif text-4xl md:text-6xl text-[#2A2018]">
              {collectionData.title}
            </h2>
          </div>

          <Link
            href={collectionData.buttonLink}
            className="hidden md:flex items-center gap-2 text-xs uppercase tracking-[4px] text-[#2A2018] transition hover:gap-4"
          >
            {collectionData.buttonText}
            <span>↗</span>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {collectionData.collections.map((item, index) => (
            <Link
              key={index}
              href={item.link}
              className="group relative block overflow-hidden"
            >
              {/* Image */}
              <div className="relative h-[500px] overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-105"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 z-10 p-6 text-white">
                <p className="mb-3 text-xs tracking-[3px] text-amber-300">
                  {item.id}
                </p>

                <h3 className="font-serif text-4xl leading-tight">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm text-gray-300">
                  {item.subtitle}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile Button */}
        <div className="mt-10 flex justify-center md:hidden">
          <Link
            href={collectionData.buttonLink}
            className="flex items-center gap-2 text-xs uppercase tracking-[4px] text-[#2A2018]"
          >
            {collectionData.buttonText}
            <span>↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}