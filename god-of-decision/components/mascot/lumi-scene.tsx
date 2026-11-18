"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { Group, Material, Mesh, MeshStandardMaterial } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

/**
 * The 3D mascot, Lumi. See docs/MASCOT.md.
 *
 * Imported only through `Lumi` (lumi.tsx), which loads this file and
 * three.js lazily and never on the server.
 */

const MODEL_URL = "/images/mascot/lumi.glb";

/** Float and sway, per docs/MASCOT.md → Animation. */
const FLOAT_SECONDS = 3;
const FLOAT_HEIGHT = 0.035; // model is 1 unit tall: ~7px at 200px
const SWAY_SECONDS = 4;
const SWAY_DEGREES = 3;

function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(false);

    useEffect(() => {
        const query = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => setReduced(query.matches);

        update();
        query.addEventListener("change", update);

        return () => query.removeEventListener("change", update);
    }, []);

    return reduced;
}

/**
 * Turns the export's plastic shine into the matte vinyl the spec asks
 * for. The model is from an image-to-3D tool and comes out glossy; a
 * floor on roughness fixes that without editing the file.
 */
function matte(material: Material) {
    const standard = material as MeshStandardMaterial;

    if ("roughness" in standard) {
        standard.roughness = 1;
        standard.metalness = 0;
        standard.needsUpdate = true;
    }
}

function Model({
    animate,
    onReady,
}: {
    animate: boolean;
    onReady: () => void;
}) {
    const gltf = useLoader(GLTFLoader, MODEL_URL, (loader) => {
        loader.setMeshoptDecoder(MeshoptDecoder);
    });

    const scene = useMemo(() => {
        gltf.scene.traverse((object) => {
            const mesh = object as Mesh;

            if (!mesh.isMesh) return;

            const materials = Array.isArray(mesh.material)
                ? mesh.material
                : [mesh.material];

            materials.forEach(matte);
        });

        return gltf.scene;
    }, [gltf]);

    useEffect(onReady, [onReady]);

    const group = useRef<Group>(null);

    useFrame(({ clock }) => {
        const node = group.current;

        if (!node || !animate) return;

        const t = clock.getElapsedTime();

        node.position.y =
            Math.sin((t / FLOAT_SECONDS) * Math.PI * 2) * FLOAT_HEIGHT;

        // Out of phase with the float, so the two never line up into
        // one mechanical bob.
        node.rotation.z =
            Math.sin((t / SWAY_SECONDS) * Math.PI * 2 + 1) *
            ((SWAY_DEGREES * Math.PI) / 180);

        // A slow look around, so it reads as 3D rather than a sticker.
        node.rotation.y = Math.sin(t * 0.35) * 0.35;
    });

    return (
        <group ref={group}>
            {/* The model stands from y = 0 to y = 1. Centre it. */}
            <primitive object={scene} position={[0, -0.5, 0]} />
        </group>
    );
}

interface LumiSceneProps {
    onReady: () => void;
}

export default function LumiScene({ onReady }: LumiSceneProps) {
    const reduced = usePrefersReducedMotion();

    return (
        <Canvas
            dpr={[1, 2]}
            gl={{ alpha: true, antialias: true }}
            camera={{ position: [0, 0.05, 2.6], fov: 26 }}
            // Nothing moves when motion is reduced, so stop drawing.
            frameloop={reduced ? "demand" : "always"}
            // R3F turns pointer events back on for its own wrapper,
            // which would swallow the card's hold gesture underneath.
            style={{ pointerEvents: "none" }}
        >
            {/* Key from top left, lavender rim from behind, soft fill. */}
            <hemisphereLight args={["#ffffff", "#B796FE", 2.4]} />
            <directionalLight position={[-1.5, 2, 2]} intensity={1.6} />
            <directionalLight
                position={[0.5, 1, -2]}
                intensity={1.2}
                color="#B796FE"
            />

            <Suspense fallback={null}>
                <Model animate={!reduced} onReady={onReady} />
            </Suspense>
        </Canvas>
    );
}
