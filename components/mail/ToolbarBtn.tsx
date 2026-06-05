"use client"

import * as React from "react"
import { useState } from "react"

interface ToolbarBtnProps {
  children: React.ReactNode
  title: string
  onClick?: () => void
}

export function ToolbarBtn({ children, title, onClick }: ToolbarBtnProps) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "28px", height: "28px", borderRadius: "6px",
        border: "0.5px solid #2a2a2a",
        background: hovered ? "#2a2a2a" : "#1e1e1e",
        color: hovered ? "#ccc" : "#777",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.1s", flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}