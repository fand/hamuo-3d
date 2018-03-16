module.exports = `
varying vec2 vUv;
uniform mat3 uvTransform;

void main() {
	vUv = (uvTransform * vec3(uv, 1)).xy;
	vec3 objectNormal = vec3(normal);
	vec3 transformedNormal = normalMatrix * objectNormal;
	vec3 transformed = vec3(position);
	vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
	gl_Position = projectionMatrix * mvPosition;
}
`;
