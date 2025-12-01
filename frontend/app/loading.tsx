"use client";
import { useTheme } from "next-themes";
import { ClipLoader } from "react-spinners";

export default function Loading() {
  const { theme } = useTheme();

  const color = theme === "dark" ? "#ffffff" : "#000000";

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <ClipLoader
        color={color}
        size={60}
        speedMultiplier={1.2}
      />
    </div>
  );
}
