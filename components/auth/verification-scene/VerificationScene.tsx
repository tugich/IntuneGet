'use client';

import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { motion } from 'framer-motion';
import { SceneLights } from './SceneLights';
import { PackageBox } from './PackageBox';

interface VerificationSceneProps {
  statusText?: string;
}

export function VerificationScene({ statusText = 'Verifying permissions...' }: VerificationSceneProps) {
  const [ready, setReady] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        aria-hidden="true"
        className="w-[320px] h-[320px] sm:w-[400px] sm:h-[400px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 0.6 }}
      >
        <Canvas
          camera={{ position: [0, 0, 5], fov: 40 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true }}
          onCreated={() => setReady(true)}
          style={{ background: 'transparent' }}
        >
          <SceneLights />
          <PackageBox />

          <EffectComposer>
            <Bloom
              mipmapBlur
              intensity={0.8}
              luminanceThreshold={0.8}
              luminanceSmoothing={0.3}
            />
          </EffectComposer>
        </Canvas>
      </motion.div>

      <motion.p
        aria-live="polite"
        className="text-text-muted text-sm font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {statusText}
      </motion.p>
    </div>
  );
}
