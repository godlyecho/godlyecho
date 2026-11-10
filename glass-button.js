(() => {
 'use strict';
 const button=document.querySelector('#enterSite');
 // CSS blur/saturate remains the default, including file:// and non-Chromium engines.
 const chromium=/Chrome|Chromium|Edg\//.test(navigator.userAgent);
 if(!chromium||!CSS.supports('backdrop-filter','blur(8px)'))return;
 try{
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=96;
  const ctx=canvas.getContext('2d'),map=ctx.createImageData(256,96);
  for(let y=0;y<96;y++)for(let x=0;x<256;x++){
   const nx=(x-128)/128,ny=(y-48)/48,r=Math.min(1,Math.sqrt(nx*nx+ny*ny)),rim=Math.pow(r,3),i=(y*256+x)*4;
   map.data[i]=128+nx*rim*110;map.data[i+1]=128+ny*rim*110;map.data[i+2]=128;map.data[i+3]=255;
  }
  ctx.putImageData(map,0,0);
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.classList.add('glass-filter-defs');svg.setAttribute('aria-hidden','true');
  svg.innerHTML='<defs><filter id="entry-glass-filter" x="-20%" y="-50%" width="140%" height="200%" color-interpolation-filters="sRGB"><feImage width="100%" height="100%" preserveAspectRatio="none" result="lens-map"/><feDisplacementMap in="SourceGraphic" in2="lens-map" scale="16" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation="0.25"/></filter></defs>';
  svg.querySelector('feImage').setAttribute('href',canvas.toDataURL('image/png'));document.body.prepend(svg);document.documentElement.classList.add('has-svg-glass');button.dataset.glass='svg-displacement';
 }catch{button.dataset.glass='backdrop'}
})();
