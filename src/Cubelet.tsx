import { forwardRef, useMemo } from 'react'
import * as THREE from 'three'

type CubeletProps = {
  position: [number, number, number]
  colors: string[]
}

const Cubelet = forwardRef<THREE.Group, CubeletProps>(function Cubelet(
  { position, colors },
  ref,
) {
  const materials = useMemo(
    () =>
      colors.map(
        (color) =>
          new THREE.MeshStandardMaterial({
            color,
            roughness: 0.35,
            metalness: 0.05,
          }),
      ),
    [colors],
  )

  return (
    <group ref={ref} position={position}>
      <mesh castShadow receiveShadow material={materials}>
        <boxGeometry args={[0.92, 0.92, 0.92]} />
      </mesh>
    </group>
  )
})

export default Cubelet
