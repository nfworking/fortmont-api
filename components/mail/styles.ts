import * as React from "react"

export const S = {
  root: {
    display: "flex",
    height: "100vh",
    background: "#111",
    color: "#e8e8e8",
    fontFamily: "var(--font-sans, system-ui, sans-serif)",
    fontSize: "13px",
    overflow: "hidden",
  } as React.CSSProperties,

  sidebar: {
    width: "200px",
    flexShrink: 0,
    background: "#161616",
    borderRight: "0.5px solid #2a2a2a",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  } as React.CSSProperties,

  listPanel: {
    width: "310px",
    flexShrink: 0,
    borderRight: "0.5px solid #2a2a2a",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  } as React.CSSProperties,

  readingPane: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    background: "#111",
  } as React.CSSProperties,
}