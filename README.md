# The Good Stuff Campfire - Background Ocean Scene

This is a simplified Three.js ocean scene that serves as a beautiful background for video content. The scene features a realistic ocean with day/night cycle and an animated campfire with configurable character sprites.

## Features

- Realistic ocean surface with waves and reflections
- Dynamic sky with day/night cycle and stars
- Animated campfire with character sprites
- Configurable number of characters (2, 3, or 4)
- Simple camera controls (mousewheel to zoom in/out)
- Optimized for use as video background

## Getting Started

### Prerequisites

This project uses ES6 modules, so it needs to be served over HTTP (not opened directly as a file).

### Running the Project

#### Option 1: Python Simple HTTP Server (Recommended)

If you have Python installed (comes pre-installed on macOS):

```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open your browser to: `http://localhost:8000`

#### Option 2: Node.js HTTP Server

If you have Node.js installed:

```bash
# Install http-server globally (one-time)
npm install -g http-server

# Run the server
http-server -p 8000
```

Then open your browser to: `http://localhost:8000`

#### Option 3: VS Code Live Server

If you're using Visual Studio Code:
1. Install the "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

## Switching Between Character States

To configure the number of characters (2, 3, or 4), add a URL parameter to the end of the URL:

```
http://localhost:8000/?sprites=2  # Two characters
http://localhost:8000/?sprites=3  # Three characters
http://localhost:8000/?sprites=4  # Four characters
```

## Controls

- **Mouse Wheel**: Zoom in/out

## Technical Details

The scene includes:
- Ocean rendering with surface and volume
- Sky system with day/night cycle and stars
- Animated campfire with realistic flames
- Character sprite system with frame-based animation
- Minimal camera system with zoom control
- Dynamic character positioning based on count

## Character Arrangements

- **2 Characters**: Sitting across from each other
- **3 Characters**: Triangle arrangement
- **4 Characters**: Two rows (2 front, 2 back)
