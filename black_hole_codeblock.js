// =====================================================================
//  BLACK HOLE  -  CODE BLOCK version
//  Click the code block: a black hole forms ahead of you, sucks in
//  everything nearby for a few seconds, then collapses in a big blast.
// =====================================================================

// ---- Settings ----------------------------------------------------------------
const HOLE_DISTANCE = 9;                     // how far ahead of you it forms
const HOLE_DURATION_MS = 5000;               // how long it pulls
const PULL_RADIUS = 12;
const PULL_STRENGTH = 1.6;                   // pull per step (stronger when closer)
const STEP_MS = 50;
const TICK_DAMAGE = 1;                       // damage per second near the core
const CORE_RADIUS = 2.5;

const BLAST_RADIUS = 10;
const BLAST_FORCE = 22;
const BLAST_DAMAGE = 25;
const IMMUNE_OWNER = true;                   // the player who clicked isn't pulled or hurt

const COOLDOWN_MS = 12000;                   // per-block cooldown

// ---- Cooldown (stored on the code block's own memory so it survives clicks) --------
if (typeof globalThis.__bhLast === "undefined") globalThis.__bhLast = 0;
const wait = COOLDOWN_MS - (api.now() - globalThis.__bhLast);

if (wait > 0) {
    api.sendMessage(myId, "Black hole recharging: " + Math.ceil(wait / 1000) + "s", { color: "orange" });
} else {
    globalThis.__bhLast = api.now();

    // ---- Helpers ----
    function dist3(a, b) {
        const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    function swirl(pos, radius, count, colorA, colorB) {
        api.playParticleEffect({
            dir1: [-1, -0.2, -1],
            dir2: [1, 0.2, 1],
            pos1: [pos[0] - radius, pos[1] - radius * 0.4, pos[2] - radius],
            pos2: [pos[0] + radius, pos[1] + radius * 0.4, pos[2] + radius],
            texture: "glint",
            minLifeTime: 0.4,
            maxLifeTime: 1,
            minEmitPower: 1,
            maxEmitPower: 3,
            minSize: 0.2,
            maxSize: 0.7,
            manualEmitCount: count,
            gravity: [0, 0, 0],
            colorGradients: [{ timeFraction: 0, minColor: colorA, maxColor: colorB }],
            velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }],
            blendMode: 1,
        });
    }

    function everyoneNear(pos, radius) {
        let ids = api.getPlayerIds();
        try { ids = ids.concat(api.getMobIds()); } catch (e) {}
        const out = [];
        for (const id of ids) {
            if (IMMUNE_OWNER && id === myId) continue;
            const p = api.getPosition(id);
            if (!p) continue;
            const d = dist3(pos, p);
            if (d <= radius) out.push({ id: id, p: p, d: d });
        }
        return out;
    }

    // ---- Where the hole forms ----
    const pos = api.getPosition(myId);
    const dir = api.getPlayerFacingInfo(myId).dir;
    const center = [
        pos[0] + dir[0] * HOLE_DISTANCE,
        pos[1] + 1.5 + dir[1] * HOLE_DISTANCE,
        pos[2] + dir[2] * HOLE_DISTANCE,
    ];
    const endsAt = api.now() + HOLE_DURATION_MS;
    let nextDamage = api.now() + 1000;

    api.broadcastSound("ominousBellHit", 1, 0.5, { playerIdOrPos: center, maxHearDist: 50 });
    api.broadcastMessage([{ str: api.getEntityName(myId) + " opened a BLACK HOLE!", style: { color: "#a020f0" } }]);

    // ---- Collapse ----
    function collapse() {
        swirl(center, 5, 150, [255, 255, 255, 1], [160, 60, 255, 1]);
        api.broadcastSound("cannonFire1", 1, 0.4, { playerIdOrPos: center, maxHearDist: 60 });

        everyoneNear(center, BLAST_RADIUS).forEach(t => {
            const falloff = 1 - t.d / BLAST_RADIUS;
            const len = Math.max(0.001, Math.sqrt((t.p[0] - center[0]) ** 2 + (t.p[2] - center[2]) ** 2));
            api.applyImpulse(
                t.id,
                ((t.p[0] - center[0]) / len) * BLAST_FORCE * falloff,
                8 * falloff + 3,
                ((t.p[2] - center[2]) / len) * BLAST_FORCE * falloff
            );
            try {
                api.attemptApplyDamage({
                    eId: myId,
                    hitEId: t.id,
                    attemptedDmgAmt: Math.round(BLAST_DAMAGE * falloff) + 3,
                    withItem: "Black Hole",
                    attackDir: [0, 1, 0],
                    showCritParticles: true,
                    reduceVerticalKbVelocity: false,
                });
            } catch (e) {}
        });
    }

    // ---- Pull loop ----
    function pull() {
        const now = api.now();

        swirl(center, 3, 6, [120, 0, 200, 1], [30, 0, 60, 1]);
        swirl(center, 0.6, 3, [0, 0, 0, 1], [20, 0, 40, 1]);

        const doDamage = now >= nextDamage;
        everyoneNear(center, PULL_RADIUS).forEach(t => {
            const closeness = 1 - t.d / PULL_RADIUS;
            const len = Math.max(0.001, t.d);
            const s = PULL_STRENGTH * (0.4 + closeness);
            api.applyImpulse(
                t.id,
                ((center[0] - t.p[0]) / len) * s,
                ((center[1] - t.p[1]) / len) * s * 0.8,
                ((center[2] - t.p[2]) / len) * s
            );

            if (doDamage && t.d <= CORE_RADIUS) {
                try {
                    api.attemptApplyDamage({
                        eId: myId,
                        hitEId: t.id,
                        attemptedDmgAmt: TICK_DAMAGE,
                        withItem: "Black Hole",
                        attackDir: [0, 0, 0],
                        showCritParticles: false,
                        reduceVerticalKbVelocity: false,
                    });
                } catch (e) {}
            }
        });
        if (doDamage) nextDamage = now + 1000;

        if (now >= endsAt) {
            collapse();
        } else {
            api.setCallbackTimeout(pull, STEP_MS);
        }
    }

    api.setCallbackTimeout(pull, STEP_MS);
}
