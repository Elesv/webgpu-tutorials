struct VertexInput {
    @location(0) position: vec3<f32>,
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) direction: vec3<f32>,
};

struct Uniforms {
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
};

@group(0) @binding(0)
var emissiveSampler: sampler;

@group(0) @binding(1)
var emissiveTexture: texture_cube<f32>;

@group(0) @binding(2)
var<uniform> uniforms: Uniforms;

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.direction = input.position;

    let position = uniforms.projection * uniforms.view * vec4<f32>(input.position, 1.0);
    output.position = vec4<f32>(position.xy, position.w, position.w);

    return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
    let color = textureSample(
        emissiveTexture,
        emissiveSampler,
        normalize(input.direction)
    );

    return color;
}