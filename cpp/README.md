# raymarch

A dependency-free C++17 signed-distance-field raymarcher that renders an
animated 3D scene straight into the terminal using ANSI truecolor.

```sh
g++ -std=c++17 -O2 -pthread -o raymarch raymarch.cpp
./raymarch
```

## What it does

There is no geometry in this program — no meshes, no triangles, no rasterizer.
The scene is described purely as a mathematical function that, given any point
in space, returns the distance to the nearest surface. Rays are then advanced by
exactly that distance, which is guaranteed safe because the function never
overestimates. A surface is found when the distance collapses to near zero.

Everything else falls out of that one function:

| Effect | How it is derived |
| --- | --- |
| Surface normals | central difference (gradient) of the distance field |
| Soft shadows | one ray toward the light, tracking how narrow the field gets |
| Ambient occlusion | a handful of samples stepped along the normal |
| Fused shapes | `smin`, a smooth polynomial minimum of two distances |

Shading is Blinn-Phong with a rim term, Reinhard tonemapped and gamma corrected,
then mapped to a glyph from the ramp ` .:-=+*#%@` by luminance.

## Options

```
-w, --width    viewport width in cells   (default 100)
-h, --height   viewport height in cells  (default 34)
    --frames   frames to render, 1 = still image (default: unbounded)
    --fps      target frame rate         (default 30)
    --threads  worker threads            (default: detected cores)
    --ascii    disable truecolor output
```

Scanlines are rendered in parallel and spliced back together in order, so output
is identical regardless of `--threads`. On a 4-core machine that is roughly
50 fps uncapped at the default 100x34.

`--frames 1` prints a single still and skips the screen-clear and
cursor-hiding escapes, so it is safe to pipe to a file.
