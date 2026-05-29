"use client";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import React from "react";

const hashToUnit = (value: number) => {
  const x = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export const Meteors = ({
  number,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  const meteors = new Array(number || 20).fill(true);
  return (
    <motion.div
      className="absolute inset-0 h-full w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {meteors.map((el, idx) => {
        const meteorCount = number || 20;
        // Calculate position to evenly distribute meteors across container width
        const position = idx * (800 / meteorCount) - 400; // Spread across 800px range, centered
        const delay = hashToUnit(idx + meteorCount) * 5;
        const duration = 5 + Math.floor(hashToUnit(idx * 2 + meteorCount) * 5);

        return (
          <span
            key={"meteor" + idx}
            className={cn(
              "animate-meteor-effect absolute h-0.5 w-0.5 rotate-45 rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10]",
              "before:absolute before:top-1/2 before:h-px before:w-12.5 before:translate-y-[-50%] before:transform before:bg-linear-to-r before:from-[#64748b] before:to-transparent before:content-['']",
              className,
            )}
            style={{
              top: "-40px", // Start above the container
              left: position + "px",
              animationDelay: delay + "s",
              animationDuration: duration + "s",
            }}
          ></span>
        );
      })}
    </motion.div>
  );
};
