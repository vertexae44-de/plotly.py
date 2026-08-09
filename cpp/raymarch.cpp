// raymarch.cpp -- a tiny signed-distance-field raymarcher that renders to the
// terminal with ANSI truecolor. No dependencies beyond the C++17 standard
// library.
//
//   build:  g++ -std=c++17 -O2 -pthread -o raymarch raymarch.cpp
//   run:    ./raymarch            # animate until Ctrl-C
//           ./raymarch --frames 1 # render a single frame and exit
//           ./raymarch -w 120 -h 40 --ascii
//
// The scene is a torus fused into a bobbing sphere, ringed by orbiting cubes,
// over an infinite checkered plane. Everything is defined implicitly: a
// distance function tells the renderer how far it can safely step, so there is
// no geometry, no triangles, and no rasterizer.

#include <algorithm>
#include <atomic>
#include <chrono>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>
#include <thread>
#include <vector>

namespace {

constexpr double kPi = 3.14159265358979323846;

// ---------------------------------------------------------------------------
// Vector math
// ---------------------------------------------------------------------------

struct Vec3 {
    double x = 0, y = 0, z = 0;

    constexpr Vec3() = default;
    constexpr Vec3(double x_, double y_, double z_) : x(x_), y(y_), z(z_) {}
    explicit constexpr Vec3(double s) : x(s), y(s), z(s) {}

    constexpr Vec3 operator+(const Vec3& o) const { return {x + o.x, y + o.y, z + o.z}; }
    constexpr Vec3 operator-(const Vec3& o) const { return {x - o.x, y - o.y, z - o.z}; }
    constexpr Vec3 operator*(const Vec3& o) const { return {x * o.x, y * o.y, z * o.z}; }
    constexpr Vec3 operator*(double s) const { return {x * s, y * s, z * s}; }
    constexpr Vec3 operator/(double s) const { return {x / s, y / s, z / s}; }
    constexpr Vec3 operator-() const { return {-x, -y, -z}; }
};

constexpr double dot(const Vec3& a, const Vec3& b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

constexpr Vec3 cross(const Vec3& a, const Vec3& b) {
    return {a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x};
}

double length(const Vec3& v) { return std::sqrt(dot(v, v)); }

Vec3 normalize(const Vec3& v) {
    const double len = length(v);
    return len > 0 ? v / len : v;
}

Vec3 vabs(const Vec3& v) { return {std::fabs(v.x), std::fabs(v.y), std::fabs(v.z)}; }

Vec3 vmax(const Vec3& v, double s) {
    return {std::max(v.x, s), std::max(v.y, s), std::max(v.z, s)};
}

Vec3 mix(const Vec3& a, const Vec3& b, double t) { return a + (b - a) * t; }

double clamp01(double v) { return std::min(1.0, std::max(0.0, v)); }

// Smooth polynomial minimum: blends two distance fields into one surface
// instead of creasing them together. `k` is the blend radius.
double smin(double a, double b, double k) {
    const double h = clamp01(0.5 + 0.5 * (b - a) / k);
    return mix(Vec3(b), Vec3(a), h).x - k * h * (1.0 - h);
}

// ---------------------------------------------------------------------------
// Signed distance functions
//
// Each returns the distance from `p` to the nearest point on the surface:
// negative inside, positive outside. Because they never *overestimate* the
// distance, a ray can march by exactly that much without tunnelling through.
// ---------------------------------------------------------------------------

double sdSphere(const Vec3& p, double r) { return length(p) - r; }

double sdTorus(const Vec3& p, double major, double minor) {
    const double q = std::hypot(p.x, p.z) - major;
    return std::hypot(q, p.y) - minor;
}

double sdBox(const Vec3& p, const Vec3& half) {
    const Vec3 d = vabs(p) - half;
    return length(vmax(d, 0.0)) + std::min(std::max(d.x, std::max(d.y, d.z)), 0.0);
}

double sdPlane(const Vec3& p, double height) { return p.y - height; }

Vec3 rotateY(const Vec3& p, double a) {
    const double c = std::cos(a), s = std::sin(a);
    return {c * p.x - s * p.z, p.y, s * p.x + c * p.z};
}

Vec3 rotateX(const Vec3& p, double a) {
    const double c = std::cos(a), s = std::sin(a);
    return {p.x, c * p.y - s * p.z, s * p.y + c * p.z};
}

// What a ray hit, alongside how far away it was.
struct Surface {
    double dist = 0;
    Vec3 albedo;
};

Surface closer(const Surface& a, const Surface& b) { return a.dist < b.dist ? a : b; }

// The scene itself. Every object contributes a distance; the nearest wins.
Surface scene(const Vec3& p, double t) {
    const Vec3 blob = p - Vec3(0.0, 0.35 + 0.28 * std::sin(t * 1.3), 0.0);
    const Vec3 ringSpace = rotateX(rotateY(p - Vec3(0.0, 0.9, 0.0), t * 0.9), 0.55 + 0.25 * std::sin(t * 0.7));

    // Sphere and torus melt into each other via smin.
    const double fused = smin(sdSphere(blob, 0.62), sdTorus(ringSpace, 1.15, 0.16), 0.35);

    Surface best{fused, {0.95, 0.45, 0.25}};
    best = closer(best, {sdPlane(p, -0.75), {0.20, 0.21, 0.26}});

    // A ring of small cubes orbiting the centre, each tumbling on its own axis.
    constexpr int kCubes = 6;
    for (int i = 0; i < kCubes; ++i) {
        const double phase = t * 0.55 + (2.0 * kPi * i) / kCubes;
        const Vec3 centre{2.15 * std::cos(phase), 0.15 + 0.3 * std::sin(t * 1.1 + i),
                          2.15 * std::sin(phase)};
        const Vec3 local = rotateX(rotateY(p - centre, phase * 1.7), phase * 1.1);
        best = closer(best, {sdBox(local, Vec3(0.17)), {0.25, 0.85, 0.95}});
    }
    return best;
}

double sceneDist(const Vec3& p, double t) { return scene(p, t).dist; }

// Central-difference gradient of the distance field == surface normal.
Vec3 normalAt(const Vec3& p, double t) {
    constexpr double e = 1e-4;
    return normalize({
        sceneDist(p + Vec3(e, 0, 0), t) - sceneDist(p - Vec3(e, 0, 0), t),
        sceneDist(p + Vec3(0, e, 0), t) - sceneDist(p - Vec3(0, e, 0), t),
        sceneDist(p + Vec3(0, 0, e), t) - sceneDist(p - Vec3(0, 0, e), t),
    });
}

// March toward the light; if the field ever gets narrow, we are in penumbra.
// One ray gives soft shadows for free -- no sampling required.
double softShadow(const Vec3& origin, const Vec3& dir, double t) {
    double shade = 1.0;
    double travelled = 0.05;
    for (int i = 0; i < 48 && travelled < 12.0; ++i) {
        const double d = sceneDist(origin + dir * travelled, t);
        if (d < 1e-4) return 0.0;
        shade = std::min(shade, 10.0 * d / travelled);
        travelled += std::max(d, 0.02);
    }
    return clamp01(shade);
}

// Cheap ambient occlusion: sample the field at fixed steps along the normal.
// Where the surface curves back on itself the samples come up short.
double ambientOcclusion(const Vec3& p, const Vec3& n, double t) {
    double occ = 0.0, weight = 1.0;
    for (int i = 1; i <= 5; ++i) {
        const double h = 0.03 * i;
        occ += (h - sceneDist(p + n * h, t)) * weight;
        weight *= 0.72;
    }
    return clamp01(1.0 - 2.2 * occ);
}

// ---------------------------------------------------------------------------
// Shading
// ---------------------------------------------------------------------------

Vec3 shade(const Vec3& p, const Vec3& rayDir, const Surface& hit, double t) {
    const Vec3 n = normalAt(p, t);
    const Vec3 lightDir = normalize({0.6, 0.9, -0.45});

    Vec3 albedo = hit.albedo;
    if (p.y < -0.74) {  // checkerboard on the ground plane
        const bool even = (static_cast<int>(std::floor(p.x) + std::floor(p.z)) & 1) == 0;
        albedo = albedo * (even ? 1.0 : 0.30);
    }

    const double diffuse = std::max(0.0, dot(n, lightDir));
    const double shadow = softShadow(p, lightDir, t);
    const double occ = ambientOcclusion(p, n, t);

    // Blinn-Phong specular.
    const Vec3 half = normalize(lightDir - rayDir);
    const double spec = std::pow(std::max(0.0, dot(n, half)), 48.0) * shadow;

    // Fresnel-ish rim light so silhouettes stay readable in ASCII.
    const double rim = std::pow(1.0 - std::max(0.0, dot(n, -rayDir)), 3.0);

    Vec3 colour = albedo * (0.12 * occ);                      // ambient
    colour = colour + albedo * (diffuse * shadow * 1.15);     // key light
    colour = colour + albedo * (0.18 * occ * (0.5 + 0.5 * n.y));  // sky bounce
    colour = colour + Vec3(1.0, 0.96, 0.9) * spec;            // highlight
    colour = colour + Vec3(0.25, 0.5, 0.9) * (rim * 0.35);    // rim
    return colour;
}

// Kept deliberately dark: in the ASCII ramp anything brighter reads as
// texture and competes with the subject.
Vec3 background(const Vec3& dir) {
    const double h = clamp01(0.5 + 0.5 * dir.y);
    return mix({0.004, 0.006, 0.013}, {0.02, 0.032, 0.065}, h);
}

struct Options {
    int width = 100;
    int height = 34;
    int frames = -1;   // negative == run forever
    int threads = 0;   // 0 == detect
    double fps = 30.0;
    bool colour = true;
};

// Sample the field along a ray until we are close enough to call it a hit.
Vec3 trace(const Vec3& origin, const Vec3& dir, double t) {
    double travelled = 0.0;
    for (int step = 0; step < 128; ++step) {
        const Vec3 p = origin + dir * travelled;
        const Surface hit = scene(p, t);
        if (hit.dist < 1e-3 * travelled + 1e-4) {
            const Vec3 lit = shade(p, dir, hit, t);
            const double fog = 1.0 - std::exp(-0.011 * travelled * travelled);
            return mix(lit, background(dir), fog);
        }
        travelled += hit.dist;
        if (travelled > 40.0) break;
    }
    return background(dir);
}

// ---------------------------------------------------------------------------
// Terminal output
// ---------------------------------------------------------------------------

// Ordered by apparent ink coverage, darkest first.
constexpr char kRamp[] = " .:-=+*#%@";
constexpr int kRampSize = sizeof(kRamp) - 1;

// A camera resolved for one instant in time.
struct Camera {
    Vec3 eye, forward, right, up;
};

Camera cameraAt(double t) {
    // Orbits slowly and looks at the centre of the action.
    const double angle = t * 0.25;
    const Vec3 target{0.0, 0.45, 0.0};
    const Vec3 eye = target + Vec3(5.2 * std::sin(angle), 0.95 + 0.3 * std::sin(t * 0.4),
                                   5.2 * std::cos(angle));
    const Vec3 forward = normalize(target - eye);
    const Vec3 right = normalize(cross(forward, {0, 1, 0}));
    return {eye, forward, right, cross(right, forward)};
}

// Render one scanline into `row`. Each row is self-contained -- it opens with
// its own colour escape and resets at the end -- so rows can be built on any
// thread and simply concatenated in order afterwards.
void renderRow(const Options& opt, const Camera& cam, double t, int y, std::string& row) {
    row.clear();

    const double aspect = static_cast<double>(opt.width) / opt.height;
    // Terminal cells are roughly twice as tall as they are wide.
    const double cellAspect = 0.5;

    int lastR = -1, lastG = -1, lastB = -1;
    char buf[32];

    for (int x = 0; x < opt.width; ++x) {
            const double u = (2.0 * (x + 0.5) / opt.width - 1.0) * aspect * cellAspect;
            const double v = 1.0 - 2.0 * (y + 0.5) / opt.height;
            const Vec3 dir = normalize(cam.forward * 2.4 + cam.right * u + cam.up * v);

            Vec3 colour = trace(cam.eye, dir, t);

            // Reinhard tonemap, then gamma correct into display space.
            colour = {colour.x / (1.0 + colour.x), colour.y / (1.0 + colour.y),
                      colour.z / (1.0 + colour.z)};
            colour = {std::pow(clamp01(colour.x), 1.0 / 2.2),
                      std::pow(clamp01(colour.y), 1.0 / 2.2),
                      std::pow(clamp01(colour.z), 1.0 / 2.2)};

            const double luma = dot(colour, {0.2126, 0.7152, 0.0722});
            const int idx = std::min(kRampSize - 1, static_cast<int>(luma * kRampSize));

            if (opt.colour) {
                const int r = static_cast<int>(colour.x * 255.0 + 0.5);
                const int g = static_cast<int>(colour.y * 255.0 + 0.5);
                const int b = static_cast<int>(colour.z * 255.0 + 0.5);
                // Only emit an escape sequence when the colour actually changes.
                if (r != lastR || g != lastG || b != lastB) {
                    std::snprintf(buf, sizeof(buf), "\x1b[38;2;%d;%d;%dm", r, g, b);
                    row += buf;
                    lastR = r, lastG = g, lastB = b;
                }
            }
        row += kRamp[idx];
    }
    row += "\x1b[0m\n";
}

// Renders every scanline across `workers` threads, then splices them together
// in order. Rows are independent, so the only synchronisation needed is an
// atomic cursor handing out the next row to whichever thread is free.
class FrameRenderer {
public:
    FrameRenderer(const Options& opt, unsigned workers)
        : opt_(opt), rows_(static_cast<size_t>(opt.height)), workers_(workers) {}

    void render(double t, std::string& out) {
        const Camera cam = cameraAt(t);
        std::atomic<int> next{0};

        const auto worker = [&] {
            for (int y = next++; y < opt_.height; y = next++) {
                renderRow(opt_, cam, t, y, rows_[static_cast<size_t>(y)]);
            }
        };

        std::vector<std::thread> pool;
        pool.reserve(workers_ - 1);
        for (unsigned i = 1; i < workers_; ++i) pool.emplace_back(worker);
        worker();  // this thread pulls its share too
        for (std::thread& th : pool) th.join();

        out.clear();
        out += "\x1b[H";  // cursor home; we clear once at startup, not per frame
        for (const std::string& row : rows_) out += row;
    }

private:
    const Options& opt_;
    std::vector<std::string> rows_;
    unsigned workers_;
};

int usage(const char* prog) {
    std::fprintf(
        stderr,
        "usage: %s [-w cols] [-h rows] [--frames N] [--fps F] [--threads N] [--ascii]\n"
        "  -w, --width    viewport width in cells   (default 100)\n"
        "  -h, --height   viewport height in cells  (default 34)\n"
        "      --frames   frames to render, 1 = still image (default: unbounded)\n"
        "      --fps      target frame rate         (default 30)\n"
        "      --threads  worker threads            (default: detected cores)\n"
        "      --ascii    disable truecolor output\n",
        prog);
    return 2;
}

}  // namespace

int main(int argc, char** argv) {
    Options opt;

    for (int i = 1; i < argc; ++i) {
        const std::string arg = argv[i];
        const auto next = [&](int& slot) {
            if (i + 1 >= argc) std::exit(usage(argv[0]));
            slot = std::atoi(argv[++i]);
        };
        if (arg == "-w" || arg == "--width") next(opt.width);
        else if (arg == "-h" || arg == "--height") next(opt.height);
        else if (arg == "--frames") next(opt.frames);
        else if (arg == "--threads") next(opt.threads);
        else if (arg == "--fps") {
            if (i + 1 >= argc) return usage(argv[0]);
            opt.fps = std::atof(argv[++i]);
        }
        else if (arg == "--ascii") opt.colour = false;
        else if (arg == "--help") return usage(argv[0]);
        else return usage(argv[0]);
    }

    if (opt.width < 8 || opt.height < 4) {
        std::fprintf(stderr, "error: viewport too small (min 8x4)\n");
        return 2;
    }
    if (opt.fps <= 0.0) {
        std::fprintf(stderr, "error: --fps must be positive\n");
        return 2;
    }
    if (opt.threads < 0) {
        std::fprintf(stderr, "error: --threads must not be negative\n");
        return 2;
    }

    unsigned workers = opt.threads > 0 ? static_cast<unsigned>(opt.threads)
                                       : std::thread::hardware_concurrency();
    if (workers == 0) workers = 1;  // hardware_concurrency may not know
    workers = std::min(workers, static_cast<unsigned>(opt.height));

    const bool animate = opt.frames != 1;
    FrameRenderer renderer(opt, workers);
    std::string frame;
    frame.reserve(static_cast<size_t>(opt.width) * opt.height * 12);

    if (animate) std::fputs("\x1b[2J\x1b[?25l", stdout);  // clear, hide cursor

    const auto start = std::chrono::steady_clock::now();
    const auto period = std::chrono::duration<double>(1.0 / opt.fps);

    for (int n = 0; opt.frames < 0 || n < opt.frames; ++n) {
        const double t = animate ? n / opt.fps : 0.0;
        renderer.render(t, frame);
        std::fwrite(frame.data(), 1, frame.size(), stdout);
        std::fflush(stdout);

        if (!animate) break;
        std::this_thread::sleep_until(start + std::chrono::duration_cast<
            std::chrono::steady_clock::duration>(period * (n + 1)));
    }

    if (animate) std::fputs("\x1b[?25h\x1b[0m\n", stdout);  // restore cursor
    return 0;
}
