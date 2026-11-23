// Orthographic yaw and pitch, following CrystalLattice's projected Scenery views.
// Here z is vertical to match the calculus axes.
type Point3 = readonly [number, number, number];

export function orthographic(
  yawDegrees: number,
  pitchDegrees: number,
  scale: number,
  [originX, originY]: readonly [number, number],
) {
  const yaw = (yawDegrees * Math.PI) / 180;
  const pitch = (pitchDegrees * Math.PI) / 180;
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);
  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);

  return ([x, y, z]: Point3) => {
    const horizontal = x * cosYaw + y * sinYaw;
    const forward = x * sinYaw - y * cosYaw;
    const point: readonly [number, number] = [
      originX + horizontal * scale,
      originY + (forward * sinPitch - z * cosPitch) * scale,
    ];
    return { point, depth: forward * cosPitch + z * sinPitch };
  };
}
