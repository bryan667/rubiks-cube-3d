import { forwardRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'

type CubeletProps = {
  position: [number, number, number]
  colors: string[]
  highlighted?: boolean
}

const Cubelet = forwardRef<THREE.Group, CubeletProps>(function Cubelet(
  { position, colors, highlighted = false },
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

  useEffect(() => {
    materials.forEach((material) => {
      material.emissive.set(highlighted ? '#60a5fa' : '#000000')
      material.emissiveIntensity = highlighted ? 0.45 : 0
    })
  }, [highlighted, materials])

  return (
    <group ref={ref} position={position}>
      <mesh castShadow receiveShadow material={materials}>
        <boxGeometry args={[0.92, 0.92, 0.92]} />
      </mesh>
    </group>
  )
})

export default Cubelet
