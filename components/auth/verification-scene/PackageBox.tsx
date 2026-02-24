'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Float } from '@react-three/drei';
import * as THREE from 'three';

export function PackageBox() {
  const groupRef = useRef<THREE.Group>(null!);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null!);
  const edgeMaterialRef = useRef<THREE.MeshBasicMaterial>(null!);
  const materialized = useRef(false);

  useFrame(({ clock }) => {
    const elapsed = clock.elapsedTime;
    const group = groupRef.current;
    const mat = materialRef.current;

    if (!group || !mat) return;

    // Materialize: scale from 0 to 1 over first 0.8s
    if (!materialized.current) {
      if (elapsed < 0.8) {
        const progress = elapsed / 0.8;
        const eased = 1 - Math.pow(1 - progress, 3);
        group.scale.setScalar(eased);
      } else {
        group.scale.setScalar(1);
        materialized.current = true;
      }
    }

    // Continuous slow Y-axis rotation (~0.3 rad/s)
    group.rotation.y = elapsed * 0.3;

    // Gentle emissive pulse: sine-wave between 0.15 and 0.35
    mat.emissiveIntensity = 0.25 + Math.sin(elapsed * 1.5) * 0.1;

    // Update edge opacity in sync
    if (edgeMaterialRef.current) {
      edgeMaterialRef.current.opacity = 0.2 + mat.emissiveIntensity * 0.3;
    }
  });

  return (
    <Float
      speed={1.5}
      rotationIntensity={0.1}
      floatIntensity={0.3}
      floatingRange={[-0.05, 0.05]}
    >
      <group ref={groupRef} scale={0}>
        {/* Main box */}
        <RoundedBox args={[1.2, 1.2, 1.2]} radius={0.12} smoothness={4}>
          <meshStandardMaterial
            ref={materialRef}
            color="#0891b2"
            metalness={0.3}
            roughness={0.4}
            emissive="#06b6d4"
            emissiveIntensity={0}
          />
        </RoundedBox>

        {/* Wireframe overlay for tech look */}
        <RoundedBox args={[1.22, 1.22, 1.22]} radius={0.12} smoothness={4}>
          <meshBasicMaterial
            ref={edgeMaterialRef}
            wireframe
            color="#22d3ee"
            transparent
            opacity={0.2}
          />
        </RoundedBox>

        {/* Cross symbol on front face */}
        {/* Horizontal bar */}
        <mesh position={[0, 0, 0.62]}>
          <boxGeometry args={[0.5, 0.08, 0.02]} />
          <meshBasicMaterial color="#a5f3fc" transparent opacity={0.6} />
        </mesh>
        {/* Vertical bar */}
        <mesh position={[0, 0, 0.62]}>
          <boxGeometry args={[0.08, 0.5, 0.02]} />
          <meshBasicMaterial color="#a5f3fc" transparent opacity={0.6} />
        </mesh>
      </group>
    </Float>
  );
}
