struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
};

@group(0) @binding(0)
var mySampler: sampler;

@group(0) @binding(1)
var myTexture: texture_2d<f32>;

@vertex
fn vertexMain(
    @location(0) position: vec3<f32>,
    @location(1) uv: vec2<f32>
) -> VertexOutput {
    var out: VertexOutput;
    out.position = vec4(position, 1.0);
    out.uv = uv;
    return out;
}

@fragment
fn fragmentMain(in: VertexOutput) -> @location(0) vec4<f32> {
    return textureSample(myTexture, mySampler, in.uv);
}
