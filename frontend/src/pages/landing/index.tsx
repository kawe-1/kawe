import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const navRef  = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    /* Make body scrollable while landing page is shown */
    const prev = { overflow: document.body.style.overflow, height: document.body.style.height };
    document.body.style.overflow = 'auto';
    document.body.style.height   = 'auto';
    document.body.classList.add('lp-active');

    /* Nav scroll indicator */
    const onScroll = () => navRef.current && navRef.current.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });

    /* Scroll reveal */
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12 });
    if (wrapRef.current) wrapRef.current.querySelectorAll('.rv').forEach(el => io.observe(el));

    return () => {
      document.body.style.overflow = prev.overflow;
      document.body.style.height   = prev.height;
      document.body.classList.remove('lp-active');
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
    };
  }, []);

  const heroSrc = 'hero.png'; // Make sure this asset exists or is copied

  /* Reusable logo mark */
  const LogoMark = ({sz = 28, col = 'currentColor'}) => (
    <svg width={sz} height={sz} viewBox="0 0 100 100" fill="none" strokeLinecap="round" aria-hidden="true">
      <line x1="50"  y1="41"  x2="50"  y2="16"  stroke="#F4A12B" strokeWidth="7"/>
      <line x1="55.2" y1="42.6" x2="62.6" y2="32"  stroke="#F4664A" strokeWidth="7"/>
      <line x1="58.5" y1="46.9" x2="76.3" y2="40.4" stroke={col}     strokeWidth="7"/>
      <line x1="42.6" y1="44.8" x2="28.7" y2="35.1" stroke={col}     strokeWidth="7"/>
      <line x1="41.5" y1="53.1" x2="21.8" y2="60.3" stroke="#C0512F" strokeWidth="7"/>
      <line x1="46.9" y1="58.5" x2="41.8" y2="72.6" stroke="#15635C" strokeWidth="7"/>
      <line x1="55.2" y1="57.4" x2="68.4" y2="76.2" stroke={col}     strokeWidth="7"/>
      <circle cx="50" cy="50" r="7" fill="#F4664A"/>
    </svg>
  );

  const features = [
    { bg:'color-mix(in srgb,#F4A12B 15%,transparent)', stroke:'#F4A12B',
      title:'Fused notes',
      body:'One set of notes from every source. Your slides, the YouTube explainer, the lecture audio: all woven into a single clear breakdown.',
      svgPath:<React.Fragment><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"/><circle cx="12" cy="12" r="2.2" fill="#F4664A" stroke="none"/></React.Fragment> },
    { bg:'color-mix(in srgb,#F4664A 15%,transparent)', stroke:'#F4664A',
      title:'Smart quizzes',
      body:'Questions that pull from all your materials at once. Miss a concept? Kawe tells you which source to revisit.',
      svgPath:<React.Fragment><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 12l2 2 4-4"/></React.Fragment> },
    { bg:'color-mix(in srgb,#C0512F 15%,transparent)', stroke:'#C0512F',
      title:'Flashcards',
      body:'Key terms from every source you uploaded, including concepts only mentioned once in that one lecture recording.',
      svgPath:<React.Fragment><rect x="3" y="6" width="14" height="10" rx="2"/><path d="M7 16v2h12a2 2 0 0 0 2-2V8"/></React.Fragment> },
    { bg:'color-mix(in srgb,#15635C 15%,transparent)', stroke:'#15635C',
      title:'Ask Kawe',
      body:'Chat with a tutor that has read all your uploads at once. Ask cross-source questions and get answers with citations.',
      svgPath:<React.Fragment><path d="M21 12a8 8 0 1 1-3-6.2L21 4"/><path d="M21 4v4h-4"/></React.Fragment> },
  ];

  const steps = [
    { n:'1', title:'Name your topic',    body:'Create a session for any course or subject. Biology Week 4, Machine Learning, anything.' },
    { n:'2', title:'Upload everything',  body:'PDFs, audio recordings, YouTube links, photos of notes. Any format, any order, all into one session.' },
    { n:'3', title:'Study the fusion',   body:'Get integrated notes, quizzes, flashcard decks, and a chat tutor. All drawing from every source at once.' },
  ];

  const pills = [
    { label:'PDF',   icon:<svg viewBox="0 0 24 24" fill="none" stroke="#C0512F" strokeWidth="2" strokeLinecap="round" width="13" height="13"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/></svg> },
    { label:'Audio', icon:<svg viewBox="0 0 24 24" fill="none" stroke="#C0512F" strokeWidth="2" strokeLinecap="round" width="13" height="13"><path d="M5 14v-3a7 7 0 0 1 14 0v3"/><rect x="3.5" y="13" width="4" height="6" rx="1.5"/><rect x="16.5" y="13" width="4" height="6" rx="1.5"/></svg> },
    { label:'Video', icon:<svg viewBox="0 0 24 24" fill="none" stroke="#C0512F" strokeWidth="2" strokeLinecap="round" width="13" height="13"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M11 9.5l4 2.5-4 2.5z" fill="#C0512F" stroke="none"/></svg> },
    { label:'Notes', icon:<svg viewBox="0 0 24 24" fill="none" stroke="#C0512F" strokeWidth="2" strokeLinecap="round" width="13" height="13"><path d="M5 4h11l3 3v13H5z"/><path d="M8 9h6M8 13h8M8 17h5"/></svg> },
  ];

  const onGetStarted = () => navigate('/auth');

  return (
    <div ref={wrapRef} style={{background:'var(--cream)',color:'var(--espresso)',fontFamily:'var(--sans)',WebkitFontSmoothing:'antialiased',overflowX:'hidden'}}>

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav className="nav" ref={navRef}>
        <div className="container nav-inner">
          <button className="nav-logo" style={{background:'none',border:'none',cursor:'pointer'}}>
            <LogoMark sz={28}/><span>kaw<span className="e">e</span></span>
          </button>
          <button className="btn btn-dark" onClick={onGetStarted}>Get started</button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="hero" aria-label="Hero">
        <div className="hero-art" aria-hidden="true">
          <img src={heroSrc} alt="" width="1456" height="816"/>
        </div>
        <div className="hero-body container">
          <div className="hero-content">
            <span className="eyebrow" style={{whiteSpace:'nowrap'}}>AI Study Companion</span>
            <h1 style={{margin:'16px 0 20px',lineHeight:'.96',letterSpacing:'-.035em',fontWeight:800,fontSize:'clamp(48px, 7vw, 88px)'}}>Every source.<br/>One understanding.</h1>
            <p className="sub" style={{margin:'0 0 30px',fontSize:'clamp(16px, 1.7vw, 19px)',color:'#3A2A21',maxWidth:460,lineHeight:1.62}}>Upload your lectures, notes, PDFs, and videos into a single session. Kawe reads everything together and gives you fused notes, quizzes, flashcards, and a tutor that knows it all.</p>
            <div className="hero-actions">
              <button className="btn btn-dark" onClick={onGetStarted}>Start studying</button>
              <a href="#how" className="btn btn-outline">See how it works</a>
            </div>
            <div className="pills">
              {pills.map((p, i) => (
                <React.Fragment key={p.label}>
                  <div className="pill">{p.icon}{p.label}</div>
                  {i < pills.length - 1 && <div className="pill-line"/>}
                </React.Fragment>
              ))}
              <div className="pill-line"/>
              <div className="pill-spark"><LogoMark sz={26} col="#F8F1E4"/></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-head centered rv">
            <span className="eyebrow">What you get</span>
            <h2 style={{margin:'12px 0 14px',fontSize:'clamp(30px, 4.5vw, 52px)'}}>One session, four superpowers.</h2>
            <p className="lead">Every output draws from all your sources at once. Nothing falls through the cracks.</p>
          </div>
          <div className="feat-grid">
            {features.map(f => (
              <div key={f.title} className="feat rv">
                <div className="feat-icon" style={{background:f.bg}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={f.stroke} strokeWidth="2" strokeLinecap="round" width="24" height="24">
                    {f.svgPath}
                  </svg>
                </div>
                <h3 style={{fontSize:19,marginBottom:8}}>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="section-divider"/>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="section" id="how">
        <div className="container">
          <div className="section-head centered rv">
            <span className="eyebrow">How it works</span>
            <h2 style={{margin:'12px 0 14px',fontSize:'clamp(30px, 4.5vw, 52px)'}}>Three steps to clarity.</h2>
            <p className="lead">From scattered materials to total understanding in under a minute.</p>
          </div>
          <div className="steps">
            {steps.map(s => (
              <div key={s.n} className="step rv">
                <div className="step-num">{s.n}</div>
                <h3 style={{fontSize:20,marginBottom:8}}>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ─────────────────────────────────────── */}
      <div className="cta-band rv">
        <div className="container">
          <h2 style={{marginBottom:14,fontSize:'clamp(28px, 4.5vw, 52px)',maxWidth:560}}>Your next exam<br/>deserves this.</h2>
          <p>All your learning materials, organized and ready when you are.</p>
          <button className="btn btn-amber" onClick={onGetStarted}>Get started free</button>
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="foot">
        <div className="container">
          <div className="foot-logo">
            <LogoMark sz={22}/>
            <span>kaw<span className="e">e</span></span>
          </div>
          <p>Built for students who learn from everywhere.</p>
        </div>
      </footer>

    </div>
  );
}
