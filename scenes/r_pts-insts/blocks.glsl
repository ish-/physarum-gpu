uniform vec4[MAX_BLOCKS] uBlocks;

vec2 translate(vec2 samplePosition, vec2 offset){
    return samplePosition - offset;
}

float sdRoundedBox( in vec2 p, in vec2 b, in vec4 r ) {
    r.xy = (p.x>0.0)?r.xy : r.zw;
    r.x  = (p.y>0.0)?r.x  : r.y;
    vec2 q = abs(p)-b+r.x;
    return min(max(q.x,q.y),0.0) + length(max(q,0.0)) - r.x;
}

float sdBox( in vec2 p, in vec2 b ) {
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}