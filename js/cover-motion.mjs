// One opaque image surface: inverse warping avoids duplicate edges and trails.
export function mountCoverMotion(hero) {
 if(!hero || !window.matchMedia || !window.ResizeObserver)return ()=>{};
 const host=hero.querySelector('.cover-motion');
 const canvas=host.querySelector('canvas');
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 let gl;
 try{gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'low-power'});}catch{}
 if(!gl)return ()=>{};
 const vertex=`attribute vec2 position;varying vec2 uv;void main(){uv=vec2((position.x+1.)*.5,(1.-position.y)*.5);gl_Position=vec4(position,0.,1.);}`;
 const fragment=`precision highp float;
 varying vec2 uv;uniform sampler2D photo;uniform vec2 size;uniform vec4 rect;uniform float time;uniform float mobile;
 float band(float a,float b,float c,float d,float x){return smoothstep(a,b,x)*(1.-smoothstep(c,d,x));}
 void main(){
  vec2 p=(uv*size-rect.xy)/rect.zw;
  if(p.x<0.||p.x>1.||p.y<0.||p.y>1.){gl_FragColor=vec4(245./255.,241./255.,232./255.,1.);return;}
  // Pin stems at the vase; strongest motion at the flower tips.
  float flowers=mix(band(.66,.71,.99,1.04,p.x)*(1.-smoothstep(.08,.40,p.y)),band(.44,.50,.99,1.04,p.x)*band(.36,.40,.54,.615,p.y),mobile);
  float breeze=sin(time*.69)*.72+sin(time*1.38)*.18;
  vec2 q=p; q.x-=flowers*breeze*mix(.0028,.0045,mobile);
  q.y-=flowers*sin(time*.69+.4)*mix(.0007,.001,mobile);
  // A slow lift restricted to the right-hand leaf, anchored at the spine.
  float x0=mix(.715,.515,mobile), x1=mix(.956,.902,mobile);
  float along=clamp((p.x-x0)/(x1-x0),0.,1.);
  float top=mix(.655,.765,mobile)+along*mix(.035,.025,mobile);
  float bottom=mix(.845,.875,mobile)+along*mix(.058,.035,mobile);
  float leaf=band(x0,x0+.025,x1-.01,x1+.014,p.x)*band(top-.018,top+.012,bottom-.012,bottom+.016,p.y);
  float lift=pow(.5-.5*cos(time*.72),2.);
  q.y+=leaf*pow(along,.8)*lift*mix(.006,.0048,mobile);
  gl_FragColor=texture2D(photo,clamp(q,vec2(.0001),vec2(.9999)));
 }`;
 const shaders=[];let program,buffer,texture;
 try{
  for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
   const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);
   if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('shader');
  }
  program=gl.createProgram();shaders.forEach(s=>gl.attachShader(program,s));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('program');
  gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  for(const p of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,p,gl.CLAMP_TO_EDGE);
  for(const p of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,p,gl.LINEAR);
 }catch{shaders.forEach(s=>gl.deleteShader(s));if(program)gl.deleteProgram(program);return ()=>{};}
 const uniforms=Object.fromEntries(['size','rect','time','mobile'].map(k=>[k,gl.getUniformLocation(program,k)]));
 let image=null,source='',frame=0,dead=false,ready=false,elapsed=0,last=0,visible=true;
 const draw=t=>{
  frame=0;if(dead||!ready||motion.matches||document.hidden||!visible)return;
  if(last)elapsed+=Math.min(t-last,50)/1000;last=t;
  gl.uniform1f(uniforms.time,elapsed);gl.drawArrays(gl.TRIANGLES,0,6);
  host.dataset.ready='true';frame=requestAnimationFrame(draw);
 };
 const resume=()=>{cancelAnimationFrame(frame);last=0;if(!motion.matches&&!document.hidden&&visible&&ready)frame=requestAnimationFrame(draw);};
 function resize(){
  if(dead)return;
  const mobile=matchMedia('(max-width:700px)').matches;
  const next=new URL(`../assets/backgrounds/cover-lifestyle-${mobile?'mobile':'desktop'}.webp`,import.meta.url).href;
  if(source!==next){
   source=next;ready=false;delete host.dataset.ready;
   const loading=new Image();loading.onload=()=>{
    if(dead||source!==next)return;
    image=loading;gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);ready=true;resize();
   };loading.src=next;return;
  }
  if(!ready)return;
  const {width:w,height:h}=hero.getBoundingClientRect();
  const ratio=Math.min(devicePixelRatio||1,2,2400/Math.max(w,h));
  canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);gl.viewport(0,0,canvas.width,canvas.height);
  const scale=mobile?Math.max(w/image.width,h/image.height):h/image.height;
  const iw=image.width*scale,ih=image.height*scale;
  gl.uniform2f(uniforms.size,w,h);gl.uniform4f(uniforms.rect,mobile?(w-iw)/2:w-iw,h-ih,iw,ih);gl.uniform1f(uniforms.mobile,mobile?1:0);
  // Retain exactly the current CSS color grading above the image.
  host.style.setProperty('--cover-grade',getComputedStyle(hero).backgroundImage.replace(/,\s*url\([^)]*\)\s*$/,''));
  resume();
 }
 const observer=new ResizeObserver(resize);observer.observe(hero);
 const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();});intersection.observe(hero);
 const lost=event=>{event.preventDefault();ready=false;delete host.dataset.ready;cancelAnimationFrame(frame);};
 canvas.addEventListener('webglcontextlost',lost);
 motion.addEventListener('change',resume);document.addEventListener('visibilitychange',resume);resize();
 return ()=>{
  dead=true;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();motion.removeEventListener('change',resume);document.removeEventListener('visibilitychange',resume);canvas.removeEventListener('webglcontextlost',lost);
  gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
 };
}
