export const dynamic = 'force-dynamic';

export async function GET() {
    const js = `(()=>{try{
    const s=document.currentScript; if(!s) return;
    const slug=s.dataset.slug; if(!slug){console.error('[MyReminder] data-slug missing');return;}
    const theme=s.dataset.theme||'default';
    const mode=s.dataset.mode||'full'; // full|compact
    const w=s.dataset.width|| (mode==='compact'?320:480);
    const h=s.dataset.height|| (mode==='compact'?120:200);
    const base=new URL(s.src, window.location.href).origin;
    const f=document.createElement('iframe');
    f.src=base+'/c/'+encodeURIComponent(slug)+'/embed?theme='+encodeURIComponent(theme)+'&mode='+encodeURIComponent(mode);
    f.width=w; f.height=h; f.style.border='0'; f.loading='lazy';
    s.parentNode.insertBefore(f,s);
  }catch(e){console.error('[MyReminder embed]',e);}})();`;
    return new Response(js, {
        headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control': 'public, max-age=86400, immutable',
        },
    });
}
