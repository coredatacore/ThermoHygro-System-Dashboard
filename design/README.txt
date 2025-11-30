Import this SVG into Figma and set up styles/components

1) Create a new Figma file and Frame
   - Frame size: 1440 x 1024 (Desktop)
   - Background: #f3f6fb

2) Import the mockup
   - Drag and drop `design/dashboard-mock.svg` into the frame
   - Select the SVG and choose “Ungroup” (Shift+Cmd/Ctrl+G) if needed

3) Define color styles
   - FG (text): #0f172a
   - Accent: #3b82f6
   - Success: #22c55e
   - Danger: #ef4444
   - Glass: white 85% opacity, stroke #d1d5db

4) Create components
   - Status Pill: pill background + icon/dot + label
   - Gauge Card: header + semicircle arc + needle + value + status
   - Chart Card: header + grid + 2 lines (red/blue)
   - Table: header row + item row (Time, Temp °C, Humidity %)
   - Export Button: rounded, border #d1d5db, fill rgba(59,130,246,0.12)

5) Apply Auto Layout
   - Status container: horizontal, spacing 24, center aligned
   - Gauge row: grid of 2, gap 24
   - Chart/table cards: vertical content spacing inside the card

6) Typography
   - Title: 18–22 px, Semibold
   - Labels: 14 px, Regular
   - Values: 20–26 px, Bold

7) Optional refinements
   - Add soft shadows to cards (Y 8, Blur 24, 8–10% opacity)
   - Build variants for light/dark (swap background and text colors)

This mock mirrors the current `dashboard.html` layout post-cleanup.
