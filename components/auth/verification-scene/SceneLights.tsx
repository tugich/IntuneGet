'use client';

export function SceneLights() {
  return (
    <>
      {/* Moody ambient base */}
      <ambientLight intensity={0.15} />

      {/* Cool white key light -- upper right */}
      <directionalLight
        position={[3, 4, 2]}
        intensity={0.8}
        color="#e0f0ff"
      />

      {/* Cyan fill -- left side */}
      <pointLight
        position={[-3, 1, 2]}
        intensity={0.6}
        color="#0891b2"
        distance={10}
      />

      {/* Violet accent -- below right */}
      <pointLight
        position={[2, -2, 1]}
        intensity={0.4}
        color="#7c3aed"
        distance={8}
      />

      {/* Cyan rim light -- behind */}
      <pointLight
        position={[0, 1, -3]}
        intensity={0.3}
        color="#06b6d4"
        distance={8}
      />
    </>
  );
}
